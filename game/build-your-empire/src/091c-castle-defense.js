// ------------------------------------------------------------------ castle defense: the waves keep coming
// Once you have a castle, an enemy army marches on you every few minutes, each one bigger than the last. Every rival
// comes down a road of its own; the roads meet at a junction south-east of town, and from there one road runs in to
// your gate. That road is where you build your defenses: a barricade at the junction, three towers along it and a
// gatehouse at the end. Each one levels up as the ages go on, and the army that reaches your walls is only what is
// left after the march. The waves chase your strength from behind (sized from where your defense stood a few waves
// ago), and a town that grows draws them on: each new district or age makes the next waves bigger, and the newest
// district, out on the edge, is the first to fall. Hold a wave and you take its loot; lose one and a whole district is
// overrun (burnt, its stations dead) until you pay to rebuild it. Lose a wave with every district already gone and
// the keep itself falls: the end of your empire.
const QUARTER = {chk:0, flames:{}, dark:new Map(), restored:false, hud:null, sites:{}, roads:null};
// the order districts fall in: the newest first (it is out on the edge); the camp (the keep) is last
const QUARTER_ORDER = ['farm', 'south', 'east', 'airfield', 'ranch', 'north', 'downtown'];
const QUARTER_NAME = {farm:'the Farmlands', south:'the Military Grounds', east:'the Market Quarter', airfield:'the Airfield', ranch:'the Ranch', north:'the Northern Quarry', downtown:'Downtown', camp:'the Keep'};
const waveState = () => W.flags.wave ||= {n:0, t:240, track:0, held:0, lost:0, heat:0};
// ------------------------------------------------------------------ the roads
const ROAD_JUNCTION = [64, 150];
const ROAD_IN = [[64, 150], [44, 122], [26, 104], [14, 93]];
// each rival's own road to the junction: east and west along the old trade roads, Ostberg from beyond its city,
// and anyone who comes by sea from a landing on the south beach
function rivalRoad(r) {
  const J = ROAD_JUNCTION;
  if (r.via === 'east') return [r.bf, [150, 40], [118, 110], J];
  if (r.via === 'west') return [r.bf, [-62, 70], [-46, 100], [-40, 168], [30, 170], J];
  if (r.via === 'south') return [[2.5, 150], [30, 160], J];
  return [[64, 214], J];
}
const waveRoute = r => [...rivalRoad(r), ...ROAD_IN.slice(1)];
// a point a fraction t of the way along a polyline, and the direction there
function along(pts, t) {
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = L.reduce((a, b) => a + b, 0);
  let d = t*tot; for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const f = Math.min(1, d/L[i]), [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; return {x:x0 + (x1 - x0)*f, z:z0 + (z1 - z0)*f, dx:(x1 - x0)/L[i], dz:(z1 - z0)/L[i]}; } d -= L[i]; }
}
// a dirt road laid in short pieces (none over water or under a building)
function roadRibbon(pts, w, col, g) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1], [x1, z1] = pts[i], L = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
    let run = null;
    const flush = () => { if (!run) return; const len = run[1] - run[0]; if (len > .5) { const m = (run[0] + run[1])/2, x = x0 + (x1 - x0)*m/L, z = z0 + (z1 - z0)*m/L; const r = mesh(G.box, col, [w, .04, len + .3], [x, elevAt(x, z) + .03, z], g); r.rotation.y = yaw; r.receiveShadow = true; } run = null; };
    for (let s = 0; s <= L; s += 1) {
      const x = x0 + (x1 - x0)*s/L, z = z0 + (z1 - z0)*s/L, ok = !isWater(x, z) && !boxes.some(b => x > b.x0 - .3 && x < b.x1 + .3 && z > b.z0 - .3 && z < b.z1 + .3);
      if (ok) { if (!run) run = [s, s]; run[1] = s; } else flush();
    }
    flush();
  }
}
function buildRoads() {
  if (QUARTER.roads) return; const g = QUARTER.roads = new THREE.Group(); scene.add(g);
  const seen = new Set();
  for (const r of EMP.list) {
    const pts = rivalRoad(r), key = JSON.stringify(pts); if (seen.has(key)) continue; seen.add(key);
    roadRibbon(pts, 2, 0x9a8466, g);
    // a post where each road leaves its rival, with their name on it
    const [x, z] = pts[0], post = new THREE.Group(); post.position.set(x, elevAt(x, z), z); g.add(post);
    mesh(G.cyl, 0x5e3f22, [.08, 2.4, .08], [1.6, 1.2, 0], post);
    const names = EMP.list.filter(q => JSON.stringify(rivalRoad(q)) === key).map(q => q.n.replace(/^the /, '')).join(' · ');
    const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(names.toUpperCase(), '#5a1e18', '#ffe9a8'), toneMapped:false, side:THREE.DoubleSide})); sign.scale.set(Math.min(6, 1 + names.length*.16), .5, 1); sign.position.set(1.6, 2.2, 0); post.add(sign);
  }
  roadRibbon(ROAD_IN, 3.2, 0x8a7050, g);
  const [jx, jz] = ROAD_JUNCTION, sg = new THREE.Group(); sg.position.set(jx + 3, elevAt(jx + 3, jz), jz + 2); g.add(sg);
  mesh(G.cyl, 0x5e3f22, [.09, 2.8, .09], [0, 1.4, 0], sg);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('THE ROAD IN', '#5a1e18', '#ffe9a8'), toneMapped:false, side:THREE.DoubleSide})); sign.scale.set(2.6, .5, 1); sign.position.set(0, 2.6, 0); sg.add(sign);
}
// ------------------------------------------------------------------ the defenses on the road in
// t: how far along the road in (0 at the junction, 1 at your gate); side: which verge
const DEFSITES = [
  {id:'bar', kind:'bar', t:.05, side:0, name:'Barricade', icon:'🚧'},
  {id:'t1', kind:'tower', t:.3, side:1, name:'Outer tower', icon:'🗼'},
  {id:'t2', kind:'tower', t:.55, side:-1, name:'Middle tower', icon:'🗼'},
  {id:'t3', kind:'tower', t:.8, side:1, name:'Inner tower', icon:'🗼'},
  {id:'gate', kind:'gate', t:.97, side:0, name:'Gatehouse', icon:'🏰'}];
const DEF_MAX = 6;
const LV_NAME = {
  tower:['', 'wooden watchtower', 'stone tower', 'cannon tower', 'machine-gun post', 'missile tower', 'laser tower'],
  gate:['', 'timber gate', 'stone gatehouse', 'iron-bound gatehouse', 'concrete gatehouse', 'steel blast gate', 'shield gate'],
  bar:['', 'spiked logs', 'a trench', 'barbed wire', 'a minefield', 'tank traps', 'an energy fence']};
const siteLv = () => { const S = W.flags.sites ||= {}; if (W.flags.def) { const D = W.flags.def; S.gate = Math.max(S.gate || 0, D.ramparts || 0); for (const k of ['t1', 't2', 't3']) S[k] = Math.max(S[k] || 0, D.towers || 0); delete W.flags.def; } return S; };
const lvOf = id => siteLv()[id] || 0;
const towerLvs = () => ['t1', 't2', 't3'].reduce((a, k) => a + lvOf(k), 0);
// the gatehouse adds 5% a level to your defense, each tower 2%, the barricade 3%
const defenseMult = () => 1 + .05*lvOf('gate') + .02*towerLvs() + .03*lvOf('bar');
const siteCost = (S, lv) => Math.round(({gate:4000, tower:3000, bar:2500}[S.kind]) * Math.pow(2.3, lv) * (1 + .2*W.era));
const defLv = () => ({ramparts:lvOf('gate'), towers:Math.round(towerLvs()/3)});
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
  const b = a*(1 + (S.heat || 0));
  return n < 2 ? Math.min(b, defPower()*.8) : b;   // the first two waves are there to learn on
}
// who comes: a rival at war with you first, then whoever you have met; the Sky Citadel only after the Moon
function waveRival() {
  const ok = EMP.list.filter(r => { const s = es(r); return !s.owned && s.stance !== 'ally' && s.stance !== 'occupied' && !(r.sky && !W.unlocked.has('moonLanding')); });
  return ok.find(r => es(r).stance === 'war') || ok.filter(r => es(r).met).sort((a, b) => es(b).pow - es(a).pow)[0] || ok[0] || null;
}
function startWave() {
  const r = waveRival(), S = waveState(); if (!r) { S.t = 120; return; }
  const atk = waveStrength()*(.9 + R()*.2);
  S.n++; S.heat = (S.heat || 0)*.75;
  // they march down their road and up the road in; what reaches the gate is what attacks the walls
  startInvasion(r, {atk, n:Math.min(24, 10 + Math.floor(S.n/2)), wave:S.n});
  banner(`⚔️ Wave ${S.n}: ${r.icon} ${r.n} marches on you!`, `${waveTier(S.n)[0].toUpperCase() + waveTier(S.n).slice(1)} this time. ⚔️${Math.round(atk)} against your 🛡️${Math.round(defPower())}. They come up the road in: every one your towers and barricade stop is one fewer at the walls.`);
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
  const ord = W.flags.qOrder || [], open = openQuarters().filter(id => !lostQuarters()[id]);
  // the newest district first (out on the edge), then the outer ones
  const left = [...ord.filter(id => open.includes(id)).reverse(), ...open.filter(id => !ord.includes(id))];
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
// where a site stands on the road, and where its tile is (on the verge beside it)
function siteSpot(S) {
  const a = along(ROAD_IN, S.t), px = -a.dz, pz = a.dx, off = S.side ? S.side*3.6 : 0;
  const at = [a.x + px*off, a.z + pz*off];
  let tile = null;
  // towers stand on one verge, so their tile goes on the other; the gate and barricade span the road, so theirs sits well off it
  for (const d of S.side ? [3.4, 4.6, 5.8, 7] : [6.5, 7.8, 9]) for (const sd of S.side ? [-S.side, S.side] : [1, -1]) { const x = a.x + px*d*sd, z = a.z + pz*d*sd; if (!tile && freeSpot(x, z, 1.1) && !isWater(x, z)) tile = [x, z]; }
  return {at, tile:tile || [a.x + px*6, a.z + pz*6], yaw:Math.atan2(a.dx, a.dz)};
}
function buildSite(S) {
  const Q = QUARTER.sites[S.id] ||= {}; const lv = lvOf(S.id); if (Q.lv === lv) return; Q.lv = lv;
  if (Q.g) { scene.remove(Q.g); for (const b of Q.boxes || []) { const k = boxes.indexOf(b); if (k >= 0) boxes.splice(k, 1); } }
  const sp = Q.sp ||= siteSpot(S), [x, z] = sp.at, g = Q.g = new THREE.Group(); g.position.set(x, elevAt(x, z), z); g.rotation.y = sp.yaw; scene.add(g); Q.boxes = [];
  const box = (hx, hz) => { const b = {x0:x - hx, x1:x + hx, z0:z - hz, z1:z + hz}; boxes.push(b); Q.boxes.push(b); };
  if (lv && S.kind === 'tower') {
    const stone = lv >= 2, modern = lv >= 4, h = 3 + Math.min(lv, 4)*.6;
    if (!stone) { for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) mesh(G.box, 0x6b4526, [.16, h, .16], [a, h/2, b], g); mesh(G.box, 0x7a5232, [1.5, .18, 1.5], [0, h, 0], g); const rf = mesh(G.cone4, 0x8a3a2a, [1.3, .8, 1.3], [0, h + .5, 0], g); rf.rotation.y = Math.PI/4; }
    else if (!modern) { mesh(G.cyl, 0x9a9284, [.9, h, .9], [0, h/2, 0], g); for (let k = 0; k < 8; k++) { const a = k/8*Math.PI*2; mesh(G.box, 0x8f887a, [.3, .4, .3], [Math.cos(a)*.78, h + .2, Math.sin(a)*.78], g); } }
    else { mesh(G.box, 0x8a8e92, [1.7, h, 1.7], [0, h/2, 0], g); mesh(G.box, 0x1a1a1a, [1.72, .16, .5], [0, h - .7, 0], g); mesh(G.box, 0x5a6048, [1.9, .25, 1.9], [0, h + .12, 0], g); }
    const head = new THREE.Group(); head.position.y = h + .3; g.add(head);
    if (lv === 3) mesh(G.cyl, 0x2a2a2e, [.14, .9, .14], [0, .1, .3], head, {metalness:.6}).rotation.x = Math.PI/2;
    if (lv === 4) { mesh(G.box, 0x3a3e44, [.4, .3, .5], [0, 0, 0], head, {metalness:.5}); mesh(G.cyl, 0x1a1a1e, [.05, .8, .05], [0, .05, .5], head, {metalness:.7}).rotation.x = Math.PI/2; }
    if (lv === 5) for (const s of [-.2, .2]) mesh(G.cyl, 0xd8dce2, [.1, .9, .1], [s, .3, 0], head, {metalness:.5}).rotation.x = -.6;
    if (lv >= 6) mesh(G.cone, 0x9af4ff, [.35, 1, .35], [0, .4, 0], head, {emissive:0x3ab0e8, emissiveIntensity:1});
    Q.head = head; Q.h = h; box(.9, .9);
  }
  if (lv && S.kind === 'gate') {
    // two towers either side of the road and a gate across it, grander with each level
    const K = [null, [0x6b4526, 0x7a5232], [0x9a9284, 0x8f887a], [0x8a8478, 0x3a3e44], [0xa8acb0, 0x6a6e72], [0x6a6e72, 0x2a2e34], [0x8aa0c8, 0x9af4ff]][lv], h = 3.2 + lv*.35;
    for (const s of [-1, 1]) { mesh(lv === 1 ? G.box : G.cyl, K[0], [1.2, h, 1.2], [s*2.6, h/2, 0], g); mesh(G.box, K[1], [1.5, .4, 1.5], [s*2.6, h + .2, 0], g); }
    mesh(G.box, K[0], [6.4, .7, 1], [0, h - .5, 0], g);
    const door = mesh(G.box, K[1], [3.8, h - 1, .25], [0, (h - 1)/2, 0], g, lv >= 6 ? {emissive:0x3ab0e8, emissiveIntensity:.6, transparent:true, opacity:.6} : lv >= 3 ? {metalness:.5} : {}); Q.door = door;
    box(3.4, .9);
  }
  if (lv && S.kind === 'bar') {
    // cumulative: logs, then a trench, wire, mines, tank traps, a fence of light
    for (let k = -2; k <= 2; k++) { const l = mesh(G.cyl, 0x6b4526, [.12, 2.4, .12], [k*1.1, .5, 0], g); l.rotation.x = .9; }
    if (lv >= 2) mesh(G.box, 0x3a2a1a, [7, .05, 1.4], [0, .02, 2], g);
    if (lv >= 3) for (let k = 0; k < 3; k++) mesh(G.box, 0x2a2a2e, [7, .04, .04], [0, .4 + k*.25, -1.4], g, {metalness:.6});
    if (lv >= 4) for (let k = 0; k < 10; k++) mesh(G.cyl, 0x4a5238, [.18, .06, .18], [(k % 5 - 2)*1.3, .03, -3 - Math.floor(k/5)*1.2], g);
    if (lv >= 5) for (let k = -2; k <= 2; k++) for (const r of [.7, -.7]) { const b = mesh(G.box, 0x5a5e62, [.12, .12, 1.4], [k*1.4, .45, -5.2], g, {metalness:.6}); b.rotation.set(r, 0, r); }
    if (lv >= 6) for (let k = -3; k <= 3; k++) mesh(G.box, 0x9af4ff, [.08, 1.6, .08], [k*1.1, .8, 3.4], g, {emissive:0x3ab0e8, emissiveIntensity:1});
  }
  // the tile to build or level it up
  if (Q.zone) { removeZone(Q.zone); Q.zone = null; }
  if (lv < DEF_MAX) Q.zone = addZone({kind:'defSite', site:S.id, x:sp.tile[0], z:sp.tile[1], w:1.6, d:1.6, icon:S.icon, tile:siteTile(S)});
}
function siteTile(S) { const lv = lvOf(S.id), c = siteCost(S, lv), paid = (W.flags.sitePaid || {})[S.id] || 0; return {cost:c - paid, cur:'💵', prog:paid/c, title:lv ? 'Upgrade' : S.name}; }
function paySite(zn, e) {
  const S = DEFSITES.find(s => s.id === zn.site), lv = lvOf(S.id); if (lv >= DEF_MAX) return;
  const c = siteCost(S, lv), fp = (W.flags.sitePaid ||= {}), paid = fp[S.id] || 0;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(c - paid, W.coins, Math.max(1, Math.ceil(c/20))); spend(amt); fp[S.id] = paid + amt; e.tick = .05; snd(500 + paid/c*400, .03, 'square', .025);
  if (fp[S.id] >= c) {
    delete fp[S.id]; siteLv()[S.id] = lv + 1; buildSite(S); popIn(QUARTER.sites[S.id].g); shakeCam(.2);
    banner(`${S.icon} ${S.name}: ${LV_NAME[S.kind][lv + 1]}!`, S.kind === 'tower' ? 'It shoots at every army on the road in, and at the walls.' : S.kind === 'gate' ? 'A stronger gate: more of your defense holds at the walls.' : lv + 1 >= 4 ? 'Armies crossing it are slowed, and the mines take some of them.' : 'Armies crossing it are slowed under your towers.');
    save(); return;
  }
  drawTile(zn.tc.g, S.icon, siteTile(S)); zn.tc.t.needsUpdate = true;
}
// ------------------------------------------------------------------ armies on the road: towers shoot, the barricade slows and mines
const SHOT_MAT = {};
function invKill(e) {
  const k = INV.units.indexOf(e); if (k < 0) return;
  for (let i = 0; i < 6; i++) particle(0x8a6a42, e.pos.clone().setY(.3), new THREE.Vector3((R() - .5)*2, 1.4, (R() - .5)*2), .6, .15, {grow:.4, op:.6});
  scene.remove(e.char.g); stacks.delete(e.stack); if (e.bar) scene.remove(e.bar); const q = ENTS.indexOf(e); if (q >= 0) ENTS.splice(q, 1); INV.units.splice(k, 1);
}
function towerFire(dt) {
  const marching = INV.on ? INV.units : [], foes = W.raid && W.raid.siege ? SIEGE.foes.filter(f => f.alive) : [];
  if (!marching.length && !foes.length) return;
  for (const S of DEFSITES) {
    if (S.kind !== 'tower') continue; const lv = lvOf(S.id), Q = QUARTER.sites[S.id]; if (!lv || !Q || !Q.head) continue;
    if ((Q.cd = (Q.cd ?? R()) - dt) > 0) continue;
    const [x, z] = Q.sp.at; let f = null, bd = 20;
    for (const q of [...marching, ...(INV.on ? (INV.big || []).filter(u => u.kind !== 'jet' || lv >= 4) : []), ...foes]) { const d = Math.hypot(q.pos.x - x, q.pos.z - z); if (d < bd) { bd = d; f = q; } }
    if (!f) { Q.cd = .5; continue; }
    Q.cd = [0, 1.6, 1.3, 1.5, .2, 1.2, .6][lv] * (.8 + R()*.4);
    Q.head.rotation.y = Math.atan2(f.pos.x - x, f.pos.z - z) - Q.g.rotation.y;
    const col = lv >= 6 ? 0x8af0ff : lv === 5 ? 0xf4f4f4 : lv === 4 ? 0xffe27a : lv === 3 ? 0x2a2a2e : 0x8a6a42;
    const m = SHOT_MAT[col] ||= new THREE.MeshBasicMaterial({color:col, toneMapped:false});
    const from = new THREE.Vector3(x, Q.g.position.y + Q.h + .4, z), to = f.pos.clone().setY(f.B ? Math.max(1, f.pos.y + 1) : .9), b = new THREE.Mesh(G.sph, m); b.scale.setScalar(lv === 3 || lv === 5 ? .14 : .07); b.position.copy(from); scene.add(b);
    const dmg = [0, 1.2, 1.6, 3, .8, 4, 4][lv], blast = lv === 3 || lv === 5 ? 1.8 : .8;
    flyers.push({m:b, from, to, t:0, dur:lv === 4 || lv === 6 ? .18 : .45, arc:lv <= 2 ? .5 : lv === 5 ? .3 : 0, done:() => {
      if (blast > 1) for (let k = 0; k < 8; k++) particle([0xffd040, 0x555555][k % 2], to.clone(), new THREE.Vector3((R() - .5)*4, 2 + R()*2, (R() - .5)*4), .7, .22, {grow:.5, op:.8});
      for (const q of [...INV.units]) if (Math.hypot(q.pos.x - to.x, q.pos.z - to.z) < blast) { q.hp = (q.hp ?? 3) - dmg; if (q.hp <= 0) invKill(q); }
      for (const u of [...(INV.big || [])]) if (Math.hypot(u.pos.x - to.x, u.pos.z - to.z) < blast + 1.2 && Math.abs(u.pos.y - to.y) < 4) { u.hp -= dmg; if (u.hp <= 0) bigKill(u); }
      for (const q of SIEGE.foes) if (q.alive && Math.hypot(q.pos.x - to.x, q.pos.z - to.z) < blast) { q.hp -= dmg; q.hit = .12; if (q.hp <= 0) knockOut(q); }
    }});
    if (Math.hypot(x - player.pos.x, z - player.pos.z) < 30 || watchingWar()) snd(lv === 4 ? 170 : lv === 3 || lv === 5 ? 70 : 600, lv === 4 ? .03 : .12, lv === 3 || lv === 5 ? 'sawtooth' : 'square', .03);
  }
}
// how fast an army marches over the barricade, and the mines it sets off (once per soldier)
function barricadeAt(e) {
  const lv = lvOf('bar'); if (!lv) return 1;
  const Q = QUARTER.sites.bar; if (!Q || !Q.sp) return 1;
  const [x, z] = Q.sp.at; if (Math.hypot(e.pos.x - x, e.pos.z - z) > 7) return 1;
  if (lv >= 4 && !e.mined) { e.mined = true; if (R() < [0, 0, 0, 0, .12, .18, .25][lv]) { for (let k = 0; k < 12; k++) particle([0xffd040, 0xff7a2a, 0x555555][k % 3], e.pos.clone().setY(.3), new THREE.Vector3((R() - .5)*5, 2 + R()*3, (R() - .5)*5), .8, .28, {grow:.6, op:.85}); snd(60, .4, 'sawtooth', .05, .3); if (e.B) { e.hp -= 12; if (e.hp <= 0) bigKill(e); return 1; } invKill(e); return 0; } }
  return 1 - .09*lv;
}
// ------------------------------------------------------------------ a growing town draws bigger armies
function growthHeat() {
  const S = waveState(), n = openQuarters().length;
  // (the districts you already have fall outermost first: the farm, then the military grounds, and so on)
  if (S.qn == null) { S.qn = n; S.era = W.era; W.flags.qOrder ||= QUARTER_ORDER.filter(id => openQuarters().includes(id)).reverse(); return; }
  const grew = (n > S.qn ? n - S.qn : 0) + (W.era > S.era ? W.era - S.era : 0);
  if (grew) { S.heat = Math.min(1, (S.heat || 0) + .2*grew); note('👀 Your growth draws attention', `A bigger, richer town is a prize: the next waves come ${Math.round(S.heat*100)}% stronger. The newest district, out on the edge, is the first they burn.`); }
  if (n > S.qn) { const ord = W.flags.qOrder ||= []; for (const id of openQuarters()) if (!ord.includes(id)) ord.push(id); }
  S.qn = n; S.era = W.era;
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
  const t = W.raid && W.raid.siege ? '⚔️ at the walls!' : INV.on ? `⚔️ ${INV.units.length} on the road!` : `⚔️ Wave ${S.n + 1} in ${Math.floor(S.t/60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}`;
  b.textContent = `${t} · 🛡️ ${Math.round(defPower())}${lost ? ` · 🔥 ${lost} lost` : ''}`;
}
function openDefense() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'defense';
  const S = waveState(), fmt = n => Math.round(n).toLocaleString(), next = waveStrength(), def = defPower();
  const rows = DEFSITES.map(D => { const lv = lvOf(D.id); return `<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #0001;text-align:left"><span>${D.icon} <b>${D.name}</b></span><span>${lv ? LV_NAME[D.kind][lv] : '<i>not built</i>'} · ${lv}/${DEF_MAX}</span></div>`; }).join('');
  const quarters = openQuarters().map(id => `${lostQuarters()[id] ? '🔥' : '🏠'} ${QUARTER_NAME[id]}`).join(' · ');
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">🏰 Castle defense</h1>
    <p>Wave ${S.n + 1} comes in ${Math.floor(S.t/60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}, about <b>⚔️${fmt(next)}</b> strong, bringing ${waveTier(S.n + 1)}${S.heat > .01 ? ` (${Math.round(S.heat*100)}% more: your growth draws them)` : ''}. Your defense: <b style="color:${def >= next ? '#2f9e44' : '#b83a2a'}">🛡️${fmt(def)}</b>.</p>
    <p class="keys">Held ${S.held} · lost ${S.lost}. Every rival comes down its own road to the junction, then up the one road in to your gate. Build and level up the defenses on that road (walk onto their tiles).</p>
    <div style="max-height:34vh;overflow:auto">${rows}</div>
    <p style="text-align:left"><b>Districts</b>: ${quarters || 'none yet'}. A lost wave burns one, the newest first; lose them all and the keep falls.</p>
    <button id="dfGo">🧭 Take me to the road in</button> <button class="ghost" id="dfClose">Close</button></div>`;
  $('dfGo').onclick = () => { m.hidden = true; const [x, z] = ROAD_IN[1]; player.pos.set(x + 4, 0, z); prevPos.copy(player.pos); };
  $('dfClose').onclick = () => { m.hidden = true; };
}
function updWaves(dt) {
  if (!started) return;
  if (W.flags.fallen) { if (!QUARTER.fallShown) { QUARTER.fallShown = true; showFallen(); } return; }
  // after a load: districts that were lost go dark again
  if (!QUARTER.restored && EMP.loaded) { QUARTER.restored = true; for (const id of Object.keys(lostQuarters())) quarterDown(id, true); }
  waveHud();
  if (!W.castle) return;
  if (EMP.loaded) { buildRoads(); for (const S of DEFSITES) buildSite(S); }
  towerFire(dt);
  if ((QUARTER.chk -= dt) <= 0) { QUARTER.chk = 2; growthHeat(); }
  const S = waveState();
  if (!W.flags.waveTold) { W.flags.waveTold = 1; note('🏰 The waves are coming', 'Now you have a castle, enemy armies march on you every few minutes, each bigger than the last, all up the one road in from the south-east. Build towers, a barricade and a gatehouse on that road. Tap the red ⚔️ wave clock to see the next one.'); }
  if (W.raid || W.camp || INV.on || BOSS.on) return;
  const t0 = S.t; S.t -= dt;
  if (t0 > 30 && S.t <= 30) banner(`⚔️ Wave ${S.n + 1} in 30 seconds`, `About ⚔️${Math.round(waveStrength())} strong, against your 🛡️${Math.round(defPower())}.`);
  if (S.t <= 0) startWave();
}
// ------------------------------------------------------------------ what each wave brings: soldiers, then bigger soldiers, elephants, dragons, tanks, jets, a kaiju
// Each heavy unit counts as several soldiers (w); kill it on the road and that much less reaches your walls.
const BIG = {
  elephant:{w:4, hp:18, sp:5, y:0, from:5, every:2, cap:4, make:() => beast('elephant', 2.7)},
  dragon:{w:6, hp:26, sp:8, y:8, fly:true, from:8, every:2, cap:3, make:() => dragonModel(.55)},
  tank:{w:6, hp:32, sp:5, y:0, from:11, every:2, cap:4, make:() => model('tank', 2.4, 'z')},
  jet:{w:5, hp:14, sp:15, y:12, fly:true, from:14, every:2, cap:4, make:() => model('fighter', 4.2, 'x')},
  kaiju:{w:24, hp:140, sp:2.6, y:0, from:20, boss:true, make:() => kaijuModel()}};
const waveTier = n => n >= 20 ? 'kaiju' : n >= 14 ? 'jets' : n >= 11 ? 'tanks' : n >= 8 ? 'dragons' : n >= 5 ? 'elephants' : n >= 3 ? 'heavy soldiers' : 'soldiers';
function spawnBig(n) {
  INV.big = []; INV.bigW = 0;
  // from wave 3 their soldiers are bigger and tougher
  if (n >= 3) for (const e of INV.units) { e.char.g.scale.setScalar(1.25); e.hp *= 1.8; e.heavy = true; }
  for (const [kind, B] of Object.entries(BIG)) {
    if (n < B.from) continue;
    const count = B.boss ? (n % 5 === 0 ? 1 : 0) : Math.min(B.cap, 1 + Math.floor((n - B.from)/B.every));
    for (let i = 0; i < count; i++) {
      const m = B.make(); if (!m) break;
      const g = new THREE.Group(); g.add(m); g.traverse(o => { if (o.isMesh) o.userData.noBake = true; }); scene.add(g);
      const [x, z] = INV.pts[0]; g.position.set(x + (i - count/2)*3, B.y, z - 4 - i*2);
      // in a column of their own, two abreast, so they do not walk inside each other
      const k = INV.big.length; INV.big.push({kind, B, g, pos:g.position, hp:B.hp*(1 + .04*n), pi:0, ph:R()*6, ox:(k % 2 ? 1.8 : -1.8), oz:Math.floor(k/2)*3.4 + 4}); INV.bigW += B.w;
    }
  }
}
function bigKill(u) {
  const k = INV.big.indexOf(u); if (k < 0) return;
  for (let i = 0; i < 24; i++) particle([0xffd040, 0xff7a2a, 0x444444][i % 3], u.pos.clone().setY(Math.max(.5, u.pos.y)), new THREE.Vector3((R() - .5)*8, 2 + R()*5, (R() - .5)*8), 1.1, .45, {grow:.8, op:.85});
  snd(55, .6, 'sawtooth', .07, .4); shakeCam(.25);
  scene.remove(u.g); INV.big.splice(k, 1);
}
function clearBig() { for (const u of INV.big || []) scene.remove(u.g); INV.big = []; }
// they come up the same road; the fliers high over it, jets fast
function updBig(dt) {
  let arrived = 0;
  for (const u of INV.big || []) {
    const B = u.B;
    if (u.pi < INV.pts.length) {
      const last = u.pi === INV.pts.length - 1, x = INV.pts[u.pi][0] + (last ? 0 : u.ox), z = INV.pts[u.pi][1] + (last ? 0 : u.oz), dx = x - u.pos.x, dz = z - u.pos.z, d = Math.hypot(dx, dz), sp = B.sp*(B.fly ? 1 : barricadeAt(u) || 1);
      if (d < 1.5) u.pi++; else { const v = Math.min(sp*dt, d); u.pos.x += dx/d*v; u.pos.z += dz/d*v; u.g.rotation.y = Math.atan2(dx, dz); }
    } else arrived++;
    u.ph += dt;
    if (u.kind === 'dragon') { flapDragon(u.g.children[0], time, 6); u.pos.y = B.y + Math.sin(u.ph*1.4)*.6; }
    else if (u.kind === 'jet') u.g.rotation.z = Math.sin(u.ph*.8)*.15;
    else { u.pos.y = elevAt(u.pos.x, u.pos.z) + (u.kind === 'kaiju' ? Math.abs(Math.sin(u.ph*2))*.2 : 0); const L = u.g.children[0].userData.legs; if (L) L.forEach((l, i) => { l.rotation.x = Math.sin(u.ph*6 + i*1.6)*.4; }); }
  }
  return arrived;
}
