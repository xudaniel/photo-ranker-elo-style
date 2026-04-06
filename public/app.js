const MAX_PHOTOS = 20;
const BLITZ_SECONDS = 30;
const state = {
  photos: [],
  mode: 'head-to-head',
  running: false,
  currentPair: [],
  streak: 0,
  rounds: 0,
  decisiveVotes: 0,
  timerLeft: BLITZ_SECONDS,
  timerId: null,
};

const $ = (id) => document.getElementById(id);
const ui = {
  photoInput: $('photoInput'), previewGrid: $('previewGrid'), uploadMeta: $('uploadMeta'),
  startBtn: $('startBtn'), resetBtn: $('resetBtn'), modeGrid: $('modeGrid'),
  arena: $('arena'), results: $('results'), modeLabel: $('modeLabel'), timerChip: $('timerChip'), timer: $('timer'),
  streak: $('streak'), confidence: $('confidence'), imgA: $('imgA'), imgB: $('imgB'),
  battleStage: $('battleStage'), skipBtn: $('skipBtn'), finishBtn: $('finishBtn'),
  rankingList: $('rankingList'), podium: $('podium'), toast: $('toast'),
  lightbox: $('lightbox'), lightboxImg: $('lightboxImg')
};

function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (ui.toast.hidden = true), 1400);
}

function beep(freq = 580, dur = 80) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq; osc.connect(gain); gain.connect(ac.destination);
    gain.gain.value = 0.02; osc.start(); setTimeout(() => { osc.stop(); ac.close(); }, dur);
  } catch {}
}

function confettiBurst() {
  for (let i = 0; i < 24; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = `hsl(${Math.random() * 360} 95% 62%)`;
    c.style.animationDelay = `${Math.random() * 0.35}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
}

function createPhoto(file) {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    url: URL.createObjectURL(file),
    elo: 1000,
    wins: 0,
    losses: 0,
    matches: 0,
  };
}

function renderPreviews() {
  ui.previewGrid.innerHTML = '';
  state.photos.forEach((p, i) => {
    const fig = document.createElement('figure');
    fig.innerHTML = `<img src="${p.url}" alt="${p.name}"><span class="badge">#${i + 1}</span>`;
    fig.querySelector('img').onclick = () => openLightbox(p.url);
    ui.previewGrid.appendChild(fig);
  });
  ui.uploadMeta.textContent = `${state.photos.length} / ${MAX_PHOTOS} photos selected.`;
  ui.startBtn.disabled = state.photos.length < 2;
}

function choosePair() {
  if (state.photos.length < 2) return [];
  const sorted = [...state.photos].sort((a, b) => a.matches - b.matches || Math.abs(1000 - a.elo) - Math.abs(1000 - b.elo));
  const a = sorted[0];
  let b = sorted[1];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].id !== a.id) { b = sorted[i]; break; }
  }
  return Math.random() < 0.5 ? [a, b] : [b, a];
}

function renderPair() {
  const [a, b] = (state.currentPair = choosePair());
  if (!a || !b) return finish();
  ui.imgA.src = a.url; ui.imgA.dataset.id = a.id;
  ui.imgB.src = b.url; ui.imgB.dataset.id = b.id;
  ui.confidence.textContent = `${Math.round(confidenceMeter())}%`;
}

function confidenceMeter() {
  const m = state.photos.reduce((s, p) => s + p.matches, 0);
  const target = Math.max(1, state.photos.length * 8);
  return Math.min(100, (m / target) * 100);
}

function expected(ra, rb) { return 1 / (1 + 10 ** ((rb - ra) / 400)); }
function applyElo(win, lose) {
  const k = 24;
  const ew = expected(win.elo, lose.elo);
  const el = expected(lose.elo, win.elo);
  win.elo += k * (1 - ew);
  lose.elo += k * (0 - el);
  win.wins++; lose.losses++; win.matches++; lose.matches++;
}

function byId(id) { return state.photos.find((p) => p.id === id); }

function vote(side) {
  if (!state.running) return;
  const win = byId(side === 'A' ? ui.imgA.dataset.id : ui.imgB.dataset.id);
  const lose = byId(side === 'A' ? ui.imgB.dataset.id : ui.imgA.dataset.id);
  applyElo(win, lose);
  state.rounds++; state.decisiveVotes++; state.streak++;
  ui.streak.textContent = state.streak;
  if (state.streak % 5 === 0) { toast(`🔥 ${state.streak} streak!`); confettiBurst(); beep(720, 90); }
  else beep(620, 50);
  renderPair();
}

function skipPair() {
  state.rounds++; state.streak = 0; ui.streak.textContent = '0';
  toast('Skipped'); renderPair();
}

function configureMode() {
  const isBlitz = state.mode === 'speed-blitz';
  ui.timerChip.hidden = !isBlitz;
  ui.battleStage.className = 'battle-stage';
  if (state.mode === 'head-to-head' || state.mode === 'speed-blitz' || state.mode === 'boxing-ring') ui.battleStage.classList.add('split');
  if (state.mode === 'vibe-check') toast('Swipe vibe: choose quickly.');
  if (state.mode === 'slot-machine') toast('Slot machine luck mode 🎰');
  if (state.mode === 'runway') toast('Runway mode: style over speed.');
}

function start() {
  if (state.photos.length < 2) return;
  state.running = true; state.rounds = 0; state.decisiveVotes = 0; state.streak = 0;
  ui.results.hidden = true; ui.arena.hidden = false;
  ui.modeLabel.textContent = ui.modeGrid.querySelector('.mode-card.active').textContent;
  configureMode();
  if (state.mode === 'speed-blitz') startBlitzTimer();
  renderPair(); toast('Battle started');
}

function startBlitzTimer() {
  clearInterval(state.timerId);
  state.timerLeft = BLITZ_SECONDS;
  ui.timer.textContent = String(state.timerLeft);
  state.timerId = setInterval(() => {
    state.timerLeft--; ui.timer.textContent = String(state.timerLeft);
    if (state.timerLeft <= 0) { clearInterval(state.timerId); finish(); }
  }, 1000);
}

function finish() {
  state.running = false;
  clearInterval(state.timerId);
  const ranked = [...state.photos].sort((a, b) => b.elo - a.elo);
  ui.podium.innerHTML = '';
  ranked.slice(0, 3).forEach((p, idx) => {
    const card = document.createElement('article');
    card.className = 'podium-card';
    card.innerHTML = `<h3>${idx + 1}</h3><img src="${p.url}" alt="${p.name}"><p>${p.name}</p><strong>${Math.round(p.elo)} Elo</strong>`;
    card.querySelector('img').onclick = () => openLightbox(p.url);
    ui.podium.appendChild(card);
  });
  ui.rankingList.innerHTML = '';
  ranked.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'rank-item';
    li.innerHTML = `<span>#${i + 1}</span><img src="${p.url}" alt="${p.name}"><span>${p.name}</span><strong>${Math.round(p.elo)}</strong>`;
    li.querySelector('img').onclick = () => openLightbox(p.url);
    ui.rankingList.appendChild(li);
  });
  ui.results.hidden = false;
  confettiBurst();
  toast(`Done. ${state.decisiveVotes} picks across ${state.rounds} rounds.`);
}

function resetAll() {
  clearInterval(state.timerId);
  state.photos.forEach((p) => URL.revokeObjectURL(p.url));
  Object.assign(state, { photos: [], running: false, currentPair: [], streak: 0, rounds: 0, decisiveVotes: 0 });
  ui.arena.hidden = true; ui.results.hidden = true; ui.photoInput.value = '';
  renderPreviews(); ui.confidence.textContent = '0%'; ui.streak.textContent = '0';
  toast('Reset complete');
}

function openLightbox(src) {
  ui.lightboxImg.src = src;
  if (typeof ui.lightbox.showModal === 'function') ui.lightbox.showModal();
}

ui.photoInput.addEventListener('change', (e) => {
  const incoming = [...e.target.files].slice(0, MAX_PHOTOS - state.photos.length);
  if (!incoming.length) return;
  state.photos.push(...incoming.map(createPhoto));
  if (state.photos.length >= MAX_PHOTOS) toast('Max 20 photos reached');
  renderPreviews();
});

ui.modeGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-card'); if (!btn) return;
  ui.modeGrid.querySelectorAll('.mode-card').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active'); state.mode = btn.dataset.mode;
  if (state.running) configureMode();
});

ui.battleStage.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-pick]');
  if (pick) vote(pick.dataset.pick);
  const img = e.target.closest('img');
  if (img) openLightbox(img.src);
});

let touchStartX = 0;
ui.battleStage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
ui.battleStage.addEventListener('touchend', (e) => {
  if (state.mode !== 'vibe-check') return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 40) return;
  vote(dx < 0 ? 'B' : 'A');
}, { passive: true });

ui.startBtn.onclick = start;
ui.finishBtn.onclick = finish;
ui.skipBtn.onclick = skipPair;
ui.resetBtn.onclick = resetAll;
