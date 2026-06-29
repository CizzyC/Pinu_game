import fs from "node:fs";
import path from "node:path";

import { importRows } from "./db.mjs";
import { parseVocabularyWorkbook } from "./parser.mjs";
import { defaultDbPath } from "./paths.mjs";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npm run vocab:import -- <file> [sourceLanguage] [targetLanguage]");
  process.exit(1);
}

const sourceLanguage = process.argv[3] || "en";
const targetLanguage = process.argv[4] || "es";
const parsed = parseVocabularyWorkbook(fs.readFileSync(filePath), {
  fileName: path.basename(filePath),
  sourceLanguage,
  targetLanguage
});
const result = importRows(defaultDbPath, parsed.rows, {
  sourceFileName: path.basename(filePath),
  sourceLanguage,
  targetLanguage,
  warningCount: parsed.warnings.length
});

console.log(`Imported ${result.importedRows} rows into ${defaultDbPath}`);
if (parsed.warnings.length) {
  console.log(`Warnings: ${parsed.warnings.length}`);
}
