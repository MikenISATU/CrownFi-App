# Deployment contract for automation and LLM agents

Production deployment for this repository has exactly one supported path:

1. Test the Rust API and Next.js web application.
2. Build `api` and `web` with the full Git commit as their temporary tag.
3. Push them and capture registry-provided `sha256` digests.
4. Render `arcturus.release.json`; `db-init` uses the exact same web digest.
5. Submit `deployment-request.json` to `POST /v1/deployments` and require HTTP success **and** JSON `status: succeeded`.
6. Verify `arcturus-stellar-project.target`, component health, the active manifest, generated nginx route, and `https://stellar-project.u128.org`.

Never do any of the following for production:

- Do not use `/deploy`, Terraform apply/destroy, `null_resource`, or generated Compose files.
- Do not deploy `latest` or any tag as the final image reference.
- Do not create a second deployment architecture or manually replace containers.
- Do not write nginx configuration directly. Routing comes from `spec.routing` in the active v2 release.
- Do not put secret values in Git, workflows, manifests, command arguments, or logs.
- Do not allow Compose/Watchtower and Quadlet to own the production service simultaneously.

Every component referenced by `spec.routing` must join `internal_routing`; the
route port is the container's listening port, not a host-published port. Wait for
the active manifest to be published and the generated portal vhost to appear.

`compose.yaml` and `infra/docker-compose.yml` are local/emergency compatibility files only. Terraform may manage long-lived infrastructure but never an application release. Existing database data is the external Podman volume `crownfi-platform_crownfi_postgres`; deployment and rollback must never delete it.

If deployment fails, inspect the API response and systemd journals. Do not fall back to the legacy path. Fix the v2 manifest or image and redeploy.
