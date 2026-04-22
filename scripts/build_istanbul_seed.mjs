// Build Istanbul neighborhoods seed SQL from bertugfahriozer/il_ilce_mahalle dataset.
// Run: node scripts/build_istanbul_seed.mjs
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("tmp_il_ilce_mahalle.json");
const OUT = path.resolve("supabase/seeds/istanbul_neighborhoods.sql");
const SOURCE_URL =
  "https://raw.githubusercontent.com/bertugfahriozer/il_ilce_mahalle/master/il_ilce_mahalle.json";

// Authoritative district names in the DB (as given by the caller).
const DB_DISTRICTS = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler",
  "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü",
  "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt",
  "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane",
  "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
  "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla",
  "Ümraniye", "Üsküdar", "Zeytinburnu",
];

// Normalize for loose comparison (accent-fold + lowercase + strip non-letters).
function fold(s) {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]/g, "");
}

// Extra aliases -> canonical DB district name.
const DISTRICT_ALIAS = {
  "eyup": "Eyüpsultan",
  "eyupsultan": "Eyüpsultan",
  "uskudar": "Üsküdar",
  "umraniye": "Ümraniye",
  "sisli": "Şişli",
  "sile": "Şile",
  "sariyer": "Sarıyer",
};

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));

// Istanbul key
const istKey = Object.keys(raw).find((k) => fold(k) === "istanbul");
if (!istKey) throw new Error("Istanbul key not found in source");
const istanbul = raw[istKey];

// Build a fold -> DB-name map
const foldToDb = new Map();
for (const d of DB_DISTRICTS) foldToDb.set(fold(d), d);
for (const [alias, canon] of Object.entries(DISTRICT_ALIAS))
  foldToDb.set(fold(alias), canon);

function resolveDistrict(srcName) {
  const key = fold(srcName);
  if (foldToDb.has(key)) return foldToDb.get(key);
  return null;
}

// Clean neighborhood name:
//   Strip trailing " Mah.", " Mahallesi", " MAH", etc.
//   Convert ALL-CAPS (Turkish) to Title Case while preserving Turkish chars.
function stripSuffix(name) {
  let s = name.trim();
  // Repeated just in case ("X Mah. Mah.")
  for (let i = 0; i < 3; i++) {
    const before = s;
    s = s.replace(/\s+(Mah\.|Mahallesi|MAH\.?|MAHALLESİ|mahallesi|mah\.?)\s*$/u, "");
    if (s === before) break;
  }
  return s.trim();
}

function titleCaseTr(s) {
  // Lowercase (tr) then capitalize first letter of each word.
  const lower = s.toLocaleLowerCase("tr");
  return lower.replace(/(^|[\s\-'/()])([\p{L}\p{N}])/gu, (_, sep, ch) =>
    sep + ch.toLocaleUpperCase("tr")
  );
}

function cleanName(name) {
  const stripped = stripSuffix(name);
  // If mostly uppercase, title-case it. Otherwise leave it alone.
  const letters = stripped.replace(/[^\p{L}]/gu, "");
  const uppers = letters.replace(/[^\p{Lu}]/gu, "");
  const isUpper = letters.length > 0 && uppers.length / letters.length >= 0.7;
  const out = isUpper ? titleCaseTr(stripped) : stripped;
  return out.replace(/\s+/g, " ").trim();
}

// Build pairs, deduped within each district.
const pairs = [];
const missingDistricts = [];
const byDistrict = new Map(); // dbName -> Set of names

for (const [srcDistrict, mahs] of Object.entries(istanbul)) {
  const db = resolveDistrict(srcDistrict);
  if (!db) {
    missingDistricts.push(srcDistrict);
    continue;
  }
  if (!byDistrict.has(db)) byDistrict.set(db, new Set());
  const set = byDistrict.get(db);
  for (const m of mahs) {
    const clean = cleanName(m);
    if (!clean) continue;
    set.add(clean);
  }
}

// Stable ordering: districts in DB order, names alphabetically (tr).
const sortedDistricts = DB_DISTRICTS.filter((d) => byDistrict.has(d));
let total = 0;
for (const d of sortedDistricts) {
  const arr = [...byDistrict.get(d)].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  for (const n of arr) pairs.push([d, n]);
  total += arr.length;
}

// SQL escape single quote
const q = (s) => s.replace(/'/g, "''");

// Build VALUES lines
const lines = pairs.map(
  ([d, n], i) => `  ('${q(d)}', '${q(n)}')${i === pairs.length - 1 ? "" : ","}`
);

const perDistrictReport = sortedDistricts
  .map((d) => `--   ${d.padEnd(16, " ")} ${byDistrict.get(d).size}`)
  .join("\n");

const missingReport = DB_DISTRICTS
  .filter((d) => !byDistrict.has(d))
  .map((d) => `--   ${d}`)
  .join("\n");

const sql = `-- Istanbul mahalle seed (${total} kayıt)
-- Kaynak: ${SOURCE_URL}
-- Üretim: scripts/build_istanbul_seed.mjs
-- Not: districts tablosu zaten seed edilmiş durumda (39 ilçe).
-- İlçe bazlı mahalle sayısı:
${perDistrictReport}
${
  missingReport
    ? `-- UYARI: kaynakta karşılığı bulunamayan DB ilçeleri:\n${missingReport}\n`
    : ""
}-- Ad temizliği: "Mah.", "Mahallesi", "MAH" gibi sonekler ayıklandı; büyük harfle
-- yazılmış adlar title-case'e çevrildi (Türkçe kurallarına göre). Örn:
--   "CİHANGİR Mah."  -> "Cihangir"
--   "KUZGUNCUK Mah." -> "Kuzguncuk"

insert into public.neighborhoods (district_id, name)
select d.id, v.name
from public.districts d
join (values
${lines.join("\n")}
) as v(district_name, name) on d.name = v.district_name
on conflict (district_id, name) do nothing;
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql, "utf8");

console.log(`Wrote ${OUT}`);
console.log(`Total neighborhoods: ${total}`);
console.log(`Districts covered: ${sortedDistricts.length}/${DB_DISTRICTS.length}`);
if (missingDistricts.length)
  console.log(`Unmatched source districts: ${JSON.stringify(missingDistricts)}`);
const missingDb = DB_DISTRICTS.filter((d) => !byDistrict.has(d));
if (missingDb.length)
  console.log(`DB districts with no data: ${JSON.stringify(missingDb)}`);
for (const d of sortedDistricts) {
  console.log(`  ${d}: ${byDistrict.get(d).size}`);
}
