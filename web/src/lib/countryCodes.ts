// Resolve human country names to ISO-3166 alpha-2 codes without a runtime API.
// Modern browsers and Node already ship the localized region names through Intl,
// while aliases cover common pageant/CSV naming variants.

const ALIASES: Record<string, string> = {
  "united states of america": "US",
  "united states": "US",
  usa: "US",
  "u s a": "US",
  "united kingdom": "GB",
  "great britain": "GB",
  uk: "GB",
  russia: "RU",
  "south korea": "KR",
  "republic of korea": "KR",
  "north korea": "KP",
  "democratic peoples republic of korea": "KP",
  vietnam: "VN",
  laos: "LA",
  syria: "SY",
  moldova: "MD",
  bolivia: "BO",
  venezuela: "VE",
  iran: "IR",
  tanzania: "TZ",
  brunei: "BN",
  "cape verde": "CV",
  "ivory coast": "CI",
  "democratic republic of the congo": "CD",
  "dr congo": "CD",
  "republic of the congo": "CG",
  palestine: "PS",
  taiwan: "TW",
  kosovo: "XK",
  "czech republic": "CZ",
  eswatini: "SZ",
  "east timor": "TL",
  macedonia: "MK",
  micronesia: "FM",
  burma: "MM",
  "vatican city": "VA",
};

export function normalizeCountryName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
let countryEntries: { name: string; code: string }[] | null = null;

function entries(): { name: string; code: string }[] {
  if (countryEntries) return countryEntries;
  const names = new Map<string, string>(Object.entries(ALIASES));
  const display = new Intl.DisplayNames(["en"], { type: "region" });

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first, second);
      const label = display.of(code) ?? "";
      if (!label || label === code || /unknown region/i.test(label)) continue;
      names.set(normalizeCountryName(label), code);
    }
  }

  names.set("kosovo", "XK");
  countryEntries = [...names.entries()]
    .filter(([name]) => Boolean(name))
    .map(([name, code]) => ({ name, code }))
    .sort((a, b) => b.name.length - a.name.length);
  return countryEntries;
}

export function countryCodeForName(value: string): string | null {
  const normalized = normalizeCountryName(value);
  if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();
  return entries().find((entry) => entry.name === normalized)?.code ?? null;
}

export function countryCodeFromText(value: string): string | null {
  const normalized = normalizeCountryName(value);
  const padded = ` ${normalized} `;
  const match = entries().find((entry) => padded.includes(` ${entry.name} `));
  return match?.code ?? null;
}
