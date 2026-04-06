const state = {
  photos: [],
  mode: 'head',
  round: 0,
  streak: 0,
  timerSec: 10,
  activePair: null,
  timerId: null,
};

const $ = (id) => document.getElementById(id);
const uploadInput = $('upload-input');
const previewGrid = $('preview-grid');
const countLabel = $('count-label');
const modeGrid = $('mode-grid');
const speedControls = $('speed-controls');
const battleSection = $('battle-section');
const battleTitle = $('battle-title');
const arena = $('arena');
const roundLabel = $('round-label');
const streakLabel = $('streak-label');
const confidenceFill = $('confidence-fill');
const confidenceText = $('confidence-text');
const timerShell = $('timer-shell');
const timerFill = $('timer-fill');

uploadInput.addEventListener('change', onUpload);
$('clear-btn').addEventListener('click', clearAll);
$('finish-btn').addEventListener('click', finishRanking);
$('skip-btn').addEventListener('click', () => nextRound(true));
$('speed-timer').addEventListener('input', (e) => {
  state.timerSec = Number(e.target.value);
  $('timer-label').textContent = `${state.timerSec}s`;
});
$('lightbox-close').addEventListener('click', () => $('lightbox').classList.add('hidden'));
$('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') $('lightbox').classList.add('hidden');
});
modeGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode');
  if (!btn) return;
  [...modeGrid.children].forEach((node) => node.classList.remove('active'));
  btn.classList.add('active');
  state.mode = btn.dataset.mode;
  speedControls.classList.toggle('hidden', state.mode !== 'speed');
  if (state.photos.length >= 2) startBattle();
});

function onUpload(e) {
  const files = [...e.target.files].slice(0, 20 - state.photos.length);
  if (!files.length) return;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      state.photos.push({
        id: crypto.randomUUID(),
        name: file.name,
        src: reader.result,
        elo: 1200,
        wins: 0,
        losses: 0,
        seen: 0,
      });
      renderPreviews();
      if (state.photos.length >= 2) startBattle();
    };
    reader.readAsDataURL(file);
  }
}

function clearAll() {
  stopTimer();
  state.photos = [];
  state.round = 0;
  state.streak = 0;
  state.activePair = null;
  previewGrid.innerHTML = '';
  battleSection.classList.add('hidden');
  $('results-section').classList.add('hidden');
  countLabel.textContent = '0 / 20';
  uploadInput.value = '';
  toast('Cleared all photos');
}

function renderPreviews() {
  countLabel.textContent = `${state.photos.length} / 20`;
  previewGrid.innerHTML = state.photos
    .map((p) => `<div class="thumb"><img src="${p.src}" alt="${escapeAttr(p.name)}"></div>`)
    .join('');
}

function startBattle() {
  battleSection.classList.remove('hidden');
  battleTitle.textContent = battleTitleForMode(state.mode);
  $('results-section').classList.add('hidden');
  nextRound();
}

function nextRound(skipped = false) {
  stopTimer();
  if (state.photos.length < 2) return;
  state.round += 1;
  if (skipped) state.streak = 0;
  roundLabel.textContent = `Round ${state.round}`;
  streakLabel.textContent = `Streak ${state.streak}`;
  const pair = pickAdaptivePair();
  state.activePair = pair;
  renderArena(pair);
  renderConfidence();
  if (state.mode === 'speed') startTimer();
}

function pickAdaptivePair() {
  const sorted = [...state.photos].sort((a, b) => a.seen - b.seen || Math.abs(a.wins - a.losses) - Math.abs(b.wins - b.losses));
  const a = sorted[0];
  const pool = sorted.slice(1, Math.min(sorted.length, 8));
  const b = pool.sort((x, y) => Math.abs(a.elo - x.elo) - Math.abs(a.elo - y.elo))[0] || sorted[1];
  return [a, b];
}

function renderArena(pair) {
  if (state.mode === 'vibe') return renderVibe(pair);
  if (state.mode === 'slot') return renderSlot(pair);
  if (state.mode === 'runway') return renderRunway(pair);

  const [a, b] = pair;
  arena.innerHTML = `
    <div class="pair-grid ${state.mode === 'boxing' ? 'boxing' : ''}">
      ${renderCard(a, 'Left contender')}
      ${renderCard(b, 'Right contender')}
    </div>
  `;
  wireCardClicks(pair);
}

function renderVibe([a, b]) {
  arena.innerHTML = `
    <div class="pair-grid">
      <div class="photo-card" data-id="${a.id}">${imgTag(a)}<div class="label">Swipe/Choose</div></div>
      <div class="photo-card" data-id="${b.id}">${imgTag(b)}<div class="label">Swipe/Choose</div></div>
    </div>
  `;
  wireCardClicks([a, b]);
}

function renderSlot([a, b]) {
  arena.innerHTML = `
    <div class="pair-grid">
      <div class="photo-card" data-id="${a.id}">${imgTag(a)}<div class="label">Slot A</div></div>
      <div class="photo-card" data-id="${b.id}">${imgTag(b)}<div class="label">Slot B</div></div>
    </div>`;
  wireCardClicks([a, b]);
  setTimeout(() => toast('🎰 Spin complete — pick the winner!'), 350);
}

function renderRunway([a, b]) {
  arena.innerHTML = `
    <div class="pair-grid">
      <div class="photo-card" data-id="${a.id}">${imgTag(a)}<div class="label">Runway Look A</div></div>
      <div class="photo-card" data-id="${b.id}">${imgTag(b)}<div class="label">Runway Look B</div></div>
    </div>`;
  wireCardClicks([a, b]);
}

function renderCard(photo, label) {
  return `<div class="photo-card" data-id="${photo.id}">${imgTag(photo)}<div class="label">${label}</div></div>`;
}

function imgTag(photo) {
  return `<img src="${photo.src}" alt="${escapeAttr(photo.name)}" data-lightbox="${photo.id}">`;
}

function wireCardClicks([a, b]) {
  arena.querySelectorAll('.photo-card').forEach((el) => {
    el.addEventListener('click', (ev) => {
      const winnerId = el.dataset.id;
      const winner = winnerId === a.id ? a : b;
      const loser = winnerId === a.id ? b : a;
      registerBattle(winner, loser);
    });
  });
  arena.querySelectorAll('img').forEach((img) => {
    img.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openLightbox(img.src);
    });
  });
}

function registerBattle(winner, loser) {
  const K = 24;
  const expectW = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400));
  const expectL = 1 - expectW;
  winner.elo += K * (1 - expectW);
  loser.elo += K * (0 - expectL);
  winner.wins++; loser.losses++;
  winner.seen++; loser.seen++;
  state.streak += 1;
  streakLabel.textContent = `Streak ${state.streak}`;
  celebrate();
  playClickTone();
  toast(reactionText());
  if (state.round >= recommendedRounds()) return finishRanking();
  nextRound();
}

function recommendedRounds() {
  return Math.max(12, state.photos.length * 4);
}

function renderConfidence() {
  const played = state.photos.reduce((acc, p) => acc + p.seen, 0);
  const target = recommendedRounds() * 2;
  const pct = Math.min(100, Math.round((played / target) * 100));
  confidenceFill.style.width = `${pct}%`;
  confidenceText.textContent = `${pct}%`;
}

function startTimer() {
  timerShell.classList.remove('hidden');
  const started = performance.now();
  const total = state.timerSec * 1000;
  const tick = () => {
    const elapsed = performance.now() - started;
    const pct = Math.max(0, 1 - elapsed / total);
    timerFill.style.width = `${pct * 100}%`;
    if (pct <= 0) return nextRound(true);
    state.timerId = requestAnimationFrame(tick);
  };
  state.timerId = requestAnimationFrame(tick);
}

function stopTimer() {
  timerShell.classList.toggle('hidden', state.mode !== 'speed');
  timerFill.style.width = '100%';
  if (state.timerId) cancelAnimationFrame(state.timerId);
  state.timerId = null;
}

function finishRanking() {
  stopTimer();
  if (state.photos.length < 2) return;
  const ranked = [...state.photos].sort((a, b) => b.elo - a.elo);
  $('results-section').classList.remove('hidden');
  $('podium').innerHTML = ranked.slice(0, 3).map((p, idx) => `
    <div class="slot">
      <strong>#${idx + 1}</strong>
      <img src="${p.src}" alt="${escapeAttr(p.name)}">
      <div>${p.name}</div>
      <small>${Math.round(p.elo)} Elo</small>
    </div>`).join('');

  $('ranking-list').innerHTML = ranked
    .map((p, i) => `<li data-photo="${p.id}">#${i + 1} ${p.name} — ${Math.round(p.elo)} Elo (W:${p.wins}/L:${p.losses})</li>`)
    .join('');

  $('ranking-list').querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => {
      const photo = state.photos.find((p) => p.id === li.dataset.photo);
      if (photo) openLightbox(photo.src);
    });
  });

  toast('🏆 Ranking complete');
}

function openLightbox(src) {
  $('lightbox-img').src = src;
  $('lightbox').classList.remove('hidden');
}

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => node.classList.add('hidden'), 1200);
}

function reactionText() {
  const bucket = ['🔥 Nice pick!', '💥 KO!', '✨ Clean win!', '👏 Crowd agrees!', '⚡ Fast instinct!'];
  return bucket[Math.floor(Math.random() * bucket.length)];
}

function celebrate() {
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = `hsl(${Math.random() * 360} 90% 60%)`;
    c.style.transform = `translateY(-10px) rotate(${Math.random() * 90}deg)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1300);
  }
}

function playClickTone() {
  if (!window.AudioContext) return;
  if (!playClickTone.ctx) playClickTone.ctx = new AudioContext();
  const ctx = playClickTone.ctx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 380 + Math.random() * 140;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
  osc.stop(ctx.currentTime + 0.12);
}

function battleTitleForMode(mode) {
  const labels = {
    head: 'Head-to-Head Mode',
    speed: 'Speed Blitz Mode',
    vibe: 'Vibe Check Mode',
    boxing: 'Boxing Ring Mode',
    slot: 'Slot Machine Mode',
    runway: 'Runway Mode',
  };
  return labels[mode] || 'Battle Mode';
}

function escapeAttr(v) {
  return String(v).replaceAll('"', '&quot;');
}
