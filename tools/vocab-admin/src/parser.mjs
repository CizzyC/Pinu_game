import XLSX from "xlsx";

import { cleanCell, normalizeText } from "./text.mjs";

const DEFAULT_HEADERS = {
  unit: ["unit", "单元", "unit_code"],
  source: ["word", "单词", "english", "en"],
  target: ["meaning", "释义", "spanish", "es"]
};

export function parseVocabularyWorkbook(buffer, options = {}) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: false,
    cellText: true
  });
  if (!workbook.SheetNames.length) {
    throw new Error("No worksheet found in uploaded vocabulary file.");
  }

  const parsedSheets = workbook.SheetNames.map((sheetName) => parseSheet(workbook.Sheets[sheetName], sheetName, options));
  const rows = parsedSheets.flatMap((sheet) => sheet.rows);
  const warnings = parsedSheets.flatMap((sheet) => sheet.warnings);

  return {
    fileName: options.fileName || "uploaded-vocabulary",
    sheetName: parsedSheets[0]?.sheetName || "",
    sheets: parsedSheets.map((sheet) => ({
      sheetName: sheet.sheetName,
      sourceLanguage: sheet.sourceLanguage,
      targetLanguage: sheet.targetLanguage,
      languagePair: `${sheet.sourceLanguage}-${sheet.targetLanguage}`,
      rowCount: sheet.rows.length,
      warningCount: sheet.warnings.length,
      unitCodes: [...new Set(sheet.rows.map((row) => row.unitCode))]
    })),
    rows,
    warnings,
    unitCodes: [...new Set(rows.map((row) => row.unitCode))]
  };
}

function parseSheet(sheet, sheetName, options) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });
  const [headerRow = [], ...bodyRows] = rows;
  const columnMap = resolveColumnMap(headerRow, options.columnMap);
  const languagePair = inferSheetLanguagePair(sheetName, headerRow, options);
  const parsedRows = [];
  const warnings = [];
  let currentUnit = "";

  bodyRows.forEach((row, bodyIndex) => {
    const rowNumber = bodyIndex + 2;
    const firstCell = cleanCell(row[columnMap.unit]);
    const secondCell = cleanCell(row[columnMap.source]);
    const thirdCell = cleanCell(row[columnMap.target]);
    const rowStartsUnit = isUnitCode(firstCell) && thirdCell;
    const unitValue = rowStartsUnit ? firstCell : "";
    const sourceText = rowStartsUnit ? secondCell : firstCell;
    const targetText = rowStartsUnit ? thirdCell : secondCell;

    if (unitValue) currentUnit = unitValue;
    if (!unitValue && !sourceText && !targetText) return;

    if (!currentUnit || !sourceText || !targetText) {
      warnings.push({
        rowNumber,
        level: "error",
        message: `${sheetName} row ${rowNumber} is missing ${!currentUnit ? "unit" : !sourceText ? "source text" : "target text"}.`
      });
      return;
    }

    if (normalizeText(targetText) === "por favoe") {
      warnings.push({
        rowNumber,
        level: "warning",
        message: `${sheetName} possible typo: target text is 'por favoe'.`
      });
    }

    parsedRows.push({
      sheetName,
      unitCode: currentUnit,
      sourceLanguage: languagePair.sourceLanguage,
      targetLanguage: languagePair.targetLanguage,
      sourceText,
      targetText
    });
  });

  return {
    sheetName,
    rows: parsedRows,
    warnings,
    sourceLanguage: languagePair.sourceLanguage,
    targetLanguage: languagePair.targetLanguage
  };
}

function inferSheetLanguagePair(sheetName, headerRow, options) {
  if (options.sourceLanguage && options.targetLanguage && sheetName === "Sheet1") {
    return { sourceLanguage: options.sourceLanguage, targetLanguage: options.targetLanguage };
  }

  const normalizedName = normalizeText(sheetName);
  if (normalizedName.includes("西学英")) return { sourceLanguage: "en", targetLanguage: "es" };
  if (normalizedName.includes("英学西")) return { sourceLanguage: "es", targetLanguage: "en" };

  const headers = headerRow.map((header) => normalizeText(header)).join("|");
  if (headers.includes("西语单词") && headers.includes("英文释义")) {
    return { sourceLanguage: "es", targetLanguage: "en" };
  }
  if (headers.includes("英文单词") && headers.includes("西语释义")) {
    return { sourceLanguage: "en", targetLanguage: "es" };
  }
  if (headers.includes("spanish") && headers.includes("english")) {
    return headers.indexOf("spanish") < headers.indexOf("english")
      ? { sourceLanguage: "es", targetLanguage: "en" }
      : { sourceLanguage: "en", targetLanguage: "es" };
  }

  return {
    sourceLanguage: options.sourceLanguage || "en",
    targetLanguage: options.targetLanguage || "es"
  };
}

function isUnitCode(value) {
  return /^s\d+u\d+$/i.test(cleanCell(value));
}

function resolveColumnMap(headerRow, explicitMap) {
  if (explicitMap) {
    return explicitMap;
  }

  const normalizedHeaders = headerRow.map((header) => normalizeText(header));
  return {
    unit: findColumn(normalizedHeaders, DEFAULT_HEADERS.unit, 0),
    source: findColumn(normalizedHeaders, DEFAULT_HEADERS.source, 1),
    target: findColumn(normalizedHeaders, DEFAULT_HEADERS.target, 2)
  };
}

function findColumn(normalizedHeaders, names, fallback) {
  const normalizedNames = names.map((name) => normalizeText(name));
  const index = normalizedHeaders.findIndex((header) => normalizedNames.includes(header));
  return index >= 0 ? index : fallback;
}
