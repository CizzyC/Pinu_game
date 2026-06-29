import fs from "node:fs";
import path from "node:path";

import { exportVocabularyJson } from "./exporter.mjs";
import { defaultDbPath, defaultUnitRange, outputPathForVocabulary } from "./paths.mjs";

const languagePair = process.argv[2] || "es-en";
const unitCodes = (process.argv[3] || defaultUnitRange.join(",")).split(",").map((unit) => unit.trim()).filter(Boolean);
const outputPath = process.argv[4] || outputPathForVocabulary(languagePair, unitCodes);

const payload = exportVocabularyJson(defaultDbPath, { languagePair, unitCodes });
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Exported ${payload.items.length} items to ${outputPath}`);
