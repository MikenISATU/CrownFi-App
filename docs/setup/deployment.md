# CrownFi Deploy

The full smart-contract deploy runbook now lives in **[contracts/DEPLOY_GUIDE.md](../../contracts/DEPLOY_GUIDE.md)**
(install → deploy → wire the web app → go live → troubleshooting → per-contract function reference).

- **Contracts (deploy to Stellar Testnet):** [contracts/DEPLOY_GUIDE.md](../../contracts/DEPLOY_GUIDE.md)
  or the one-command script [contracts/deploy.ps1](../../contracts/deploy.ps1).
- **Database (Supabase):** [Supabase setup](supabase.md)
- **Run & use the app (fan + admin flows):** [Demo user flow](../demo/user-flow.md)

## VPS application deployment

The only production VPS release contract is `arcturus.release.json` and
`POST /v1/deployments`. CI tests first, builds the API and web images with the
full commit SHA, resolves registry digests, renders the five-component release,
and requires JSON `status: succeeded`.

Compose files are for local or emergency compatibility only. Terraform does
not own application releases. Routing for `stellar-project.u128.org` is emitted
from `spec.routing` after the release is active; never edit nginx directly.

See the repository-root `AGENTS.md` before changing CI or deployment files.
