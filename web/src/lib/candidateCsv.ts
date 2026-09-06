import { countryCodeForName } from "@/lib/countryCodes";

export type CandidateCsvRow = {
  name: string;
  country: string;
  sash: string;
  label: string;
};

export type CandidateCsvResult = {
  rows: CandidateCsvRow[];
  errors: string[];
};

function parseRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function parseCandidateCsv(input: string): CandidateCsvResult {
  const source = input.replace(/^\uFEFF/, "");
  const parsed = parseRows(source);
  const errors: string[] = [];
  if (!parsed.length) return { rows: [], errors: ["The CSV file is empty."] };

  const headers = parsed[0].map((cell) => cell.trim().toLowerCase());
  const nameIndex = headers.indexOf("name");
  const countryIndex = headers.indexOf("country");
  if (headers.length !== 2 || nameIndex < 0 || countryIndex < 0) {
    return { rows: [], errors: ['Use exactly two header columns: "Name,Country".'] };
  }

  const rows: CandidateCsvRow[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < parsed.length; index += 1) {
    const line = index + 1;
    const values = parsed[index];
    if (values.length !== 2) { errors.push(`Line ${line}: expected exactly two columns.`); continue; }
    const name = (values[nameIndex] ?? "").trim().slice(0, 120);
    const country = (values[countryIndex] ?? "").trim().slice(0, 80);
    if (!name || !country) { errors.push(`Line ${line}: both Name and Country are required.`); continue; }
    const sash = countryCodeForName(country);
    if (!sash) { errors.push(`Line ${line}: country “${country}” was not recognized.`); continue; }
    const key = `${name.toLowerCase()}|${sash}`;
    if (seen.has(key)) { errors.push(`Line ${line}: duplicate candidate “${name}”.`); continue; }
    seen.add(key);
    rows.push({ name, country, sash, label: `${name} — ${country}` });
  }
  return { rows, errors };
}
