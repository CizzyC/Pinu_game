export function mapExportItemToGameWord(item) {
  return {
    id: item.id || item.prompt,
    prompt: item.prompt,
    answer: item.answer,
    audio: item.audio || ""
  };
}

export function buildRandomRound(items, random = Math.random) {
  const usableItems = items.map(mapExportItemToGameWord).filter((item) => item.prompt && item.answer);
  if (usableItems.length < 24) {
    throw new Error(`A Bingo round needs at least 24 vocabulary items. Found ${usableItems.length}.`);
  }

  const card = shuffle(usableItems, random).slice(0, 24);
  card.splice(12, 0, { prompt: "PINU", answer: "free", free: true });

  return {
    board: card,
    queue: shuffle(card.filter((word) => !word.free), random)
  };
}

export function getLanguagePairLabel(languagePair) {
  return String(languagePair)
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" -> ");
}

export function shuffle(items, random = Math.random) {
  return [...items]
    .map((item) => ({ item, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}
