export function cleanCell(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(value) {
  return cleanCell(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseLanguagePair(languagePair) {
  const [sourceLanguage, targetLanguage] = String(languagePair || "").split("-");
  if (!sourceLanguage || !targetLanguage) {
    throw new Error(`Invalid language pair: ${languagePair}`);
  }
  return { sourceLanguage, targetLanguage };
}
