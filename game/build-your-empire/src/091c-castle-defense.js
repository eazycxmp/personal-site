// ------------------------------------------------------------------ castle defense: the waves keep coming
// Once you have a castle, an enemy army marches on you every few minutes, each one bigger than the last. The waves
// chase your strength from behind: they are sized from where your defense stood a few waves ago, so an empire that
// keeps growing holds, and one that stands still is caught. Hold a wave and you take its loot; lose one and a whole
// district is overrun (burnt, its stations dead) until you pay to rebuild it. Lose a wave with every district already
// gone and the keep itself falls: the end of your empire.
// Towers and ramparts, bought here with cash, multiply your defense; towers also shoot at every wave that comes.
const QUARTER = {chk:0, flames:{}, dark:new Map(), restored:false, towers:[], towerLv:-1, hud:null};
// outer districts fall first; the camp (the keep) is last
const QUARTER_ORDER = ['farm', 'south', 'east', 'airfield', 'ranch', 'north', 'downtown'];
const QUARTER_NAME = {farm:'the Farmlands', south:'the Military Grounds', east:'the Market Quarter', airfield:'the Airfield', ranch:'the Ranch', north:'the Northern Quarry', downtown:'Downtown', camp:'the Keep'};
const waveState = () => W.flags.wave ||= {n:0, t:240, track:0, held:0, lost:0};
const defLv = () => W.flags.def ||= {towers:0, ramparts:0};
// each level of towers or ramparts adds 7% to your defense
const defenseMult = () => 1 + .07*(defLv().towers + defLv().ramparts);
const defUpCost = (kind, lv) => Math.round((kind === 'towers' ? 5000 : 4000) * Math.pow(2.3, lv) * (1 + .2*W.era));
const DEF_MAX = 6;
const lostQuarters = () => W.flags.lostQ ||= {};
const openQuarters = () => QUARTER_ORDER.filter(id => regionOpen(id) && PADS.some(p => p.region === id && W.unlocked.has(p.id)));
const quarterPads = id => PADS.filter(p => p.region === id && W.unlocked.has(p.id));
// which district a station stands in: its own pad's, else the nearest pad's
function stationQuarter(st) {
  const own = PADS.find(p => p.id === st.id); if (own) return own.region || 'camp';
  const [x, z] = st.inZ || st.outZ || [0, 0]; let best = null, bd = 9;
  for (const p of PADS) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd && W.unlocked.has(p.id)) { bd = d; best = p; } }
  return best ? best.region || 'camp' : 'camp';
}
const quarterAt = id => { const ps = quarterPads(id); if (!ps.length) return null; return [ps.reduce((a, p) => a + p.x, 0)/ps.length, ps.reduce((a, p) => a + p.z, 0)/ps.length]; };
const quarterCost = id => Math.max(3000, Math.round(quarterPads(id).reduce((a, p) => a + (p.cur === 'coin' || !p.cur ? p.cost || 0 : 0), 0)*.3*(1 + .1*W.era)));
// how strong the next wave will be (before its ±10% roll)
function waveStrength() {
  const S = waveState(), n = S.n, abs = 8*Math.pow(1.09, n);
  const a = Math.max(abs, (S.track || defPower()*.6)*Math.min(1.12, .72 + .025*n));
  return n < 2 ? Math.min(a, defPower()*.8) : a;   // the first two waves are there to learn on
}
// who comes: a rival at war with you first, then whoever you have met; the Sky Citadel only after the Moon
function waveRival() {
  const ok = EMP.list.filter(r => { const s = es(r); return !s.owned && s.stance !== 'ally' && s.stance !== 'occupied' && !(r.sky && !W.unlocked.has('moonLanding')); });
  return ok.find(r => es(r).stance === 'war') || ok.filter(r => es(r).met).sort((a, b) => es(b).pow - es(a).pow)[0] || ok[0] || null;
}
function startWave() {
  const r = waveRival(), S = waveState(); if (!r) { S.t = 120; return; }
  const atk = waveStrength()*(.9 + R()*.2);
  S.n++; SIEGE.wave = S.n; SIEGE.atkOverride = atk;
  startSiege(r);
  SIEGE.atkOverride = null;
  banner(`⚔️ Wave ${S.n}: ${r.icon} ${r.n} attacks!`, `Their ⚔️${Math.round(atk)} vs your 🛡️${Math.round(defPower())}. Hold the walls!`);
}
// any siege on your town counts as a wave: the clock to the next starts again
function waveBegun() {
  const S = waveState(); S.t = Math.max(150, 330 - 8*S.n);
  // the waves follow your defense from behind: a third of the way to where it is now
  const d = defPower(); S.track = S.track ? S.track + (d - S.track)*.35 : d*.7;
}
function waveOver(win) {
  const S = waveState(); SIEGE.wave = null;
  if (win) { S.held++; return; }
  S.lost++;
  const left = openQuarters().filter(id => !lostQuarters()[id]);
  if (!left.length) { keepFalls(); return; }
  loseQuarter(left[0]);
}
// a district is overrun: its buildings burn and go dark, its stations stop, until you rebuild it
function loseQuarter(id) {
  const LQ = lostQuarters(); if (LQ[id]) return;
  LQ[id] = {cost:quarterCost(id), paid:0};
  quarterDown(id, true);
  banner(`🔥 ${QUARTER_NAME[id]} is overrun!`, `Its buildings burn and its stations stand idle. Rebuild it on the 🏗️ tile there (${LQ[id].cost.toLocaleString()} 💵). Lose every district and the keep falls.`, true);
}
const darkMat = m => { if (m.userData.qDark) return m; let c = QUARTER.dark.get(m); if (!c) { c = m.clone(); if (c.color) c.color.multiplyScalar(.32); if (c.emissive) c.emissive.setHex(0); c.userData.qDark = true; c.userData.qOrig = m; QUARTER.dark.set(m, c); } return c; };
function quarterDown(id, on) {
  for (const p of quarterPads(id)) for (const g of PADOBJ[p.id] || []) g.traverse(o => {
    if (!o.isMesh || !o.material || Array.isArray(o.material) || CHARS.has(o)) return;
    o.material = on ? darkMat(o.material) : o.material.userData.qOrig || o.material;
  });
  for (const st of Object.values(ST)) if (st.inZ && stationQuarter(st) === id) {
    if (on && !st.broken) { st.broken = true; st.busy = false; st.qDown = true; }
    if (!on && st.qDown) { st.qDown = false; if (!st.ruin) st.broken = false; }
  }
  for (const F of QUARTER.flames[id] || []) F.t = 0; QUARTER.flames[id] = [];
  const zn = QUARTER['z_' + id]; if (zn) { removeZone(zn); QUARTER['z_' + id] = null; }
  if (on) {
    const at = quarterAt(id); if (!at) return;
    for (let k = 0; k < 4; k++) QUARTER.flames[id].push(warFlame(at[0] + (R() - .5)*14, .2, at[1] + (R() - .5)*14, 1.1 + R()*.6, 1e9));
    let spot = at; for (let rr = 0; rr < 14 && !(freeSpot(spot[0], spot[1], 1.2) && inArea(spot[0], spot[1])); rr++) { const a = rr*2.1; spot = [at[0] + Math.cos(a)*rr, at[1] + Math.sin(a)*rr]; }
    QUARTER['z_' + id] = addZone({kind:'rebuildQuarter', q:id, x:spot[0], z:spot[1], w:1.8, d:1.8, icon:'🏗️', tile:quarterTile(id)});
  }
}
function quarterTile(id) { const L = lostQuarters()[id]; return {cost:L.cost - L.paid, cur:'💵', prog:L.paid/L.cost, title:'Rebuild'}; }
function payQuarter(zn, e) {
  const id = zn.q, L = lostQuarters()[id]; if (!L) { removeZone(zn); return; }
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(L.cost - L.paid, W.coins, Math.max(1, Math.ceil(L.cost/25)));
  spend(amt); L.paid += amt; e.tick = .05; snd(480 + L.paid/L.cost*420, .03, 'square', .025);
  if (L.paid >= L.cost) {
    delete lostQuarters()[id]; quarterDown(id, false); puff(zn.x, zn.z); shakeCam(.3);
    banner(`🏗️ ${QUARTER_NAME[id]} is rebuilt!`, 'Its stations are back at work.'); save(); return;
  }
  drawTile(zn.tc.g, '🏗️', quarterTile(id)); zn.tc.t.needsUpdate = true;
}
// the end: every district gone and the keep stormed
function keepFalls() {
  // keep the camp as it stood just before the fall (every district lost, but still yours to rebuild) as a backup
  const S = waveState(); save(); try { backupSave('before the keep fell'); } catch (e) {}
  W.flags.fallen = {wave:S.n, held:S.held, era:W.era}; save();
  showFallen();
}
function showFallen() {
  const F = W.flags.fallen, m = $('modal'); m.hidden = false; m.dataset.panel = 'fallen'; setPause(true); $('pauseOv').hidden = true;
  m.innerHTML = `<div class="card"><h1>🏚️ Your empire has fallen</h1><p>Every district was overrun and wave ${F.wave} stormed the keep.</p>
    <p>You held <b>${F.held}</b> wave${F.held === 1 ? '' : 's'}, and your empire reached ${ERAS[F.era] || 'age ' + F.era}.</p>
    <p class="keys">Your camp just before the keep fell is kept in ⚙️ Saves, to load and rebuild from.</p><button id="fallNew">Start a new empire</button></div>`;
  $('fallNew').onclick = wipe;
}
// ------------------------------------------------------------------ towers along the southern approach
const TOWER_AT = [[-13, 86], [-7, 88.5], [-1, 89.5], [7, 89.5], [13, 88.5], [18, 86]];
function buildTowers() {
  const lv = defLv().towers; if (lv === QUARTER.towerLv) return; QUARTER.towerLv = lv;
  for (const T of QUARTER.towers) scene.remove(T.g); QUARTER.towers = [];
  if (!lv) return;
  const n = Math.min(TOWER_AT.length, 2 + lv);
  for (let i = 0; i < n; i++) {
    let [x, z] = TOWER_AT[i]; if (!freeSpot(x, z, .9)) { const alt = [[x, z + 2.5], [x + 2.5, z], [x - 2.5, z], [x, z - 2.5]].find(([a, b]) => freeSpot(a, b, .9)); if (!alt) continue; [x, z] = alt; }
    const g = new THREE.Group(); g.position.set(x, elevAt(x, z), z); scene.add(g);
    const stone = lv >= 2, modern = lv >= 4, h = 3 + Math.min(lv, 4)*.6;
    if (!stone) { for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) mesh(G.box, 0x6b4526, [.16, h, .16], [a, h/2, b], g); mesh(G.box, 0x7a5232, [1.5, .18, 1.5], [0, h, 0], g); }
    else if (!modern) { mesh(G.cyl, 0x9a9284, [.9, h, .9], [0, h/2, 0], g); for (let k = 0; k < 8; k++) { const a = k/8*Math.PI*2; mesh(G.box, 0x8f887a, [.3, .4, .3], [Math.cos(a)*.78, h + .2, Math.sin(a)*.78], g); } }
    else { mesh(G.box, 0x8a8e92, [1.7, h, 1.7], [0, h/2, 0], g); mesh(G.box, 0x1a1a1a, [1.72, .16, .5], [0, h - .7, 0], g); mesh(G.box, 0x5a6048, [1.9, .25, 1.9], [0, h + .12, 0], g); }
    // the gun on top: a bow-man's post, a cannon, a machine gun, then a laser crystal
    const head = new THREE.Group(); head.position.y = h + .3; g.add(head);
    if (lv === 3) mesh(G.cyl, 0x2a2a2e, [.14, .9, .14], [0, .1, .3], head, {metalness:.6}).rotation.x = Math.PI/2;
    if (lv === 4 || lv === 5) { mesh(G.box, 0x3a3e44, [.4, .3, .5], [0, 0, 0], head, {metalness:.5}); mesh(G.cyl, 0x1a1a1e, [.05, .8, .05], [0, .05, .5], head, {metalness:.7}).rotation.x = Math.PI/2; }
    if (lv >= 6) mesh(G.cone, 0x9af4ff, [.35, 1, .35], [0, .4, 0], head, {emissive:0x3ab0e8, emissiveIntensity:1});
    boxes.push(g.box = {x0:x - .9, x1:x + .9, z0:z - .9, z1:z + .9});
    QUARTER.towers.push({g, head, x, z, h, cd:R()});
  }
}
const SHOT_MAT = {};
function towerFire(dt) {
  if (!W.raid || !W.raid.siege) return;
  const lv = defLv().towers, alive = SIEGE.foes.filter(f => f.alive);
  if (!alive.length) return;
  for (const T of QUARTER.towers) {
    if ((T.cd -= dt) > 0) continue;
    let f = null, bd = 22; for (const q of alive) { const d = Math.hypot(q.pos.x - T.x, q.pos.z - T.z); if (d < bd) { bd = d; f = q; } }
    if (!f) { T.cd = .5; continue; }
    T.cd = [0, 1.6, 1.3, 1.5, .18, .14, .5][lv] * (.8 + R()*.4);
    T.head.rotation.y = Math.atan2(f.pos.x - T.x, f.pos.z - T.z);
    const col = lv >= 6 ? 0x8af0ff : lv >= 4 ? 0xffe27a : lv === 3 ? 0x2a2a2e : 0x8a6a42;
    const m = SHOT_MAT[col] ||= new THREE.MeshBasicMaterial({color:col, toneMapped:false});
    const from = new THREE.Vector3(T.x, T.g.position.y + T.h + .4, T.z), to = f.pos.clone().setY(.9), b = new THREE.Mesh(G.sph, m); b.scale.setScalar(lv === 3 ? .14 : .07); b.position.copy(from); scene.add(b);
    const dmg = [0, 1.2, 1.6, 3, .7, .9, 4][lv];
    flyers.push({m:b, from, to, t:0, dur:lv >= 4 ? .18 : .45, arc:lv <= 2 ? .5 : 0, done:() => {
      if (lv === 3) for (let k = 0; k < 8; k++) particle([0xffd040, 0x555555][k % 2], to.clone(), new THREE.Vector3((R() - .5)*4, 2 + R()*2, (R() - .5)*4), .7, .22, {grow:.5, op:.8});
      for (const q of SIEGE.foes) if (q.alive && Math.hypot(q.pos.x - to.x, q.pos.z - to.z) < (lv === 3 ? 1.8 : .8)) { q.hp -= dmg; q.hit = .12; if (q.hp <= 0) knockOut(q); }
    }});
    if (Math.hypot(T.x - player.pos.x, T.z - player.pos.z) < 30 || watchingWar()) snd(lv >= 4 ? 170 : lv === 3 ? 70 : 600, lv >= 4 ? .03 : .12, lv === 3 ? 'sawtooth' : 'square', .03);
  }
}
// ------------------------------------------------------------------ the wave clock on screen, and the defense panel
function waveHud() {
  if (!QUARTER.hud) {
    const b = QUARTER.hud = document.createElement('button'); b.id = 'bWave';
    b.style.cssText = 'position:absolute;right:12px;top:54px;z-index:20;font:600 13px system-ui;padding:6px 12px;border-radius:16px;border:0;background:rgba(120,20,20,.85);color:#fff;cursor:pointer';
    b.onclick = () => { if (started) openDefense(); }; document.body.appendChild(b);
  }
  const b = QUARTER.hud, S = waveState(), on = !!W.castle && !W.flags.fallen;
  b.hidden = !on || !started || PHOTO.on || SPACE.view; if (b.hidden) return;
  const lost = Object.keys(lostQuarters()).length;
  const t = W.raid && W.raid.siege ? '⚔️ under attack!' : `⚔️ Wave ${S.n + 1} in ${Math.floor(S.t/60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}`;
  b.textContent = `${t} · 🛡️ ${Math.round(defPower())}${lost ? ` · 🔥 ${lost} lost` : ''}`;
}
function openDefense() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'defense';
  const S = waveState(), D = defLv(), fmt = n => Math.round(n).toLocaleString(), next = waveStrength(), def = defPower();
  const line = (kind, icon, name, what) => {
    const lv = D[kind], max = lv >= DEF_MAX, c = defUpCost(kind, lv);
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid #0001;text-align:left"><span>${icon} <b>${name}</b> · level ${lv}/${DEF_MAX}<br><small>${what}</small></span>${max ? '<b>Max</b>' : `<button data-up="${kind}" ${W.coins < c ? 'disabled' : ''}>${fmt(c)} 💵</button>`}</div>`;
  };
  const quarters = openQuarters().map(id => `${lostQuarters()[id] ? '🔥' : '🏠'} ${QUARTER_NAME[id]}`).join(' · ');
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">🏰 Castle defense</h1>
    <p>Wave ${S.n + 1} comes in ${Math.floor(S.t/60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}, about <b>⚔️${fmt(next)}</b> strong. Your defense: <b style="color:${def >= next ? '#2f9e44' : '#b83a2a'}">🛡️${fmt(def)}</b>.</p>
    <p class="keys">Held ${S.held} · lost ${S.lost}. Waves grow from where your defense stood a few waves ago: keep growing your army, walls and science to stay ahead.</p>
    ${line('towers', '🗼', 'Towers', 'Shoot at every wave: arrows, then cannon, machine guns, a laser. +7% defense a level.')}
    ${line('ramparts', '🧱', 'Ramparts', 'Thicker walls and a stronger gate. +7% defense a level.')}
    <p style="text-align:left"><b>Districts</b>: ${quarters || 'none yet'}. A lost wave burns one; lose them all and the keep falls.</p>
    <button class="ghost" id="dfClose">Close</button></div>`;
  for (const btn of m.querySelectorAll('[data-up]')) btn.onclick = () => { const k = btn.dataset.up, c = defUpCost(k, D[k]); if (W.coins < c || D[k] >= DEF_MAX) return; spend(c); D[k]++; snd(660, .2, 'triangle', .05); if (k === 'towers') buildTowers(); save(); openDefense(); };
  $('dfClose').onclick = () => { m.hidden = true; };
}
function updWaves(dt) {
  if (!started) return;
  if (W.flags.fallen) { if (!QUARTER.fallShown) { QUARTER.fallShown = true; showFallen(); } return; }
  // after a load: districts that were lost go dark again, towers stand again
  if (!QUARTER.restored && EMP.loaded) { QUARTER.restored = true; for (const id of Object.keys(lostQuarters())) quarterDown(id, true); }
  buildTowers(); towerFire(dt); waveHud();
  if (!W.castle) return;
  const S = waveState();
  if (!W.flags.waveTold) { W.flags.waveTold = 1; note('🏰 The waves are coming', 'Now you have a castle, enemy armies will march on you every few minutes, each bigger than the last. Tap the red ⚔️ wave clock to see the next one and build towers and ramparts.'); }
  if (W.raid || W.camp || INV.on || BOSS.on) return;
  const t0 = S.t; S.t -= dt;
  if (t0 > 30 && S.t <= 30) banner(`⚔️ Wave ${S.n + 1} in 30 seconds`, `About ⚔️${Math.round(waveStrength())} strong, against your 🛡️${Math.round(defPower())}.`);
  if (S.t <= 0) startWave();
}
