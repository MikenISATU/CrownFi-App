import { readFileSync } from "node:fs";
const response = JSON.parse(readFileSync(process.argv[2] || "deployment-response.json", "utf8"));
if (response.status !== "succeeded") {
  console.error(JSON.stringify({status: response.status, error: response.error, rollback: response.rollback}));
  process.exit(1);
}
console.log(JSON.stringify({status: response.status, deployment_id: response.deployment_id, images: response.images}));
