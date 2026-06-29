import { searchVocabulary } from "./db.mjs";
import { parseLanguagePair, slugify } from "./text.mjs";

export function exportVocabularyJson(dbPath, options = {}) {
  const { sourceLanguage, targetLanguage } = parseLanguagePair(options.languagePair || "es-en");
  const unitCodes = options.unitCodes || [];
  const rows = searchVocabulary(dbPath, {
    languagePair: `${sourceLanguage}-${targetLanguage}`,
    sourceLanguage,
    targetLanguage
  }).filter((row) => unitCodes.length === 0 || unitCodes.includes(row.unit));

  return {
    languagePair: `${sourceLanguage}-${targetLanguage}`,
    sourceLanguage,
    targetLanguage,
    courseCode: options.courseCode || "pinu",
    unitRange: unitCodes,
    items: rows.map((row) => ({
      id: `${row.unit}-${slugify(row.sourceText)}-${slugify(row.targetText)}`,
      unit: row.unit,
      prompt: row.sourceText,
      answer: row.targetText,
      audio: row.audio || ""
    }))
  };
}
