import { readFileSync, writeFileSync } from "node:fs";

const [templatePath, revision, apiDigestPath, webDigestPath] = process.argv.slice(2);
if (![templatePath, revision, apiDigestPath, webDigestPath].every(Boolean)) {
  throw new Error("usage: render-release.mjs <template> <revision> <api-digest> <web-digest>");
}
if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("revision must be a lowercase 40-character Git SHA");
const readDigest = (path) => {
  const digest = readFileSync(path, "utf8").trim();
  if (!/^sha256:[0-9a-f]{64}$/.test(digest)) throw new Error(`invalid registry digest in ${path}`);
  return digest;
};
const manifest = JSON.parse(readFileSync(templatePath, "utf8"));
manifest.metadata.revision = revision;
manifest.spec.components.api.image = `git.u128.org/mprojects/stellar-project/api@${readDigest(apiDigestPath)}`;
const webImage = `git.u128.org/mprojects/stellar-project/web@${readDigest(webDigestPath)}`;
manifest.spec.components.web.image = webImage;
manifest.spec.components["db-init"].image = webImage;
for (const [name, component] of Object.entries(manifest.spec.components)) {
  if (!/@sha256:[0-9a-f]{64}$/.test(component.image)) throw new Error(`${name} is not digest pinned`);
}
writeFileSync("release.json", JSON.stringify(manifest, null, 2) + "\n");
writeFileSync("deployment-request.json", JSON.stringify({service: "stellar-project", commit_sha: revision, manifest}, null, 2) + "\n");
