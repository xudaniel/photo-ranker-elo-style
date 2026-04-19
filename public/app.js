const MAX_PHOTOS = 20;
const BASE_ELO = 1200;
const ELO_K = 24;

const state = {
  photos: [],
  mode: 'head',
  round: 0,
  streak: 0,
  timerSec: 10,
  timerId: null,
  activePair: null,
  locked: false,
};

const MODE_META = {
  head: { title: 'Head-to-Head Mode', cardLabels: ['Left contender', 'Right contender'] },
  speed: { title: 'Speed Blitz Mode', cardLabels: ['Tap to choose', 'Tap to choose'] },
  vibe: { title: 'Vibe Check Mode', cardLabels: ['Swipe or tap', 'Swipe or tap'] },
  boxing: { title: 'Boxing Ring Mode', cardLabels: ['Corner Red', 'Corner Blue'] },
  slot: { title: 'Slot Machine Mode', cardLabels: ['Slot A', 'Slot B'] },
  runway: { title: 'Runway Mode', cardLabels: ['Look A', 'Look B'] },
};

const $ = (id) => document.getElementById(id);
const ui = {
  uploadInput: $('upload-input'),
  previewGrid: $('preview-grid'),
  countLabel: $('count-label'),
  modeGrid: $('mode-grid'),
  speedControls: $('speed-controls'),
  speedTimer: $('speed-timer'),
  timerLabel: $('timer-label'),
  battleSection: $('battle-section'),
  battleTitle: $('battle-title'),
  arena: $('arena'),
  roundLabel: $('round-label'),
  streakLabel: $('streak-label'),
  confidenceFill: $('confidence-fill'),
  confidenceText: $('confidence-text'),
  timerShell: $('timer-shell'),
  timerFill: $('timer-fill'),
  resultsSection: $('results-section'),
  podium: $('podium'),
  rankingList: $('ranking-list'),
  toast: $('toast'),
  lightbox: $('lightbox'),
  lightboxImg: $('lightbox-img'),
};

bindEvents();

function bindEvents() {
  ui.uploadInput.addEventListener('change', onUpload);
  $('clear-btn').addEventListener('click', clearAll);
  $('finish-btn').addEventListener('click', finishRanking);
  $('skip-btn').addEventListener('click', () => nextRound(true));
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
    if (event.key === 'Escape') closeLightbox();
  });
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
        id: crypto.randomUUID(),
        name: file.name || 'Untitled',
        src: reader.result,
        elo: BASE_ELO,
        wins: 0,
        losses: 0,
        seen: 0,
      });

      renderPreviews();
      if (state.photos.length >= 2 && state.round === 0) {
        startBattle();
      }
    };
    reader.readAsDataURL(file);
  });

  ui.uploadInput.value = '';
}

function clearAll() {
  stopTimer();
  state.photos = [];
  state.round = 0;
  state.streak = 0;
  state.activePair = null;
  state.locked = false;

  ui.previewGrid.innerHTML = '';
  ui.battleSection.classList.add('hidden');
  ui.resultsSection.classList.add('hidden');
  ui.countLabel.textContent = `0 / ${MAX_PHOTOS}`;
  ui.roundLabel.textContent = 'Round 0';
  ui.streakLabel.textContent = 'Streak 0';
  ui.confidenceFill.style.width = '0%';
  ui.confidenceText.textContent = '0%';

  toast('Cleared all photos.');
}

function renderPreviews() {
  ui.countLabel.textContent = `${state.photos.length} / ${MAX_PHOTOS}`;
  ui.previewGrid.innerHTML = state.photos
    .map((photo, index) => `
      <div class="thumb" title="${escapeAttr(photo.name)}">
        <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
        <button class="thumb-remove" data-index="${index}" aria-label="Remove photo">×</button>
      </div>
    `)
    .join('');

  ui.previewGrid.querySelectorAll('.thumb-remove').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const index = Number(button.dataset.index);
      removePhoto(index);
    });
  });
}

function removePhoto(index) {
  if (Number.isNaN(index) || !state.photos[index]) return;
  state.photos.splice(index, 1);
  renderPreviews();

  if (state.photos.length < 2) {
    state.round = 0;
    state.streak = 0;
    state.activePair = null;
    ui.battleSection.classList.add('hidden');
    ui.resultsSection.classList.add('hidden');
    stopTimer();
  } else if (state.activePair?.some((p) => !state.photos.find((x) => x.id === p.id))) {
    nextRound(true);
  }
}

function startBattle() {
  ui.battleSection.classList.remove('hidden');
  ui.resultsSection.classList.add('hidden');
  ui.battleTitle.textContent = MODE_META[state.mode].title;

  if (!state.activePair) {
    nextRound();
  } else {
    renderArena(state.activePair);
    renderConfidence();
  }
}

function nextRound(skipped = false) {
  stopTimer();
  if (state.photos.length < 2) return;

  state.round += 1;
  state.streak = skipped ? 0 : state.streak;
  ui.roundLabel.textContent = `Round ${state.round}`;
  ui.streakLabel.textContent = `Streak ${state.streak}`;

  state.activePair = pickAdaptivePair();
  renderArena(state.activePair);
  renderConfidence();

  if (state.mode === 'speed') startTimer();
}

function pickAdaptivePair() {
  const sorted = [...state.photos].sort((a, b) => {
    const seenDelta = a.seen - b.seen;
    if (seenDelta !== 0) return seenDelta;
    const balanceA = Math.abs(a.wins - a.losses);
    const balanceB = Math.abs(b.wins - b.losses);
    if (balanceA !== balanceB) return balanceA - balanceB;
    return Math.abs(a.elo - BASE_ELO) - Math.abs(b.elo - BASE_ELO);
  });

  const first = sorted[0];
  const candidatePool = sorted.slice(1, Math.min(sorted.length, 9));
  const second = candidatePool.sort((a, b) => Math.abs(a.elo - first.elo) - Math.abs(b.elo - first.elo))[0] || sorted[1];
  return [first, second];
}

function renderArena(pair) {
  const [left, right] = pair;
  const labels = MODE_META[state.mode].cardLabels;

  ui.arena.innerHTML = `
    <div class="pair-grid mode-${state.mode}">
      ${renderCard(left, labels[0], 'left')}
      ${renderCard(right, labels[1], 'right')}
    </div>
  `;

  wireBattleInteractions(left, right);
  runModeFx();
}

function renderCard(photo, label, side) {
  return `
    <article class="photo-card ${side}" data-id="${photo.id}">
      <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
      <div class="label">${label}</div>
      ${state.mode === 'boxing' ? '<div class="ring-glow"></div>' : ''}
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
  if (state.mode === 'slot') {
    ui.arena.querySelectorAll('.photo-card').forEach((card, idx) => {
      card.classList.add('slot-spin');
      setTimeout(() => card.classList.remove('slot-spin'), 450 + idx * 75);
    });
    setTimeout(() => toast('🎰 Spin complete — pick the winner!'), 250);
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
  state.locked = true;

  const expectedWinner = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400));
  const expectedLoser = 1 - expectedWinner;

  winner.elo += ELO_K * (1 - expectedWinner);
  loser.elo += ELO_K * (0 - expectedLoser);
  winner.wins += 1;
  loser.losses += 1;
  winner.seen += 1;
  loser.seen += 1;

  state.streak += 1;
  ui.streakLabel.textContent = `Streak ${state.streak}`;

  winnerCardEl.classList.add('winner');
  celebrate();
  playClickTone();
  toast(randomReaction());

  setTimeout(() => {
    state.locked = false;
    if (state.round >= recommendedRounds()) {
      finishRanking();
    } else {
      nextRound();
    }
  }, 210);
}

function recommendedRounds() {
  return Math.max(12, state.photos.length * 4);
}

function renderConfidence() {
  const votes = state.photos.reduce((acc, photo) => acc + photo.seen, 0);
  const targetVotes = recommendedRounds() * 2;
  const confidence = Math.min(100, Math.round((votes / targetVotes) * 100));
  ui.confidenceFill.style.width = `${confidence}%`;
  ui.confidenceText.textContent = `${confidence}%`;
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
  if (state.photos.length < 2) return;

  const ranked = [...state.photos].sort((a, b) => b.elo - a.elo);
  ui.resultsSection.classList.remove('hidden');

  ui.podium.innerHTML = ranked.slice(0, 3).map((photo, idx) => `
    <div class="slot">
      <strong>#${idx + 1}</strong>
      <img src="${photo.src}" alt="${escapeAttr(photo.name)}" />
      <div>${photo.name}</div>
      <small>${Math.round(photo.elo)} Elo</small>
    </div>
  `).join('');

  ui.rankingList.innerHTML = ranked.map((photo, idx) => `
    <li data-photo-id="${photo.id}">#${idx + 1} ${photo.name} — ${Math.round(photo.elo)} Elo (W:${photo.wins}/L:${photo.losses})</li>
  `).join('');

  [...ui.rankingList.querySelectorAll('li')].forEach((item) => {
    item.addEventListener('click', () => {
      const photo = state.photos.find((entry) => entry.id === item.dataset.photoId);
      if (photo) openLightbox(photo.src);
    });
  });

  toast('🏆 Ranking complete');
}

function openLightbox(src) {
  ui.lightboxImg.src = src;
  ui.lightbox.classList.remove('hidden');
}

function closeLightbox() {
  ui.lightbox.classList.add('hidden');
}

function randomReaction() {
  const reactions = [
    '🔥 Nice pick!',
    '💥 KO!',
    '✨ Clean win!',
    '👏 Crowd agrees!',
    '⚡ Fast instinct!',
  ];
  return reactions[Math.floor(Math.random() * reactions.length)];
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.add('hidden'), 1300);
}

function celebrate() {
  for (let i = 0; i < 18; i += 1) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.background = `hsl(${Math.random() * 360} 90% 60%)`;
    confetti.style.animationDuration = `${900 + Math.random() * 600}ms`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1600);
  }
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

function escapeAttr(value) {
  return String(value).replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
