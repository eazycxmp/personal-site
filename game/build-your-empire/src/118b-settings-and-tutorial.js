// ------------------------------------------------------------------ settings, save slots and the tutorial
function applyGfx() {
  // auto: a sharp-enough image at 1.5x and a 2048 shadow map; high: full retina and 4096
  if (SET.gfx !== 'low' && !MOBILE) {
    const hi = SET.gfx === 'high', pr = Math.min(hi ? 2 : 1.5, window.devicePixelRatio || 1), ms = hi ? 4096 : 2048;
    if (renderer.getPixelRatio() !== pr) { renderer.setPixelRatio(pr); fit(); }
    if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  }
  if (SET.gfx === 'low') {
    perf.low = true; renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; sun.castShadow = false; POST.on = false;
    scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); }); fit();
  } else perf.low = SET.gfx === 'high';     // high: never drop quality on its own; auto: drop once if frames are slow
}
function slotInfo(n) {
  try {
    const raw = localStorage.getItem(slotKey(n)); if (!raw) return null;
    const s = JSON.parse(raw);
    return {builds:(s.unlocked || []).length, hours:(s.playT || 0)/3600, earned:s.earned || 0, at:s.savedAt ? new Date(s.savedAt) : null};
  } catch (e) { return {broken:true}; }
}
const fmtN = v => v >= 1e9 ? (v/1e9).toFixed(1) + 'B' : v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v/1e3) + 'K' : String(Math.round(v));
function useSlot(n) {
  if (started) save();
  SET.slot = n; saveSettings(); location.reload();
}
function deleteSlot(n) {
  const key = slotKey(n), raw = localStorage.getItem(key); if (!raw) return;
  if (!confirm(`Delete the camp in slot ${n}? A backup is kept for this slot under Backups.`)) return;
  try {
    const bk = key + '.backups', list = JSON.parse(localStorage.getItem(bk) || '[]');
    list.unshift({at:Date.now(), why:'before the slot was deleted', data:raw}); localStorage.setItem(bk, JSON.stringify(list.slice(0, BAK_N)));
    localStorage.removeItem(key);
  } catch (e) {}
  if (n === SET.slot) location.reload(); else openSettings();
}
function openSettings() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'settings';
  const slots = [1, 2, 3].map(n => {
    const i = slotInfo(n), cur = n === SET.slot;
    const what = !i ? 'Empty' : i.broken ? 'Damaged save' : `${i.builds} builds · ${i.hours.toFixed(1)} h · ${fmtN(i.earned)} 💵 earned${i.at ? ' · ' + i.at.toLocaleDateString() : ''}`;
    return `<div class="slot${cur ? ' cur' : ''}"><b>Slot ${n}${cur ? ' (playing)' : ''}</b><small>${what}</small>
      <span>${cur ? '' : `<button data-use="${n}">${i ? 'Play' : 'New camp'}</button>`}${i ? `<button data-del="${n}" class="del">Delete</button>` : ''}</span></div>`;
  }).join('');
  const baks = backups().map((b, k) => `<div class="slot"><small>${new Date(b.at).toLocaleString()} · ${b.why}</small><span><button data-bak="${k}">Restore</button></span></div>`).join('') || '<small>No backups yet. One is kept every ten minutes of play.</small>';
  m.innerHTML = `<div class="card setcard"><h1 style="font-size:26px">⚙️ Settings</h1>
    <label>🔊 Sound <input type="range" id="stSfx" min="0" max="100" value="${Math.round(SET.sfx*100)}"></label>
    <label>🎵 Music <input type="range" id="stMusic" min="0" max="100" value="${Math.round(SET.music*100)}"></label>
    <label>🖥️ Graphics <select id="stGfx"><option value="auto">Auto</option><option value="high">High</option><option value="low">Low (faster)</option></select></label>
    <h2>💾 Saves</h2>${slots}
    <p><button id="stExport">Export this save</button> <button id="stImport">Import a save</button><input type="file" id="stFile" accept=".json,application/json" hidden></p>
    <p id="stMsg" class="keys"></p>
    <h2>🛟 Backups (this slot)</h2>${baks}
    <p><button id="stTut">Replay the tutorial</button></p>
    <button class="ghost" id="stClose">Close</button></div>`;
  $('stGfx').value = SET.gfx;
  $('stSfx').oninput = e => { SET.sfx = e.target.value/100; saveSettings(); };
  $('stSfx').onchange = () => snd(660, .12, 'triangle', .06);
  $('stMusic').oninput = e => { SET.music = e.target.value/100; saveSettings(); };
  $('stGfx').onchange = e => { const was = SET.gfx; SET.gfx = e.target.value; saveSettings(); if (was === 'low') location.reload(); else applyGfx(); };
  m.querySelectorAll('[data-use]').forEach(b => b.onclick = () => useSlot(+b.dataset.use));
  m.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteSlot(+b.dataset.del));
  m.querySelectorAll('[data-bak]').forEach(b => b.onclick = () => { if (confirm('Go back to this backup? Your current camp is kept as a backup too.')) restoreBackup(+b.dataset.bak); });
  $('stExport').onclick = exportSave;
  $('stImport').onclick = () => $('stFile').click();
  $('stFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; const err = importSave(await f.text()); if (err) $('stMsg').textContent = err; };
  $('stTut').onclick = () => { m.hidden = true; startTutorial(); };
  $('stClose').onclick = () => { m.hidden = true; };
}
// the tutorial: a few short steps on top of the objective line, each ticked off by doing it
const COACH = {on:false, i:0, t:0, el:null, base:null};
const COACH_STEPS = [
  {txt:'👣 Drag anywhere to walk (or use WASD / the arrow keys).', done:b => Math.hypot(player.pos.x - b.x, player.pos.z - b.z) > 4},
  {txt:'🎯 The line at the top always says what to do next, and the arrow points the way. Stand on a tile to use it.', done:b => W.earned > b.earned || W.unlocked.size > b.builds},
  {txt:'💵 Cash piles up by your stalls: walk over a pile to pick it up, then stand on a dashed tile to build something new.', done:b => W.unlocked.size > b.builds},
  {txt:'🧭 The buttons on the right open the 🌍 world map, 🏛️ your empire, 🏗️ parks and rides, ⏸️ pause and ⚙️ saves & settings.', done:(b, t) => t > 12},
];
function startTutorial() {
  if (!COACH.el) {
    COACH.el = document.createElement('div'); COACH.el.id = 'tut'; $('stage').appendChild(COACH.el);
    COACH.el.onclick = e => { if (e.target.dataset.skip != null) endTutorial(); else if (e.target.dataset.next != null) nextTut(); };
  }
  COACH.on = true; COACH.i = -1; nextTut();
}
function nextTut() {
  COACH.i++; COACH.t = 0;
  if (COACH.i >= COACH_STEPS.length) { endTutorial(); banner('🎓 You know the ropes', 'Build your camp into an empire. ⚙️ has the tutorial if you want it again.'); return; }
  COACH.base = {x:player.pos.x, z:player.pos.z, earned:W.earned, builds:W.unlocked.size};
  COACH.el.hidden = false;
  COACH.el.innerHTML = `<small>${COACH.i + 1} / ${COACH_STEPS.length}</small><p>${COACH_STEPS[COACH.i].txt}</p><span><button data-next>${COACH.i === COACH_STEPS.length - 1 ? 'Got it' : 'Next'}</button><button data-skip class="ghost">Skip tutorial</button></span>`;
}
function endTutorial() { COACH.on = false; if (COACH.el) COACH.el.hidden = true; SET.tutDone = true; saveSettings(); }
function updTut(dt) {
  if (!COACH.on || !started || paused) return;
  COACH.t += dt;
  if (COACH_STEPS[COACH.i].done(COACH.base, COACH.t)) { snd(880, .1, 'triangle', .04); nextTut(); }
}
