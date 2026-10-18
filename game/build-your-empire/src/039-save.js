// ------------------------------------------------------------------ save
// slot 1 keeps the original key so older saves are found where they always were
const slotKey = n => n > 1 ? 'buildyourempire.v1.slot' + n : 'buildyourempire.v1';
const SAVE_KEY = slotKey(SET.slot), SAVE_VERSION = 5, BAK_KEY = SAVE_KEY + '.backups', BAK_N = 3, BAK_EVERY = 10*60e3;
// carry over games saved while this was called River Feast
try { if (SET.slot === 1 && !localStorage.getItem(SAVE_KEY) && localStorage.getItem('riverfeast.v2')) localStorage.setItem(SAVE_KEY, localStorage.getItem('riverfeast.v2')); } catch (e) {}
// every change to what a save holds gets a step here: MIGRATE[n] turns a version-n save into version n+1
// (saves from before versions count as version 1)
// the map redesign of Oct 2026 (districts pulled in): old (x, z) -> new, for things a save remembers by position
const REDESIGN = (() => {
  const fzRow = z => z <= -42.9 ? z + 12 : z < -24 ? -24 + (z + 24)*(6.9/18.9) : z <= 28 ? z : z < 46 ? 28 + (z - 28)*(6/18) : z - 12;
  const INF = 1e9;
  // first match wins; rects are in OLD coordinates
  const FEATURES = [
    {n:'strip',    x0:-172,  x1:-44,   z0:117,  z1:192,  dx:27,   dz:-30},
    {n:'ihw',      x0:-53,   x1:-37.5, z0:-70,  z1:131,  dx:0,    dz:'row'},
    {n:'gas',      x0:-32,   x1:-24.5, z0:21,   z1:31,   dx:0,    dz:3},
    {n:'hwWest',   x0:-110,  x1:-95,   z0:6,    z1:18,   dx:44,   dz:0},
    {n:'airbase',  x0:14.5,  x1:42.9,    z0:84,   z1:114.5,dx:54,   dz:-2},
    {n:'regiment', x0:19.5,  x1:41.5,  z0:46,   z1:74.5, dx:-3,   dz:'row'},
    {n:'kumo',     x0:-170,  x1:-128,  z0:-14,  z1:38,   dx:50,   dz:0},
    {n:'aztlan',   x0:-252,  x1:-206,  z0:-14,  z1:38,   dx:70,   dz:0},
    {n:'nordheim', x0:-450,  x1:-370,  z0:10,   z1:95,   dx:100,  dz:0},
    {n:'nile',     x0:186,   x1:236,   z0:-22,  z1:26,   dx:-60,  dz:0},
    {n:'hellas',   x0:258,   x1:312,   z0:-22,  z1:26,   dx:-90,  dz:0},
    {n:'rajpur',   x0:370,   x1:450,   z0:10,   z1:95,   dx:-130, dz:0},
    {n:'azul',     x0:116,   x1:164,   z0:-152, z1:-96,  dx:-20,  dz:12},
    // the continent's east and west coasts come in with the far lands (the islands keep ~10 of sea from them)
    {n:'eastEdge', x0:296,   x1:345,   z0:-INF, z1:INF,  dx:-90,  dz:0},
    {n:'westEdge', x0:-345,  x1:-296,  z0:-INF, z1:INF,  dx:60,   dz:0},
    {n:'far',      x0:76,    x1:186,   z0:-62,  z1:62,   dx:-10,  dz:0},
    {n:'east',     x0:40,    x1:80,    z0:-INF, z1:INF,  dx:-10,  dz:'row'},
    {n:'west',     x0:-96,   x1:-75.5, z0:-75,  z1:100,  dx:55,   dz:'row'},
    {n:'camp',     x0:-24,   x1:30.5,  z0:-INF, z1:INF,  dx:0,    dz:'row'},
  ];
  const dzOf = (f, z) => f.dz === 'row' ? fzRow(z) - z : f.dz;
  const rectDist = (f, x, z) => Math.hypot(Math.max(f.x0 - x, 0, x - f.x1), Math.max(f.z0 - z, 0, z - f.z1));
  function feat(x, z) {
    for (const f of FEATURES) if (x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1) return f;
    // in a gap: the camp-east strip blends from the camp to the east column; elsewhere the nearest district decides
    if (x > 30.5 && x < 40) return {n:'gapE', dx:-10*(x - 30.5)/9.5, dz:'row'};
    let best = null, bd = INF; for (const f of FEATURES) { const d = rectDist(f, x, z); if (d < bd) { bd = d; best = f; } }
    return best;
  }
  function shift(x, z) { const f = feat(x, z); return [f.dx, dzOf(f, z), f.n]; }
  function warp(x, z) { const [dx, dz] = shift(x, z); return [x + dx, z + dz]; }
  // for a lone x: the dx if every district spanning that x agrees on it (null when it depends on z)
  return {warp};
})();
const MIGRATE = {
  // weapons became their own line (swords, bows, muskets, rifles, semi-automatics): an army with muskets already had bows
  4: s => { if ((s.unlocked || []).includes('guns') && !s.unlocked.includes('bows')) s.unlocked.splice(s.unlocked.indexOf('guns'), 0, 'bows'); return s; },
  // the map redesign: the parks, statues and rides you placed move with their district
  3: s => { for (const d of s.decor || []) if (typeof d.x === 'number' && typeof d.z === 'number') [d.x, d.z] = REDESIGN.warp(d.x, d.z); return s; },
  // military technology is bought with cash now (planes, troops, castles, the hangar and warship were materials that
  // builders paid on their own): materials already paid toward an unbuilt one are not cash, so those pads start from zero
  2: s => {
    const was = ['plane1', 'mess', 'barracks', 'troop1', 'troop2', 'troop3', 'siegeWorks', 'castle2', 'castle3', 'warship', 'guns', 'hangar', 'castle4'];
    for (const id of was) if (s.paid && !(s.unlocked || []).includes(id)) delete s.paid[id];
    return s;
  },
  1: s => {
    s.flags = s.flags || {}; s.decor = s.decor || [];
    if (typeof s.cash === 'number') s.cash = {main:s.cash};
    // placed decorations from the compact map, then from the first wide map (the quarry and market quarter came 30 closer)
    if (!s.flags.spread) { for (const d of s.decor) [d.x, d.z] = spreadPt(d.x, d.z); s.flags.spread = 2; }
    if (s.flags.spread === 1) { for (const d of s.decor) [d.x, d.z] = closerPt(d.x, d.z); s.flags.spread = 2; }
    return s;
  },
};
function migrate(s) {
  let v = s.v || 1;
  while (v < SAVE_VERSION) { s = MIGRATE[v](s); v++; }
  s.v = Math.max(v, s.v || 1); return s;
}
// rolling backups: the last few saves, one every ten minutes of play, plus one before anything that replaces the save
function backups() { try { return JSON.parse(localStorage.getItem(BAK_KEY) || '[]'); } catch (e) { return []; } }
let lastBak = (backups()[0] || {}).at || 0;
function backupSave(why) {
  try {
    const cur = localStorage.getItem(SAVE_KEY); if (!cur) return;
    const list = backups().filter(b => b.data !== cur);
    list.unshift({at:Date.now(), why, data:cur});
    localStorage.setItem(BAK_KEY, JSON.stringify(list.slice(0, BAK_N))); lastBak = Date.now();
  } catch (e) {}
}
// a save that will not load is kept aside, and the newest backup is tried instead (once per visit)
function saveBroken(raw, err) {
  console.error('save would not load', err);
  try {
    if (!localStorage.getItem(SAVE_KEY + '.broken')) localStorage.setItem(SAVE_KEY + '.broken', raw);
    const b = backups().find(b => b.data !== raw && b.why !== 'would not load');
    const list = backups(); if (!list.some(q => q.data === raw)) { list.unshift({at:Date.now(), why:'would not load', data:raw}); localStorage.setItem(BAK_KEY, JSON.stringify(list.slice(0, BAK_N + 1))); }
    if (b && !sessionStorage.getItem('bye.restored')) { sessionStorage.setItem('bye.restored', '1'); localStorage.setItem(SAVE_KEY, b.data); location.reload(); }
  } catch (e) {}
}
function restoreBackup(i = 0) { const b = backups()[i]; if (!b) return false; backupSave('before restoring a backup'); localStorage.setItem(SAVE_KEY, b.data); location.reload(); return true; }
// take the save with you, or bring one back
function exportSave() {
  save();
  const a = document.createElement('a'), d = new Date();
  a.href = URL.createObjectURL(new Blob([localStorage.getItem(SAVE_KEY) || '{}'], {type:'application/json'}));
  a.download = `build-your-empire-${d.toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importSave(text) {
  let s; try { s = JSON.parse(text); } catch (e) { return 'That file is not a save.'; }
  if (!s || typeof s !== 'object' || !Array.isArray(s.unlocked)) return 'That file is not a save.';
  backupSave('before importing a save'); localStorage.setItem(SAVE_KEY, JSON.stringify(s)); location.reload(); return '';
}
