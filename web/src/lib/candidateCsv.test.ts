import assert from "node:assert/strict";
import { parseCandidateCsv } from "./candidateCsv";
import { countryCodeForName, countryCodeFromText } from "./countryCodes";

const parsed = parseCandidateCsv('Name,Country\n"Doe, Jane",Philippines\nMai Tanaka,Japan\n');
assert.equal(parsed.errors.length, 0);
assert.deepEqual(parsed.rows.map((row) => [row.name, row.sash]), [["Doe, Jane", "PH"], ["Mai Tanaka", "JP"]]);
assert.equal(countryCodeForName("United States of America"), "US");
assert.equal(countryCodeFromText("Ayu Lestari — Indonesia"), "ID");

const invalid = parseCandidateCsv("Candidate,Nation\nAyu,Indonesia\n");
assert.equal(invalid.rows.length, 0);
assert.match(invalid.errors[0], /Name,Country/);

console.log("candidate CSV tests passed");
