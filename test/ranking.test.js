const test = require('node:test');
const assert = require('node:assert/strict');

const {
  pairKey,
  recommendedRounds,
  updateElo,
  confidenceDetails,
  choosePair,
  buildRanking,
} = require('../public/ranking.js');

function photo(id, overrides = {}) {
  return {
    id,
    name: `${id}.jpg`,
    elo: 1200,
    wins: 0,
    losses: 0,
    seen: 0,
    ...overrides,
  };
}

test('equal Elo ratings exchange 12 points with K=24', () => {
  const result = updateElo(1200, 1200);
  assert.equal(result.winner, 1212);
  assert.equal(result.loser, 1188);
});

test('recommended rounds scale with collection size and retain a minimum', () => {
  assert.equal(recommendedRounds(2), 12);
  assert.equal(recommendedRounds(5), 20);
  assert.equal(recommendedRounds(20), 80);
});

test('pair selection avoids an immediate repeat when another pair exists', () => {
  const photos = [photo('a'), photo('b'), photo('c')];
  const previous = pairKey(photos[0], photos[1]);
  const selected = choosePair(photos, previous);
  assert.notEqual(pairKey(...selected), previous);
});

test('pair selection prioritizes an under-compared photo', () => {
  const photos = [
    photo('under', { seen: 0 }),
    photo('covered-a', { seen: 6 }),
    photo('covered-b', { seen: 6 }),
    photo('covered-c', { seen: 5 }),
  ];
  const selected = choosePair(photos);
  assert.ok(selected.some((entry) => entry.id === 'under'));
});

test('pair selection focuses on close top contenders after coverage is balanced', () => {
  const photos = [
    photo('leader', { elo: 1400, seen: 8, wins: 5, losses: 3 }),
    photo('challenger', { elo: 1390, seen: 8, wins: 5, losses: 3 }),
    photo('distant', { elo: 1100, seen: 8, wins: 3, losses: 5 }),
  ];
  const selectedIds = choosePair(photos).map((entry) => entry.id).sort();
  assert.deepEqual(selectedIds, ['challenger', 'leader']);
});

test('confidence rewards balanced comparison coverage', () => {
  const balanced = Array.from({ length: 4 }, (_, index) => photo(`p${index}`, { seen: 8 }));
  const uneven = [
    photo('a', { seen: 16 }),
    photo('b', { seen: 16 }),
    photo('c', { seen: 0 }),
    photo('d', { seen: 0 }),
  ];

  assert.equal(confidenceDetails(balanced).percent, 100);
  assert.ok(confidenceDetails(uneven).percent < 50);
});

test('ranking assigns shared ranks only within the tie threshold', () => {
  const ranking = buildRanking([
    photo('a', { elo: 1220 }),
    photo('b', { elo: 1213 }),
    photo('c', { elo: 1200 }),
  ]);

  assert.deepEqual(ranking.map((entry) => entry.rank), [1, 1, 3]);
  assert.deepEqual(ranking.map((entry) => entry.tied), [true, true, false]);
});
