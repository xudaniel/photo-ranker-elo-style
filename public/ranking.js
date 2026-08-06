(function initRankingEngine(root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.RankingEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const BASE_ELO = 1200;
  const ELO_K = 24;
  const TIE_THRESHOLD = 12;

  function pairKey(first, second) {
    return [first.id, second.id].sort().join('::');
  }

  function recommendedRounds(photoCount) {
    return Math.max(12, photoCount * 4);
  }

  function updateElo(winnerRating, loserRating, kFactor = ELO_K) {
    const expectedWinner = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;
    return {
      winner: winnerRating + kFactor * (1 - expectedWinner),
      loser: loserRating - kFactor * expectedLoser,
    };
  }

  function confidenceDetails(photos) {
    if (!photos.length) return { percent: 0, coverage: 0, balance: 0, targetPerPhoto: 0 };

    const targetVotes = recommendedRounds(photos.length) * 2;
    const targetPerPhoto = targetVotes / photos.length;
    const coverage = photos.reduce(
      (sum, photo) => sum + Math.min(1, photo.seen / targetPerPhoto),
      0,
    ) / photos.length;
    const leastCovered = Math.min(...photos.map((photo) => photo.seen));
    const balance = Math.min(1, leastCovered / targetPerPhoto);
    const percent = Math.min(100, Math.round(coverage * (0.75 + balance * 0.25) * 100));

    return { percent, coverage, balance, targetPerPhoto };
  }

  function choosePair(photos, previousPairKey = null) {
    if (photos.length < 2) return null;

    const maxSeen = Math.max(...photos.map((photo) => photo.seen));
    const topCutoff = Math.max(2, Math.ceil(Math.sqrt(photos.length)));
    const topIds = new Set(
      [...photos]
        .sort((a, b) => b.elo - a.elo || a.seen - b.seen || a.id.localeCompare(b.id))
        .slice(0, topCutoff)
        .map((photo) => photo.id),
    );

    const candidates = [];
    for (let firstIndex = 0; firstIndex < photos.length - 1; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < photos.length; secondIndex += 1) {
        const first = photos[firstIndex];
        const second = photos[secondIndex];
        const key = pairKey(first, second);
        const totalSeen = first.seen + second.seen;
        const coverageNeed = (maxSeen * 2 + 2 - totalSeen) / (maxSeen * 2 + 2);
        const closeness = 1 - Math.min(1, Math.abs(first.elo - second.elo) / 400);
        const seenBalance = 1 - Math.min(1, Math.abs(first.seen - second.seen) / Math.max(1, maxSeen));
        const recordUncertainty = 1 - Math.min(
          1,
          (Math.abs(first.wins - first.losses) + Math.abs(second.wins - second.losses))
            / Math.max(2, totalSeen),
        );
        const topContenderBonus = topIds.has(first.id) && topIds.has(second.id) ? 1 : 0;
        const immediateRepeat = key === previousPairKey;

        candidates.push({
          pair: [first, second],
          key,
          immediateRepeat,
          score:
            coverageNeed * 5
            + closeness * 2
            + seenBalance * 0.5
            + recordUncertainty * 0.5
            + topContenderBonus * 0.75,
        });
      }
    }

    const nonRepeats = candidates.filter((candidate) => !candidate.immediateRepeat);
    const eligible = nonRepeats.length ? nonRepeats : candidates;
    eligible.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    return eligible[0].pair;
  }

  function buildRanking(photos, tieThreshold = TIE_THRESHOLD) {
    const sorted = [...photos].sort(
      (a, b) => b.elo - a.elo || b.wins - a.wins || a.name.localeCompare(b.name),
    );
    let rank = 0;
    let groupLeader = null;

    return sorted.map((photo, index) => {
      const tiedWithGroup = groupLeader && Math.abs(groupLeader.elo - photo.elo) <= tieThreshold;
      if (!tiedWithGroup) {
        rank = index + 1;
        groupLeader = photo;
      }
      return { photo, rank, tied: tiedWithGroup || false };
    }).map((entry, index, entries) => ({
      ...entry,
      tied: entry.tied || (entries[index + 1]?.rank === entry.rank),
    }));
  }

  return {
    BASE_ELO,
    ELO_K,
    TIE_THRESHOLD,
    pairKey,
    recommendedRounds,
    updateElo,
    confidenceDetails,
    choosePair,
    buildRanking,
  };
});
