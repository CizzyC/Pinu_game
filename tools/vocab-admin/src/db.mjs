import { querySql, runSql, sqlString } from "./sqlite.mjs";
import { normalizeText, slugify } from "./text.mjs";

const LANGUAGE_NAMES = {
  en: ["English", "English"],
  es: ["Spanish", "Español"]
};

export function initDatabase(dbPath) {
  runSql(
    dbPath,
    `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS languages (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT
);

CREATE TABLE IF NOT EXISTS language_pairs (
  id INTEGER PRIMARY KEY,
  source_language_id INTEGER NOT NULL,
  target_language_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(source_language_id, target_language_id),
  FOREIGN KEY (source_language_id) REFERENCES languages(id),
  FOREIGN KEY (target_language_id) REFERENCES languages(id)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY,
  course_code TEXT NOT NULL DEFAULT 'pinu',
  section_code TEXT,
  unit_code TEXT NOT NULL,
  display_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(course_code, unit_code)
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
  id INTEGER PRIMARY KEY,
  concept_key TEXT NOT NULL UNIQUE,
  unit_id INTEGER,
  difficulty INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS localized_terms (
  id INTEGER PRIMARY KEY,
  vocabulary_item_id INTEGER NOT NULL,
  language_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  audio_path TEXT,
  FOREIGN KEY (vocabulary_item_id) REFERENCES vocabulary_items(id),
  FOREIGN KEY (language_id) REFERENCES languages(id),
  UNIQUE(vocabulary_item_id, language_id, normalized_text)
);

CREATE TABLE IF NOT EXISTS question_entries (
  id INTEGER PRIMARY KEY,
  language_pair_id INTEGER NOT NULL,
  vocabulary_item_id INTEGER NOT NULL,
  prompt_term_id INTEGER NOT NULL,
  answer_term_id INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id),
  FOREIGN KEY (vocabulary_item_id) REFERENCES vocabulary_items(id),
  FOREIGN KEY (prompt_term_id) REFERENCES localized_terms(id),
  FOREIGN KEY (answer_term_id) REFERENCES localized_terms(id),
  UNIQUE(language_pair_id, vocabulary_item_id, prompt_term_id, answer_term_id)
);

CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY,
  source_file_name TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  warning_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_vocab_progress (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  language_pair_id INTEGER NOT NULL,
  vocabulary_item_id INTEGER NOT NULL,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT,
  UNIQUE(user_id, language_pair_id, vocabulary_item_id),
  FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id),
  FOREIGN KEY (vocabulary_item_id) REFERENCES vocabulary_items(id)
);
`
  );
}

export function importRows(dbPath, rows, options = {}) {
  initDatabase(dbPath);
  const rowLanguagePairs = rows.map((row) => ({
    sourceLanguage: row.sourceLanguage || options.sourceLanguage || "en",
    targetLanguage: row.targetLanguage || options.targetLanguage || "es"
  }));
  const directPairCodes = [...new Set(rowLanguagePairs.map((pair) => `${pair.sourceLanguage}-${pair.targetLanguage}`))];
  const shouldGenerateReversePairs = directPairCodes.length === 1;
  const languages = [...new Set(rowLanguagePairs.flatMap((pair) => [pair.sourceLanguage, pair.targetLanguage]))];
  const languagePairs = [
    ...new Set(
      rowLanguagePairs.flatMap((pair) =>
        shouldGenerateReversePairs
          ? [`${pair.sourceLanguage}-${pair.targetLanguage}`, `${pair.targetLanguage}-${pair.sourceLanguage}`]
          : [`${pair.sourceLanguage}-${pair.targetLanguage}`]
      )
    )
  ];
  const statements = [
    "PRAGMA foreign_keys = ON;",
    "BEGIN;",
    ...languages.map((language) => languageInsert(language)),
    ...languagePairs.map((pair) => {
      const [sourceLanguage, targetLanguage] = pair.split("-");
      return languagePairInsert(sourceLanguage, targetLanguage);
    }),
    `INSERT INTO import_batches (source_file_name, imported_at, row_count, warning_count) VALUES (${sqlString(options.sourceFileName || "uploaded-vocabulary")}, ${sqlString(new Date().toISOString())}, ${Number(rows.length)}, ${Number(options.warningCount || 0)});`
  ];

  rows.forEach((row, index) => {
    const sourceLanguage = row.sourceLanguage || options.sourceLanguage || "en";
    const targetLanguage = row.targetLanguage || options.targetLanguage || "es";
    const conceptKey = makeConceptKey(row);
    const sortOrder = index + 1;
    statements.push(`INSERT INTO units (course_code, unit_code, display_name, sort_order) VALUES ('pinu', ${sqlString(row.unitCode)}, ${sqlString(row.unitCode.toUpperCase())}, ${sortOrder}) ON CONFLICT(course_code, unit_code) DO NOTHING;`);
    statements.push(`INSERT INTO vocabulary_items (concept_key, unit_id) VALUES (${sqlString(conceptKey)}, (SELECT id FROM units WHERE course_code = 'pinu' AND unit_code = ${sqlString(row.unitCode)})) ON CONFLICT(concept_key) DO NOTHING;`);
    statements.push(termInsert(conceptKey, sourceLanguage, row.sourceText));
    statements.push(termInsert(conceptKey, targetLanguage, row.targetText, audioPathFor(row.targetText)));
    statements.push(questionInsert(`${sourceLanguage}-${targetLanguage}`, conceptKey, sourceLanguage, targetLanguage, row.sourceText, row.targetText));
    if (shouldGenerateReversePairs) {
      statements.push(questionInsert(`${targetLanguage}-${sourceLanguage}`, conceptKey, targetLanguage, sourceLanguage, row.targetText, row.sourceText));
    }
  });

  statements.push("COMMIT;");
  runSql(dbPath, statements.join("\n"));
  return { importedRows: rows.length };
}

export function searchVocabulary(dbPath, filters = {}) {
  const clauses = ["qe.is_active = 1"];
  if (filters.languagePair) clauses.push(`lp.code = ${sqlString(filters.languagePair)}`);
  if (filters.sourceLanguage) clauses.push(`source_lang.code = ${sqlString(filters.sourceLanguage)}`);
  if (filters.targetLanguage) clauses.push(`target_lang.code = ${sqlString(filters.targetLanguage)}`);
  if (filters.unitCode) clauses.push(`u.unit_code = ${sqlString(filters.unitCode)}`);
  if (filters.keyword) {
    const keyword = `%${normalizeText(filters.keyword)}%`;
    clauses.push(`(prompt.normalized_text LIKE ${sqlString(keyword)} OR answer.normalized_text LIKE ${sqlString(keyword)})`);
  }

  return querySql(
    dbPath,
    `
SELECT
  qe.id,
  lp.code AS languagePair,
  source_lang.code AS sourceLanguage,
  target_lang.code AS targetLanguage,
  u.unit_code AS unit,
  prompt.text AS sourceText,
  answer.text AS targetText,
  prompt.audio_path AS audio
FROM question_entries qe
JOIN language_pairs lp ON lp.id = qe.language_pair_id
JOIN languages source_lang ON source_lang.id = lp.source_language_id
JOIN languages target_lang ON target_lang.id = lp.target_language_id
JOIN vocabulary_items vi ON vi.id = qe.vocabulary_item_id
LEFT JOIN units u ON u.id = vi.unit_id
JOIN localized_terms prompt ON prompt.id = qe.prompt_term_id
JOIN localized_terms answer ON answer.id = qe.answer_term_id
WHERE ${clauses.join(" AND ")}
ORDER BY u.sort_order, prompt.text;
`
  );
}

export function listLanguagePairs(dbPath) {
  return querySql(
    dbPath,
    `
SELECT lp.code, source_lang.code AS sourceLanguage, target_lang.code AS targetLanguage
FROM language_pairs lp
JOIN languages source_lang ON source_lang.id = lp.source_language_id
JOIN languages target_lang ON target_lang.id = lp.target_language_id
WHERE lp.is_active = 1
ORDER BY lp.code;
`
  );
}

function languageInsert(code) {
  const [name, nativeName] = LANGUAGE_NAMES[code] || [code.toUpperCase(), code.toUpperCase()];
  return `INSERT INTO languages (code, name, native_name) VALUES (${sqlString(code)}, ${sqlString(name)}, ${sqlString(nativeName)}) ON CONFLICT(code) DO NOTHING;`;
}

function languagePairInsert(sourceLanguage, targetLanguage) {
  const code = `${sourceLanguage}-${targetLanguage}`;
  return `INSERT INTO language_pairs (source_language_id, target_language_id, code)
VALUES ((SELECT id FROM languages WHERE code = ${sqlString(sourceLanguage)}), (SELECT id FROM languages WHERE code = ${sqlString(targetLanguage)}), ${sqlString(code)})
ON CONFLICT(source_language_id, target_language_id) DO NOTHING;`;
}

function termInsert(conceptKey, languageCode, text, audioPath = "") {
  return `INSERT INTO localized_terms (vocabulary_item_id, language_id, text, normalized_text, audio_path)
VALUES ((SELECT id FROM vocabulary_items WHERE concept_key = ${sqlString(conceptKey)}), (SELECT id FROM languages WHERE code = ${sqlString(languageCode)}), ${sqlString(text)}, ${sqlString(normalizeText(text))}, ${sqlString(audioPath)})
ON CONFLICT(vocabulary_item_id, language_id, normalized_text) DO UPDATE SET text = excluded.text, audio_path = excluded.audio_path;`;
}

function questionInsert(languagePair, conceptKey, promptLanguage, answerLanguage, promptText, answerText) {
  return `INSERT INTO question_entries (language_pair_id, vocabulary_item_id, prompt_term_id, answer_term_id)
VALUES (
  (SELECT id FROM language_pairs WHERE code = ${sqlString(languagePair)}),
  (SELECT id FROM vocabulary_items WHERE concept_key = ${sqlString(conceptKey)}),
  (SELECT id FROM localized_terms WHERE vocabulary_item_id = (SELECT id FROM vocabulary_items WHERE concept_key = ${sqlString(conceptKey)}) AND language_id = (SELECT id FROM languages WHERE code = ${sqlString(promptLanguage)}) AND normalized_text = ${sqlString(normalizeText(promptText))}),
  (SELECT id FROM localized_terms WHERE vocabulary_item_id = (SELECT id FROM vocabulary_items WHERE concept_key = ${sqlString(conceptKey)}) AND language_id = (SELECT id FROM languages WHERE code = ${sqlString(answerLanguage)}) AND normalized_text = ${sqlString(normalizeText(answerText))})
)
ON CONFLICT(language_pair_id, vocabulary_item_id, prompt_term_id, answer_term_id) DO NOTHING;`;
}

function makeConceptKey(row) {
  return `${row.unitCode}-${slugify(row.sourceText)}-${slugify(row.targetText)}`;
}

function audioPathFor(text) {
  return `assets/audio/call-${slugify(text)}.m4a`;
}
