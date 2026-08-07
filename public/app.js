const MAX_PHOTOS = 20;
const {
  BASE_ELO,
  pairKey,
  recommendedRounds,
  updateElo,
  confidenceDetails,
  choosePair,
  buildRanking,
} = window.RankingEngine;

const state = {
  photos: [],
  mode: 'head',
  round: 0,
  streak: 0,
  timerSec: 10,
  timerId: null,
  activePair: null,
  locked: false,
  finderQuery: '',
  history: [],
  lastPairKey: null,
  transitionId: null,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const MODE_META = {
  head: { title: 'Head-to-Head Mode', cardLabels: ['Left contender', 'Right contender'] },
  speed: { title: 'Speed Blitz Mode', cardLabels: ['Tap to choose', 'Tap to choose'] },
  vibe: { title: 'Vibe Check Mode', cardLabels: ['Swipe or tap', 'Swipe or tap'] },
  boxing: { title: 'Boxing Ring Mode', cardLabels: ['Corner Red', 'Corner Blue'] },
  slot: { title: 'Slot Machine Mode', cardLabels: ['Slot A', 'Slot B'] },
  runway: { title: 'Runway Mode', cardLabels: ['Look A', 'Look B'] },
};

const DEMO_PHOTOS = [
  ['/demo/portrait-01.jpg', 'midnight-portrait-01.jpg'],
  ['/demo/portrait-02.jpg', 'window-light-portrait-02.jpg'],
  ['/demo/portrait-03.jpg', 'studio-portrait-03.jpg'],
  ['/demo/portrait-04.jpg', 'soft-light-portrait-04.jpg'],
  ['/demo/portrait-05.jpg', 'warm-edge-portrait-05.jpg'],
  ['/demo/portrait-06.jpg', 'auburn-portrait-06.jpg'],
];

const $ = (id) => document.getElementById(id);
const ui = {
  uploadInput: $('upload-input'),
  previewGrid: $('preview-grid'),
  countLabel: $('count-label'),
  emptySection: $('empty-section'),
  collectionDrawer: $('collection-drawer'),
  collectionToggle: $('collection-toggle'),
  finderInput: $('finder-input'),
  finderClearBtn: $('finder-clear-btn'),
  finderResults: $('finder-results'),
  finderSummary: $('finder-summary'),
  modeGrid: $('mode-grid'),
  speedControls: $('speed-controls'),
  speedTimer: $('speed-timer'),
  timerLabel: $('timer-label'),
  battleSection: $('battle-section'),
  battleTitle: $('battle-title'),
  arena: $('arena'),
  roundLabel: $('round-label'),
  streakLabel: $('streak-label'),
  confidenceMeter: $('confidence-meter'),
  confidenceText: $('confidence-text'),
  confidenceNote: $('confidence-note'),
  timerShell: $('timer-shell'),
  timerFill: $('timer-fill'),
  undoBtn: $('undo-btn'),
  resultsSection: $('results-section'),
  resultsSummary: $('results-summary'),
  podium: $('podium'),
  rankingList: $('ranking-list'),
  toast: $('toast'),
  lightbox: $('lightbox'),
  lightboxImg: $('lightbox-img'),
};

bindEvents();
renderPreviews();
renderFinder();

function bindEvents() {
  ui.uploadInput.addEventListener('change', onUpload);
  document.querySelectorAll('label[for="upload-input"]').forEach((label) => {
    label.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      ui.uploadInput.click();
    });
  });
  $('clear-btn').addEventListener('click', () => clearAll());
  $('demo-btn').addEventListener('click', loadDemoCollection);
  $('empty-demo-btn').addEventListener('click', loadDemoCollection);
  ui.collectionToggle.addEventListener('click', toggleCollectionDrawer);
  $('drawer-close').addEventListener('click', closeCollectionDrawer);
  $('drawer-scrim').addEventListener('click', closeCollectionDrawer);
  $('rail-scroll-up').addEventListener('click', () => scrollPhotoRail(-1));
  $('rail-scroll-down').addEventListener('click', () => scrollPhotoRail(1));
  $('continue-btn').addEventListener('click', continueRanking);
  $('continue-ranking-btn').addEventListener('click', continueRanking);
  $('results-done-btn').addEventListener('click', () => ui.resultsSection.classList.add('hidden'));
  $('finish-btn').addEventListener('click', finishRanking);
  $('skip-btn').addEventListener('click', () => nextRound(true));
  ui.undoBtn.addEventListener('click', undoLastVote);
  ui.finderInput.addEventListener('input', () => {
    state.finderQuery = ui.finderInput.value.trim();
    renderPreviews();
    renderFinder();
  });
  ui.finderClearBtn.addEventListener('click', () => {
    state.finderQuery = '';
    ui.finderInput.value = '';
    renderPreviews();
    renderFinder();
    ui.finderInput.focus();
  });
  ui.speedTimer.addEventListener('input', () => {
    state.timerSec = Number(ui.speedTimer.value);
    ui.timerLabel.textContent = `${state.timerSec}s`;
  });

  ui.modeGrid.addEventListener('click', (event) => {
    const button = event.target.closest('.mode');
    if (!button) return;
    setMode(button.dataset.mode);
  });

  $('lightbox-close').addEventListener('click', closeLightbox);
  ui.lightbox.addEventListener('click', (event) => {
    if (event.target === ui.lightbox) closeLightbox();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!ui.resultsSection.classList.contains('hidden')) {
        continueRanking();
        return;
      }
      if (document.body.classList.contains('drawer-open')) {
        closeCollectionDrawer();
        return;
      }
      closeLightbox();
      return;
    }

    if (isTypingTarget(event.target) || !ui.lightbox.classList.contains('hidden')) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undoLastVote();
      return;
    }

    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft') chooseActiveSide(0);
    if (event.key === 'ArrowRight') chooseActiveSide(1);
    if (key === 's') nextRound(true);
    if (key === 'u') undoLastVote();
  });
}

function toggleCollectionDrawer() {
  const willOpen = !document.body.classList.contains('drawer-open');
  document.body.classList.toggle('drawer-open', willOpen);
  ui.collectionToggle.setAttribute('aria-expanded', String(willOpen));
}

function closeCollectionDrawer() {
  document.body.classList.remove('drawer-open');
  ui.collectionToggle.setAttribute('aria-expanded', 'false');
}

function openCollectionDrawer() {
  document.body.classList.add('drawer-open');
  ui.collectionToggle.setAttribute('aria-expanded', 'true');
}

function scrollPhotoRail(direction) {
  ui.previewGrid.scrollBy({
    top: direction * 180,
    left: direction * 180,
    behavior: state.reducedMotion ? 'auto' : 'smooth',
  });
}

function continueRanking() {
  ui.resultsSection.classList.add('hidden');
  ui.battleSection.classList.remove('hidden');
}

function isTypingTarget(target) {
  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target?.tagName) || target?.isContentEditable;
}

function setMode(mode) {
  if (!MODE_META[mode]) return;
  state.mode = mode;
  [...ui.modeGrid.querySelectorAll('.mode')].forEach((node) => {
    node.classList.toggle('active', node.dataset.mode === mode);
  });
  ui.speedControls.classList.toggle('hidden', mode !== 'speed');
  ui.battleTitle.textContent = MODE_META[mode].title;
  if (state.photos.length >= 2) startBattle();
}

function onUpload(event) {
  const remaining = MAX_PHOTOS - state.photos.length;
  const files = [...event.target.files].slice(0, Math.max(0, remaining));

  if (event.target.files.length > files.length) {
    toast(`Only ${MAX_PHOTOS} photos are allowed.`);
  }

  if (!files.length) return;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      state.photos.push({
        id: createPhotoId(),
        name: file.name || 'Untitled',
        src: reader.result,
        elo: BASE_ELO,
        wins: 0,
        losses: 0,
        seen: 0,
      });

      renderPreviews();
      renderFinder();
      if (state.photos.length >= 2 && state.round === 0) {
        startBattle();
      }
    };
    reader.readAsDataURL(file);
  });

  ui.uploadInput.value = '';
}

function loadDemoCollection() {
  clearAll(true);
  state.photos = DEMO_PHOTOS.map(([src, name], index) => ({
    id: `demo-${String(index + 1).padStart(2, '0')}`,
    name,
    src,
    elo: BASE_ELO,
    wins: 0,
    losses: 0,
    seen: 0,
  }));
  renderPreviews();
  renderFinder();
  startBattle();
  closeCollectionDrawer();
  toast('Demo collection ready');
}

function clearAll(quiet = false) {
  stopTimer();
  stopTransition();
  state.photos = [];
  state.round = 0;
  state.streak = 0;
  state.activePair = null;
  state.locked = false;
  state.finderQuery = '';
  state.history = [];
  state.lastPairKey = null;

  ui.finderInput.value = '';
  ui.previewGrid.innerHTML = '';
  ui.battleSection.classList.add('hidden');
  ui.resultsSection.classList.add('hidden');
  ui.countLabel.textContent = '0';
  ui.roundLabel.textContent = 'Ready';
  ui.streakLabel.textContent = 'Streak 0';
  ui.confidenceMeter.value = 0;
  ui.confidenceMeter.textContent = '0%';
  ui.confidenceText.textContent = '0%';
  ui.confidenceNote.textContent = 'Provisional — compare every photo a few times for a more reliable order.';
  ui.confidenceNote.classList.remove('stable');
  updateUndoButton();
  document.body.classList.remove('has-battle');
  ui.emptySection.classList.remove('hidden');
  renderFinder();
  renderPreviews();
  if (!quiet) openCollectionDrawer();

  if (!quiet) toast('Collection cleared');
}

function renderPreviews() {
  ui.countLabel.textContent = String(state.photos.length);
  const visiblePhotos = state.photos;
  const activeIds = new Set((state.activePair || []).map((photo) => photo.id));
  document.body.classList.toggle('has-battle', state.photos.length >= 2);
  ui.emptySection.classList.toggle('hidden', state.photos.length >= 2);

  if (!visiblePhotos.length) {
    ui.previewGrid.innerHTML = '';
    return;
  }

  ui.previewGrid.innerHTML = visiblePhotos
    .map((photo) => {
      const index = state.photos.findIndex((entry) => entry.id === photo.id);
      return `
        <div class="thumb ${activeIds.has(photo.id) ? 'active' : ''}" title="${escapeAttr(photo.name)}" data-photo-id="${photo.id}">
          <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
          <span class="thumb-name">${escapeHtml(photo.name)}</span>
          <button class="thumb-remove" data-index="${index}" aria-label="Remove ${escapeAttr(photo.name)}"><i class="ph ph-x" aria-hidden="true"></i></button>
        </div>
      `;
    })
    .join('');

  ui.previewGrid.querySelectorAll('.thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const photo = state.photos.find((entry) => entry.id === thumb.dataset.photoId);
      if (photo) openLightbox(photo.src, photo.name);
    });
  });

  ui.previewGrid.querySelectorAll('.thumb-remove').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.index);
      removePhoto(index);
    });
  });
}

function getFinderMatches() {
  const query = state.finderQuery.trim().toLowerCase();
  if (!query) return [...state.photos];
  return state.photos.filter((photo, index) => {
    const searchable = [photo.name, `#${index + 1}`, String(Math.round(photo.elo))].join(' ').toLowerCase();
    return searchable.includes(query);
  });
}

function renderFinder() {
  const matches = getFinderMatches();
  const query = state.finderQuery.trim();
  const total = state.photos.length;

  ui.finderSummary.textContent = query ? `${matches.length} / ${total} matches` : `${total} photos`;
  ui.finderClearBtn.disabled = !query;

  if (!total) {
    ui.finderResults.className = 'finder-results empty';
    ui.finderResults.textContent = 'Upload photos to start finding them.';
    return;
  }

  if (!matches.length) {
    ui.finderResults.className = 'finder-results empty';
    ui.finderResults.innerHTML = `No pics found for <strong>${escapeHtml(query)}</strong>.`;
    return;
  }

  ui.finderResults.className = 'finder-results';
  ui.finderResults.innerHTML = matches
    .map((photo, index) => `
      <button class="finder-card" type="button" data-photo-id="${photo.id}">
        <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
        <span>
          <strong>${escapeHtml(photo.name)}</strong>
          <small>${query ? 'Match' : `Photo ${index + 1}`} · ${Math.round(photo.elo)} Elo · W:${photo.wins}/L:${photo.losses}</small>
        </span>
      </button>
    `)
    .join('');

  ui.finderResults.querySelectorAll('.finder-card').forEach((button) => {
    button.addEventListener('click', () => {
      const photo = state.photos.find((entry) => entry.id === button.dataset.photoId);
      if (photo) openLightbox(photo.src, photo.name);
    });
  });
}

function removePhoto(index) {
  if (Number.isNaN(index) || !state.photos[index]) return;
  stopTimer();
  stopTransition();
  state.photos.splice(index, 1);
  state.history = [];
  state.lastPairKey = null;
  updateUndoButton();
  renderPreviews();

  renderFinder();

  if (state.photos.length < 2) {
    state.round = 0;
    state.streak = 0;
    state.activePair = null;
    ui.battleSection.classList.add('hidden');
    ui.resultsSection.classList.add('hidden');
    ui.emptySection.classList.remove('hidden');
    document.body.classList.remove('has-battle');
    openCollectionDrawer();
    stopTimer();
  } else if (state.activePair?.some((p) => !state.photos.find((x) => x.id === p.id))) {
    nextRound(true);
  }
}

function startBattle() {
  ui.battleSection.classList.remove('hidden');
  ui.resultsSection.classList.add('hidden');
  ui.emptySection.classList.add('hidden');
  document.body.classList.add('has-battle');
  closeCollectionDrawer();
  ui.battleTitle.textContent = MODE_META[state.mode].title;

  if (!state.activePair) {
    nextRound();
  } else {
    renderArena(state.activePair);
    renderConfidence();
  }
}

function nextRound(skipped = false) {
  if (state.locked) return;
  stopTimer();
  stopTransition();
  if (state.photos.length < 2) return;

  if (state.activePair) state.lastPairKey = pairKey(...state.activePair);
  state.round += 1;
  state.streak = skipped ? 0 : state.streak;
  ui.roundLabel.textContent = `${state.round} of ${recommendedRounds(state.photos.length)}`;
  ui.streakLabel.textContent = `Streak ${state.streak}`;

  state.activePair = choosePair(state.photos, state.lastPairKey);
  renderArena(state.activePair);
  renderConfidence();
  renderPreviews();

  if (state.mode === 'speed') startTimer();
}

function renderArena(pair) {
  const [left, right] = pair;

  ui.arena.innerHTML = `
    <div class="pair-grid mode-${state.mode}">
      ${renderCard(left, 'left')}
      ${renderCard(right, 'right')}
    </div>
    <div class="vs-badge" aria-hidden="true">VS</div>
  `;

  wireBattleInteractions(left, right);
  runModeFx();
}

function renderCard(photo, side) {
  const icon = side === 'left' ? 'ph-arrow-left' : 'ph-arrow-right';
  return `
    <article class="photo-card ${side}" data-id="${photo.id}" role="button" tabindex="0" aria-label="Choose ${escapeAttr(photo.name)}">
      <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
      <span class="choice-affordance" aria-hidden="true"><i class="ph ${icon}"></i><span>${side}</span></span>
      <span class="photo-name">${escapeHtml(photo.name)}</span>
    </article>
  `;
}

function wireBattleInteractions(left, right) {
  const cards = [...ui.arena.querySelectorAll('.photo-card')];

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (state.locked) return;
      const winner = card.dataset.id === left.id ? left : right;
      const loser = winner.id === left.id ? right : left;
      registerBattle(winner, loser, card);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (state.locked) return;
      const winner = card.dataset.id === left.id ? left : right;
      const loser = winner.id === left.id ? right : left;
      registerBattle(winner, loser, card);
    });

    const image = card.querySelector('img');
    image.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      openLightbox(image.src);
    });
  });

  if (state.mode === 'vibe') {
    cards.forEach((card) => attachSwipeRecognizer(card, left, right));
  }
}

function chooseActiveSide(index) {
  if (state.locked || !state.activePair || ui.battleSection.classList.contains('hidden')) return;
  const winner = state.activePair[index];
  const loser = state.activePair[index === 0 ? 1 : 0];
  const card = [...ui.arena.querySelectorAll('.photo-card')]
    .find((candidate) => candidate.dataset.id === winner.id);
  if (card) registerBattle(winner, loser, card);
}

function attachSwipeRecognizer(card, left, right) {
  let startX = 0;
  let dx = 0;

  const onMove = (event) => {
    if (!startX) return;
    dx = event.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
  };

  card.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    dx = 0;
    card.classList.add('dragging');
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener('pointermove', onMove);

  card.addEventListener('pointerup', () => {
    const threshold = 70;
    card.classList.remove('dragging');
    card.style.transform = '';

    if (Math.abs(dx) >= threshold && !state.locked) {
      const winner = card.dataset.id === left.id ? left : right;
      const loser = winner.id === left.id ? right : left;
      registerBattle(winner, loser, card);
    }

    startX = 0;
    dx = 0;
  });
}

function runModeFx() {
  if (state.reducedMotion) return;
  if (state.mode === 'slot') {
    ui.arena.querySelectorAll('.photo-card').forEach((card, idx) => {
      card.classList.add('slot-spin');
      setTimeout(() => card.classList.remove('slot-spin'), 450 + idx * 75);
    });
    setTimeout(() => toast('Spin complete — pick the winner'), 250);
  }

  if (state.mode === 'runway') {
    const cards = ui.arena.querySelectorAll('.photo-card');
    cards.forEach((card, idx) => {
      setTimeout(() => card.classList.add('runway-pop'), idx * 140);
      setTimeout(() => card.classList.remove('runway-pop'), idx * 140 + 420);
    });
  }
}

function registerBattle(winner, loser, winnerCardEl) {
  stopTimer();
  state.locked = true;
  state.history.push({
    round: state.round,
    streak: state.streak,
    lastPairKey: state.lastPairKey,
    pairIds: state.activePair.map((photo) => photo.id),
    winner: { id: winner.id, elo: winner.elo, wins: winner.wins, losses: winner.losses, seen: winner.seen },
    loser: { id: loser.id, elo: loser.elo, wins: loser.wins, losses: loser.losses, seen: loser.seen },
  });

  const ratings = updateElo(winner.elo, loser.elo);
  winner.elo = ratings.winner;
  loser.elo = ratings.loser;
  winner.wins += 1;
  loser.losses += 1;
  winner.seen += 1;
  loser.seen += 1;
  renderFinder();

  state.streak += 1;
  ui.streakLabel.textContent = `Streak ${state.streak}`;
  updateUndoButton();

  winnerCardEl.classList.add('winner');
  playClickTone();
  toast(randomReaction());

  state.transitionId = setTimeout(() => {
    state.transitionId = null;
    state.locked = false;
    if (state.round >= recommendedRounds(state.photos.length)) {
      finishRanking();
    } else {
      nextRound();
    }
  }, state.reducedMotion ? 0 : 210);
}

function renderConfidence() {
  const confidence = confidenceDetails(state.photos);
  ui.confidenceMeter.value = confidence.percent;
  ui.confidenceMeter.textContent = `${confidence.percent}%`;
  ui.confidenceText.textContent = `${confidence.percent}%`;
  ui.confidenceNote.classList.toggle('stable', confidence.percent >= 80);
  if (confidence.percent < 40) {
    ui.confidenceNote.textContent = 'Provisional — several photos still need more comparisons.';
  } else if (confidence.percent < 80) {
    ui.confidenceNote.textContent = 'Developing — coverage is improving, but close positions may still move.';
  } else {
    ui.confidenceNote.textContent = 'Strong coverage — use extra rounds to resolve close contenders.';
  }
}

function stopTransition() {
  if (state.transitionId) {
    clearTimeout(state.transitionId);
    state.transitionId = null;
  }
  state.locked = false;
}

function updateUndoButton() {
  ui.undoBtn.disabled = state.history.length === 0;
}

function undoLastVote() {
  const snapshot = state.history.pop();
  if (!snapshot) return;

  stopTimer();
  stopTransition();
  const winner = state.photos.find((photo) => photo.id === snapshot.winner.id);
  const loser = state.photos.find((photo) => photo.id === snapshot.loser.id);
  if (!winner || !loser) {
    state.history = [];
    updateUndoButton();
    return;
  }

  Object.assign(winner, snapshot.winner);
  Object.assign(loser, snapshot.loser);
  state.round = snapshot.round;
  state.streak = snapshot.streak;
  state.lastPairKey = snapshot.lastPairKey;
  state.activePair = snapshot.pairIds
    .map((id) => state.photos.find((photo) => photo.id === id))
    .filter(Boolean);

  ui.roundLabel.textContent = `${state.round} of ${recommendedRounds(state.photos.length)}`;
  ui.streakLabel.textContent = `Streak ${state.streak}`;
  ui.resultsSection.classList.add('hidden');
  renderArena(state.activePair);
  renderConfidence();
  renderFinder();
  renderPreviews();
  updateUndoButton();
  if (state.mode === 'speed') startTimer();
  toast('Last vote undone');
}

function startTimer() {
  ui.timerShell.classList.remove('hidden');
  const duration = state.timerSec * 1000;
  const startedAt = performance.now();

  const tick = () => {
    const elapsed = performance.now() - startedAt;
    const pctLeft = Math.max(0, 1 - elapsed / duration);
    ui.timerFill.style.width = `${pctLeft * 100}%`;

    if (pctLeft <= 0) {
      nextRound(true);
      return;
    }

    state.timerId = requestAnimationFrame(tick);
  };

  state.timerId = requestAnimationFrame(tick);
}

function stopTimer() {
  if (state.timerId) {
    cancelAnimationFrame(state.timerId);
    state.timerId = null;
  }

  ui.timerFill.style.width = '100%';
  ui.timerShell.classList.toggle('hidden', state.mode !== 'speed');
}

function finishRanking() {
  stopTimer();
  stopTransition();
  if (state.photos.length < 2) return;

  const ranked = buildRanking(state.photos);
  const confidence = confidenceDetails(state.photos);
  ui.resultsSection.classList.remove('hidden');
  ui.resultsSummary.textContent = `${state.round} rounds · ${confidence.percent}% ranking confidence${ranked.some((entry) => entry.tied) ? ' · close scores shown as ties' : ''}`;

  ui.podium.innerHTML = ranked.slice(0, 3).map(({ photo, rank, tied }) => `
    <div class="slot">
      <strong>${tied ? 'Tied ' : ''}#${rank}</strong>
      <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
      <div>${escapeHtml(photo.name)}</div>
      <small>${Math.round(photo.elo)} Elo</small>
    </div>
  `).join('');

  ui.rankingList.innerHTML = ranked.map(({ photo, rank, tied }) => `
    <li data-photo-id="${photo.id}" class="${tied ? 'tie' : ''}">#${rank} ${escapeHtml(photo.name)} — ${Math.round(photo.elo)} Elo (W:${photo.wins}/L:${photo.losses})${tied ? '<span class="tie-badge">close score</span>' : ''}</li>
  `).join('');

  [...ui.rankingList.querySelectorAll('li')].forEach((item) => {
    item.addEventListener('click', () => {
      const photo = state.photos.find((entry) => entry.id === item.dataset.photoId);
      if (photo) openLightbox(photo.src, photo.name);
    });
  });

  toast('Ranking complete');
}

function openLightbox(src, alt = 'Expanded photo') {
  ui.lightboxImg.src = src;
  ui.lightboxImg.alt = alt;
  ui.lightbox.classList.remove('hidden');
}

function closeLightbox() {
  ui.lightbox.classList.add('hidden');
}

function randomReaction() {
  const reactions = [
    'Nice pick',
    'Clear winner',
    'Clean choice',
    'Ranking updated',
    'Fast instinct',
  ];
  return reactions[Math.floor(Math.random() * reactions.length)];
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.add('hidden'), 1300);
}

function playClickTone() {
  if (!window.AudioContext) return;

  if (!playClickTone.ctx) {
    playClickTone.ctx = new AudioContext();
  }

  const ctx = playClickTone.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 380 + Math.random() * 160;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  osc.stop(ctx.currentTime + 0.13);
}

function createPhotoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
