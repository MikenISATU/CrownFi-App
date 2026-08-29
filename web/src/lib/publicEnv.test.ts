import { normalizeEnvValue, normalizeHttpOrigin, normalizeHttpUrl, normalizePrivyAppId } from "./publicEnv";

function check(condition: unknown, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok: ${message}`);
}

const validPrivyId = `cm${"a".repeat(23)}`;

check(normalizePrivyAppId(validPrivyId) === validPrivyId, "accepts a 25-character Privy App ID");
check(normalizePrivyAppId(`\"${validPrivyId}\"`) === validPrivyId, "removes quotes copied from an env file");
check(normalizePrivyAppId(`  ${validPrivyId}  `) === validPrivyId, "removes accidental surrounding whitespace");
check(normalizePrivyAppId("your-privy-app-id") === null, "rejects the documented placeholder");
check(normalizePrivyAppId(undefined) === null, "allows Privy to remain optional");
check(normalizeEnvValue("  'value'  ") === "value", "normalizes a quoted environment value");
check(normalizeEnvValue('"0xabc,0xdef"') === "0xabc,0xdef", "normalizes a quoted comma-separated allowlist");
check(normalizeHttpUrl('"https://crownfi.example/"') === "https://crownfi.example", "normalizes a quoted HTTPS origin");
check(normalizeHttpOrigin("https://crownfi.example/unwanted/path") === "https://crownfi.example", "removes paths from an app origin");
check(normalizeHttpUrl("not-a-url") === null, "rejects an invalid public URL");
check(normalizeHttpUrl("javascript:alert(1)") === null, "rejects a non-HTTP URL");

console.log("\nAll public environment checks passed.");
