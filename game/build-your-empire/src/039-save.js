// ------------------------------------------------------------------ save
// slot 1 keeps the original key so older saves are found where they always were
const slotKey = n => n > 1 ? 'buildyourempire.v1.slot' + n : 'buildyourempire.v1';
const SAVE_KEY = slotKey(SET.slot), SAVE_VERSION = 2, BAK_KEY = SAVE_KEY + '.backups', BAK_N = 3, BAK_EVERY = 10*60e3;
// carry over games saved while this was called River Feast
try { if (SET.slot === 1 && !localStorage.getItem(SAVE_KEY) && localStorage.getItem('riverfeast.v2')) localStorage.setItem(SAVE_KEY, localStorage.getItem('riverfeast.v2')); } catch (e) {}
// every change to what a save holds gets a step here: MIGRATE[n] turns a version-n save into version n+1
// (saves from before versions count as version 1)
const MIGRATE = {
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
