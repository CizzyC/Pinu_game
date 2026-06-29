import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { exportVocabularyJson } from "../tools/vocab-admin/src/exporter.mjs";
import { initDatabase, importRows, searchVocabulary } from "../tools/vocab-admin/src/db.mjs";
import { parseVocabularyWorkbook } from "../tools/vocab-admin/src/parser.mjs";

const rootDir = path.resolve(import.meta.dirname, "..");
const sourceCsv = path.join(rootDir, "s1-u1u2单词.csv");

test("parses the current CSV with accents, empty-row cleanup, and cell newline cleanup", () => {
  const parsed = parseVocabularyWorkbook(fs.readFileSync(sourceCsv), {
    fileName: "s1-u1u2单词.csv",
    sourceLanguage: "en",
    targetLanguage: "es"
  });

  assert.equal(parsed.rows.length, 18);
  assert.deepEqual(parsed.unitCodes, ["s1u1", "s1u2"]);
  assert.ok(parsed.rows.some((row) => row.sourceText === "coffee" && row.targetText === "café"));
  assert.ok(parsed.rows.some((row) => row.sourceText === "what" && row.targetText === "qué"));
  assert.ok(parsed.rows.some((row) => row.sourceText === "good" && row.targetText === "bueno"));
  assert.ok(parsed.warnings.some((warning) => warning.message.includes("por favoe")));
});

test("parses multiple workbook sheets into inferred language pairs", async () => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["单元", "单词", "释义"],
      ["s1u1", "coffee", "café"],
      ["s1u1", "tea", "té"]
    ]),
    "西学英"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["单元", "西语单词", "英文释义"],
      ["s1u1", "día", "morning"],
      ["s1u1", "noche", "night"]
    ]),
    "英学西"
  );

  const parsed = parseVocabularyWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), {
    fileName: "multi-sheet.xlsx"
  });

  assert.equal(parsed.rows.length, 4);
  assert.deepEqual(
    parsed.sheets.map((sheet) => [sheet.sheetName, sheet.languagePair, sheet.rowCount]),
    [
      ["西学英", "en-es", 2],
      ["英学西", "es-en", 2]
    ]
  );
  assert.ok(parsed.rows.some((row) => row.sourceLanguage === "en" && row.targetLanguage === "es" && row.sourceText === "coffee"));
  assert.ok(parsed.rows.some((row) => row.sourceLanguage === "es" && row.targetLanguage === "en" && row.sourceText === "día"));
});

test("imports rows into SQLite, supports multilingual search, and exports both language directions", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pinu-vocab-"));
  const dbPath = path.join(tempDir, "pinu_vocab.sqlite");
  const parsed = parseVocabularyWorkbook(fs.readFileSync(sourceCsv), {
    fileName: "s1-u1u2单词.csv",
    sourceLanguage: "en",
    targetLanguage: "es"
  });

  initDatabase(dbPath);
  const result = importRows(dbPath, parsed.rows, {
    sourceFileName: "s1-u1u2单词.csv",
    sourceLanguage: "en",
    targetLanguage: "es",
    warningCount: parsed.warnings.length
  });

  assert.equal(result.importedRows, 18);

  const englishSearch = searchVocabulary(dbPath, { keyword: "coffee" });
  assert.ok(englishSearch.some((item) => item.sourceText === "coffee" && item.targetText === "café"));

  const spanishSearch = searchVocabulary(dbPath, { keyword: "café" });
  assert.ok(spanishSearch.some((item) => item.sourceText === "coffee" && item.targetText === "café"));

  const esEn = exportVocabularyJson(dbPath, {
    languagePair: "es-en",
    unitCodes: ["s1u1", "s1u2"]
  });
  assert.equal(esEn.languagePair, "es-en");
  assert.equal(esEn.sourceLanguage, "es");
  assert.equal(esEn.targetLanguage, "en");
  assert.ok(esEn.items.some((item) => item.prompt === "café" && item.answer === "coffee"));

  const enEs = exportVocabularyJson(dbPath, {
    languagePair: "en-es",
    unitCodes: ["s1u1", "s1u2"]
  });
  assert.equal(enEs.languagePair, "en-es");
  assert.ok(enEs.items.some((item) => item.prompt === "coffee" && item.answer === "café"));
});

test("imports mixed-language sheets using each row language pair", async () => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["单元", "单词", "释义"],
      ["s1u1", "coffee", "café"]
    ]),
    "西学英"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["单元", "西语单词", "英文释义"],
      ["s1u1", "día", "morning"]
    ]),
    "英学西"
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pinu-vocab-mixed-"));
  const dbPath = path.join(tempDir, "pinu_vocab.sqlite");
  const parsed = parseVocabularyWorkbook(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }), {
    fileName: "multi-sheet.xlsx"
  });

  initDatabase(dbPath);
  importRows(dbPath, parsed.rows, {
    sourceFileName: "multi-sheet.xlsx",
    warningCount: parsed.warnings.length
  });

  const enEs = exportVocabularyJson(dbPath, { languagePair: "en-es", unitCodes: ["s1u1"] });
  const esEn = exportVocabularyJson(dbPath, { languagePair: "es-en", unitCodes: ["s1u1"] });

  assert.equal(enEs.items.length, 1);
  assert.equal(esEn.items.length, 1);
  assert.ok(enEs.items.some((item) => item.prompt === "coffee" && item.answer === "café"));
  assert.ok(esEn.items.some((item) => item.prompt === "día" && item.answer === "morning"));
});
