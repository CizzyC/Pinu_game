import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRandomRound,
  getLanguagePairLabel,
  mapExportItemToGameWord
} from "../tools/vocab-admin/src/game-vocab.mjs";

const sampleItems = Array.from({ length: 30 }, (_, index) => ({
  id: `word-${index + 1}`,
  unit: "s1u1",
  prompt: `palabra ${index + 1}`,
  answer: `word ${index + 1}`,
  audio: `assets/audio/call-word-${index + 1}.m4a`
}));

test("buildRandomRound creates a 25-cell board with center free and a queue from board words only", () => {
  const round = buildRandomRound(sampleItems, () => 0.42);

  assert.equal(round.board.length, 25);
  assert.deepEqual(round.board[12], { prompt: "PINU", answer: "free", free: true });
  assert.equal(round.queue.length, 24);

  const boardPrompts = new Set(round.board.filter((item) => !item.free).map((item) => item.prompt));
  assert.equal(boardPrompts.size, 24);
  assert.ok(round.queue.every((item) => boardPrompts.has(item.prompt)));
});

test("buildRandomRound shuffles board and call queue independently on each game", () => {
  const firstNumbers = [0.02, 0.95, 0.11, 0.82, 0.23, 0.74, 0.34, 0.63, 0.45, 0.51];
  const secondNumbers = [0.91, 0.04, 0.77, 0.18, 0.69, 0.27, 0.58, 0.36, 0.49, 0.12];
  let firstIndex = 0;
  let secondIndex = 0;

  const first = buildRandomRound(sampleItems, () => firstNumbers[firstIndex++ % firstNumbers.length]);
  const second = buildRandomRound(sampleItems, () => secondNumbers[secondIndex++ % secondNumbers.length]);

  assert.notDeepEqual(
    first.board.map((item) => item.prompt),
    second.board.map((item) => item.prompt)
  );
  assert.notDeepEqual(
    first.queue.map((item) => item.prompt),
    second.queue.map((item) => item.prompt)
  );
});

test("maps exported vocabulary items and language pair labels for the game UI", () => {
  const word = mapExportItemToGameWord({
    id: "s1u1-coffee-cafe",
    prompt: "café",
    answer: "coffee",
    audio: "assets/audio/call-cafe.m4a"
  });

  assert.deepEqual(word, {
    id: "s1u1-coffee-cafe",
    prompt: "café",
    answer: "coffee",
    audio: "assets/audio/call-cafe.m4a"
  });
  assert.equal(getLanguagePairLabel("es-en"), "ES -> EN");
  assert.equal(getLanguagePairLabel("en-es"), "EN -> ES");
});
