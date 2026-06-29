import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import express from "express";
import multer from "multer";

import { exportVocabularyJson } from "./exporter.mjs";
import { importRows, initDatabase, listLanguagePairs, searchVocabulary } from "./db.mjs";
import { parseVocabularyWorkbook } from "./parser.mjs";
import { defaultDbPath, defaultUnitRange, outputPathForVocabulary } from "./paths.mjs";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const previews = new Map();
const publicDir = path.resolve(import.meta.dirname, "../public");
const port = Number(process.env.PORT || 5177);

initDatabase(defaultDbPath);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicDir));

app.post("/api/preview", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) throw new Error("No file uploaded.");
    const sourceLanguage = req.body.sourceLanguage || "en";
    const targetLanguage = req.body.targetLanguage || "es";
    const parsed = parseVocabularyWorkbook(req.file.buffer, {
      fileName: req.file.originalname,
      sourceLanguage,
      targetLanguage
    });
    const previewId = crypto.randomUUID();
    previews.set(previewId, parsed);
    res.json({
      previewId,
      fileName: parsed.fileName,
      sheetName: parsed.sheetName,
      sheets: parsed.sheets,
      rowCount: parsed.rows.length,
      unitCodes: parsed.unitCodes,
      warnings: parsed.warnings,
      rows: parsed.rows
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/import", (req, res, next) => {
  try {
    const parsed = previews.get(req.body.previewId);
    if (!parsed) throw new Error("Preview expired. Upload the file again.");
    const result = importRows(defaultDbPath, parsed.rows, {
      sourceFileName: parsed.fileName,
      sourceLanguage: parsed.rows[0]?.sourceLanguage || "en",
      targetLanguage: parsed.rows[0]?.targetLanguage || "es",
      warningCount: parsed.warnings.length
    });
    res.json({ ...result, dbPath: defaultDbPath });
  } catch (error) {
    next(error);
  }
});

app.get("/api/search", (req, res, next) => {
  try {
    res.json({
      languagePairs: listLanguagePairs(defaultDbPath),
      rows: searchVocabulary(defaultDbPath, {
        languagePair: req.query.languagePair,
        sourceLanguage: req.query.sourceLanguage,
        targetLanguage: req.query.targetLanguage,
        unitCode: req.query.unitCode,
        keyword: req.query.keyword
      })
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/export", (req, res, next) => {
  try {
    const languagePair = req.body.languagePair || "es-en";
    const unitCodes = Array.isArray(req.body.unitCodes) && req.body.unitCodes.length ? req.body.unitCodes : defaultUnitRange;
    const payload = exportVocabularyJson(defaultDbPath, { languagePair, unitCodes });
    const outputPath = outputPathForVocabulary(languagePair, unitCodes);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    res.json({ outputPath, itemCount: payload.items.length, payload });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || "Vocabulary admin error." });
});

app.listen(port, () => {
  console.log(`Pinu vocabulary admin running at http://localhost:${port}`);
  console.log(`SQLite database: ${defaultDbPath}`);
});
