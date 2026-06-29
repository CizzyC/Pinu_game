import path from "node:path";

export const gameRoot = path.resolve(import.meta.dirname, "../../..");
export const defaultDbPath = path.join(gameRoot, "data", "pinu_vocab.sqlite");
export const defaultUnitRange = ["s1u1", "s1u2", "s1u3", "s1u4"];

export function outputPathForVocabulary(languagePair, unitCodes = defaultUnitRange) {
  const unitSlug = unitCodes.length ? unitCodes.join("-") : "all";
  return path.join(gameRoot, "data", "vocab", languagePair, `${unitSlug}.json`);
}
