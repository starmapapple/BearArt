export const FALLBACK_PROVINCES = [
  { id: "31", name: "DKI JAKARTA" },
  { id: "32", name: "JAWA BARAT" },
  { id: "33", name: "JAWA TENGAH" },
  { id: "34", name: "DI YOGYAKARTA" },
  { id: "35", name: "JAWA TIMUR" },
  { id: "36", name: "BANTEN" },
  { id: "51", name: "BALI" },
  { id: "73", name: "SULAWESI SELATAN" }
];

export const FALLBACK_REGENCIES = {
  "31": [
    { id: "3171", name: "KOTA JAKARTA SELATAN" },
    { id: "3172", name: "KOTA JAKARTA TIMUR" },
    { id: "3173", name: "KOTA JAKARTA PUSAT" },
    { id: "3174", name: "KOTA JAKARTA BARAT" },
    { id: "3175", name: "KOTA JAKARTA UTARA" }
  ],
  "32": [
    { id: "3273", name: "KOTA BANDUNG" },
    { id: "3275", name: "KOTA BEKASI" },
    { id: "3276", name: "KOTA DEPOK" },
    { id: "3201", name: "KABUPATEN BOGOR" },
    { id: "3216", name: "KABUPATEN BEKASI" }
  ],
  "33": [
    { id: "3374", name: "KOTA SEMARANG" },
    { id: "3372", name: "KOTA SURAKARTA" },
    { id: "3302", name: "KABUPATEN BANYUMAS" },
    { id: "3322", name: "KABUPATEN SEMARANG" }
  ],
  "34": [
    { id: "3471", name: "KOTA YOGYAKARTA" },
    { id: "3404", name: "KABUPATEN SLEMAN" },
    { id: "3402", name: "KABUPATEN BANTUL" }
  ],
  "35": [
    { id: "3578", name: "KOTA SURABAYA" },
    { id: "3573", name: "KOTA MALANG" },
    { id: "3571", name: "KOTA KEDIRI" },
    { id: "3515", name: "KABUPATEN SIDOARJO" }
  ],
  "36": [
    { id: "3671", name: "KOTA TANGERANG" },
    { id: "3674", name: "KOTA TANGERANG SELATAN" },
    { id: "3673", name: "KOTA SERANG" },
    { id: "3603", name: "KABUPATEN TANGERANG" }
  ],
  "51": [
    { id: "5171", name: "KOTA DENPASAR" },
    { id: "5103", name: "KABUPATEN BADUNG" },
    { id: "5104", name: "KABUPATEN GIANYAR" }
  ],
  "73": [
    { id: "7371", name: "KOTA MAKASSAR" },
    { id: "7372", name: "KOTA PAREPARE" },
    { id: "7306", name: "KABUPATEN GOWA" }
  ]
};

export function normalizeRegionList(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          id: String(item.id || "").trim(),
          name: String(item.name || "").trim()
        }))
        .filter((item) => item.id && item.name)
    : [];
}

export function findProvinceByName(provinces, value) {
  const normalized = normalizeRegionName(value);
  return provinces.find((province) => normalizeRegionName(province.name) === normalized) || null;
}

export function findRegencyByName(regencies, value) {
  const normalized = normalizeRegionName(value);
  return (
    regencies.find((regency) => normalizeRegionName(regency.name) === normalized) ||
    regencies.find((regency) => normalizeRegionName(regency.name).includes(normalized) || normalized.includes(normalizeRegionName(regency.name))) ||
    null
  );
}

export function normalizeRegionName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/^SPECIAL CAPITAL REGION OF\s+/, "")
    .replace(/^DAERAH KHUSUS IBUKOTA\s+/, "")
    .replace(/^PROVINCE OF\s+/, "")
    .replace(/^PROVINSI\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}
