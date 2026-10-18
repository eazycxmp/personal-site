// ------------------------------------------------------------------ city defences: walls, gates, towers and a headquarters you must break
// Every rival with a battlefield before its city rings that city with a wall: a timber palisade at first, then stone
// walls with towers, then concrete walls and bunkers as they grow. Gates stand where the roads pass and where your army
// comes from, and their headquarters stands just inside the main gate. Win the field battle and the assault follows:
// your engines batter the gate while their towers shoot back, the gate and towers fall, your troops storm in and bring
// down the headquarters. A conquered city's walls come down, and much of its army joins yours.
const DEF = {};
const defTier = r => { const p = es(r).pow; return p < 45 ? 0 : p < 100 ? 1 : 2; };
const defended = r => !!r.bf && r.id !== 'ostberg' && !!CITY_LAND[r.id] && !es(r).owned && !(r.sky && !W.unlocked.has('moonLanding'));
// the gates: the main one facing your battlefield, and one wherever a road runs through the wall
function gatesOf(r) {
  const L = CITY_LAND[r.id], R0 = {x0:L.x0 - 1, x1:L.x1 + 1, z0:L.z0 - 1, z1:L.z1 + 1}, [bx, bz] = r.bf;
  const cx = clamp(bx, R0.x0 + 3, R0.x1 - 3), cz = clamp(bz, R0.z0 + 3, R0.z1 - 3);
  const ds = {w:Math.abs(bx - R0.x0), e:Math.abs(bx - R0.x1), n:Math.abs(bz - R0.z0), s:Math.abs(bz - R0.z1)};
  const side = Object.entries(ds).sort((a, b) => a[1] - b[1])[0][0];
  const gates = [];
  for (const rd of WORLD.roads || []) {
    const rz = (rd.z0 + rd.z1)/2;
    if (rz > R0.z0 && rz < R0.z1 && rd.x0 < R0.x1 && rd.x1 > R0.x0) for (const [sd, x] of [['w', R0.x0], ['e', R0.x1]]) if (x > rd.x0 && x < rd.x1) gates.push({side:sd, x, z:rz});
  }
  // the main gate: where the road comes in on the side facing your army, or a gate of its own on that side
  let main = gates.find(q => q.side === side);
  if (main) main.main = true;
  else gates.unshift(main = {side, x:side === 'w' ? R0.x0 : side === 'e' ? R0.x1 : cx, z:side === 'n' ? R0.z0 : side === 's' ? R0.z1 : cz, main:true});
  return {R0, gates, main};
}
// the inward direction from a gate (toward the middle of the city)
const inward = g => g.side === 'w' ? [1, 0] : g.side === 'e' ? [-1, 0] : g.side === 'n' ? [0, 1] : [0, -1];
const LOOK = [
  {wall:0x7a5232, top:0x5e3f22, h:1.9, th:.4, tower:0x6b4526, roof:0x8a3a2a, gate:0x5e3f22},
  {wall:0xa8a090, top:0x8f887a, h:2.8, th:.8, tower:0x9a9284, roof:0x5a5f66, gate:0x4a3a2a},
  {wall:0xb8bcc0, top:0x8a8e92, h:2.6, th:.55, tower:0x8a8e92, roof:0x5a6048, gate:0x3a3e44}];
function buildDefences(r) {
  const old = DEF[r.id]; if (old) scene.remove(old.g);
  const tier = defTier(r), K = LOOK[tier], {R0, gates, main} = gatesOf(r), g = new THREE.Group(); scene.add(g);
  const D = DEF[r.id] = {g, tier, gates, main, towers:[], gate:null, hq:null, boxes:[], broken:false};
  // wall runs along each side, with gaps of 3.4 at the gates
  const sides = {n:[[R0.x0, R0.z0], [R0.x1, R0.z0]], s:[[R0.x0, R0.z1], [R0.x1, R0.z1]], w:[[R0.x0, R0.z0], [R0.x0, R0.z1]], e:[[R0.x1, R0.z0], [R0.x1, R0.z1]]};
  const stakes = [];
  for (const [sd, [[ax, az], [bx, bz]]] of Object.entries(sides)) {
    const alongX = az === bz, a0 = alongX ? ax : az, a1 = alongX ? bx : bz;
    const cuts = gates.filter(q => q.side === sd).map(q => alongX ? q.x : q.z).sort((p, q) => p - q);
    let s0 = a0;
    for (const c of [...cuts, null]) {
      const s1 = c == null ? a1 : c - 1.7; if (s1 - s0 > .3) {
        const len = s1 - s0, mid = (s0 + s1)/2, x = alongX ? mid : ax, z = alongX ? az : mid;
        mesh(G.box, K.wall, alongX ? [len, K.h, K.th] : [K.th, K.h, len], [x, K.h/2, z], g);
        if (tier === 1) for (let t = s0 + .4; t < s1; t += 1.1) mesh(G.box, K.top, alongX ? [.5, .4, K.th + .05] : [K.th + .05, .4, .5], [alongX ? t : ax, K.h + .2, alongX ? az : t], g);
        if (tier === 0) for (let t = s0 + .2; t < s1; t += .45) stakes.push(alongX ? [t, az] : [ax, t]);
        if (tier === 2) mesh(G.box, 0x6a6e72, alongX ? [len, .08, .08] : [.08, .08, len], [x, K.h + .25, z], g, {metalness:.6});
        const b = alongX ? {x0:s0, x1:s1, z0:az - K.th/2 - .1, z1:az + K.th/2 + .1} : {x0:ax - K.th/2 - .1, x1:ax + K.th/2 + .1, z0:s0, z1:s1};
        boxes.push(b); D.boxes.push(b);
      }
      if (c != null) s0 = c + 1.7;
    }
  }
  // a palisade's pointed stakes, all in one mesh
  if (stakes.length) {
    const cone = new THREE.InstancedMesh(G.cone, mat(K.top), stakes.length), m4 = new THREE.Matrix4();
    stakes.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, K.h + .25, z), new THREE.Quaternion(), new THREE.Vector3(.22, .5, .22)); cone.setMatrixAt(i, m4); });
    g.add(cone);
  }
  // towers at the corners and either side of every gate
  const tower = (x, z) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
    if (tier === 0) { for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) mesh(G.box, K.tower, [.14, 3.4, .14], [a, 1.7, b], t); mesh(G.box, K.tower, [1.4, .15, 1.4], [0, 3.2, 0], t); const rf = mesh(G.cone4, K.roof, [1.3, .8, 1.3], [0, 3.75, 0], t); rf.rotation.y = Math.PI/4; }
    else if (tier === 1) { mesh(G.cyl, K.tower, [1, 4.2, 1], [0, 2.1, 0], t); for (let k = 0; k < 8; k++) { const a = k/8*Math.PI*2; mesh(G.box, K.top, [.32, .4, .32], [Math.cos(a)*.85, 4.4, Math.sin(a)*.85], t); } mesh(G.cone, K.roof, [1.1, 1.2, 1.1], [0, 5.1, 0], t); }
    else { mesh(G.box, K.tower, [1.8, 3.2, 1.8], [0, 1.6, 0], t); mesh(G.box, 0x1a1a1a, [1.82, .18, .5], [0, 2.6, 0], t); mesh(G.box, K.roof, [2, .3, 2], [0, 3.35, 0], t); }
    D.towers.push(t); return t;
  };
  for (const [x, z] of [[R0.x0, R0.z0], [R0.x1, R0.z0], [R0.x0, R0.z1], [R0.x1, R0.z1]]) tower(x, z);
  for (const q of gates) { const along = q.side === 'n' || q.side === 's'; for (const s of [-1, 1]) tower(q.x + (along ? s*2.5 : 0), q.z + (along ? 0 : s*2.5)); }
  // the main gate itself, shut; the others stand open on their roads
  {
    const q = main, along = q.side === 'n' || q.side === 's', gt = new THREE.Group(); gt.position.set(q.x, 0, q.z); gt.rotation.y = along ? 0 : Math.PI/2; g.add(gt);
    const door = new THREE.Group(); gt.add(door);
    mesh(G.box, K.gate, [3.3, K.h + .3, .3], [0, (K.h + .3)/2, 0], door);
    if (tier === 1) for (let k = -1; k <= 1; k++) mesh(G.box, 0x2a2a2e, [.08, K.h + .3, .34], [k*.9, (K.h + .3)/2, 0], door, {metalness:.6});
    if (tier !== 2) mesh(G.box, K.top, [4.2, .5, .9], [0, K.h + .6, 0], gt);
    D.gate = {g:door, x:q.x, z:q.z};
    const b = along ? {x0:q.x - 1.7, x1:q.x + 1.7, z0:q.z - .4, z1:q.z + .4} : {x0:q.x - .4, x1:q.x + .4, z0:q.z - 1.7, z1:q.z + 1.7};
    boxes.push(b); D.boxes.push(b); D.gateBox = b;
  }
  // their headquarters, just inside the main gate
  {
    const [ix, iz] = inward(main), hx = main.x + ix*6, hz = main.z + iz*6, h = new THREE.Group(); h.position.set(hx, 0, hz); h.rotation.y = Math.atan2(-ix, -iz); g.add(h);
    if (tier === 0) { mesh(G.box, 0x8a5a2b, [3.6, 1.8, 2.4], [0, .9, 0], h); const rf = mesh(G.cone4, 0x6a3a22, [3, 1.4, 2.2], [0, 2.4, 0], h); rf.rotation.y = Math.PI/4; rf.scale.set(2.8, 1.4, 1.9); }
    else if (tier === 1) { mesh(G.box, 0x9a9284, [3.2, 4.2, 3.2], [0, 2.1, 0], h); for (let k = 0; k < 12; k++) { const sx = k % 4 - 1.5, sd = k < 4 ? -1 : k < 8 ? 1 : 0; mesh(G.box, 0x8f887a, [.45, .5, .45], [sd ? sx*.9 : (k < 10 ? -1.45 : 1.45), 4.45, sd ? sd*1.45 : (k % 2 ? -.6 : .6)], h); } mesh(G.box, 0x2a1d12, [1, 1.6, .1], [0, .8, 1.62], h); }
    else { mesh(G.box, 0x8a8e92, [4.4, 3.4, 3], [0, 1.7, 0], h); for (let k = 0; k < 6; k++) mesh(G.box, WIN, [.5, .5, .05], [-1.6 + k*.64, 2.3, 1.52], h); mesh(G.cyl, 0x6a6e72, [.05, 2.4, .05], [1.4, 4.6, 0], h, {metalness:.6}); mesh(G.sph, 0xd8dce2, [.6, .3, .6], [-1.2, 3.6, 0], h); }
    const pole = mesh(G.cyl, 0x5e3f22, [.05, 2, .05], [0, tier === 1 ? 5.6 : 4.2, 0], h); h.flagAt = pole.position.clone();
    D.hq = {g:h, x:hx, z:hz};
  }
  D.pow = es(r).pow;
}
function removeDefences(r) { const D = DEF[r.id]; if (!D) return; scene.remove(D.g); for (const b of D.boxes) { const k = boxes.indexOf(b); if (k >= 0) boxes.splice(k, 1); } delete DEF[r.id]; }
// keep each rival's walls in step with its strength (and gone once it is yours)
function updDefences(dt) {
  if ((DEF.chk = (DEF.chk || 0) - dt) > 0) return; DEF.chk = 2;
  for (const r of EMP.list) {
    const D = DEF[r.id], want = defended(r);
    if (!want) { if (D && !(W.camp && W.camp.assault && W.camp.rival === EMP.list.indexOf(r))) removeDefences(r); continue; }
    if (!D || (D.tier !== defTier(r) && !(W.camp && W.camp.rival === EMP.list.indexOf(r)))) buildDefences(r);
  }
}
// ------------------------------------------------------------------ the assault
// the field battle is won: before the city is yours, storm its gate and bring down its headquarters
function startAssault(C) {
  if (C.type !== 'land' || !C.win || C.assault || C.rival == null) return false;
  const r = EMP.list[C.rival], D = DEF[r.id]; if (!D || es(r).owned) return false;
  C.assault = true; C.t = 26; D.gateHp = 1;
  banner('🏰 Storm the walls!', `Break the gate of ${r.n}, then bring down their headquarters.`);
  snd(110, .8, 'sawtooth', .05, .1);
  return true;
}
// where a unit of yours should be: massing before the gate, then pouring through to the headquarters
function assaultSpot(D, i, ph) {
  const G0 = D.main, [ix, iz] = inward(G0), px = -iz, pz = ix, row = Math.floor(i / 6), col = (i % 6) - 2.5;
  if (ph > 16) return [G0.x - ix*(4 + row*1.2) + px*col*1.1, G0.z - iz*(4 + row*1.2) + pz*col*1.1];
  if (ph > 13) return [G0.x + ix*1 + px*col*.4, G0.z + iz*1 + pz*col*.4];
  const a = i*2.4; return [D.hq.x + Math.cos(a)*(3 + row*.6), D.hq.z + Math.sin(a)*(3 + row*.6)];
}
function assaultSoldier(s, i, dt) {
  const C = W.camp, D = C && C.assault && DEF[EMP.list[C.rival].id]; if (!D || C.t <= 8.5) return false;
  const [tx, tz] = assaultSpot(D, i, C.t);
  s.speed = 6; if (moveTo(s, tx, tz, dt)) { const t = C.t > 13 ? [D.main.x, D.main.z] : [D.hq.x, D.hq.z]; s.yaw = Math.atan2(t[0] - s.pos.x, t[1] - s.pos.z); s.char.armR.rotation.x = -1.6 + Math.sin(time*12 + i)*1.1; }
  animEntity(s, dt); s.char.g.rotation.y = s.yaw; s.char.g.visible = true;
  return true;
}
function updAssault(dt) {
  const C = W.camp; if (!C || !C.assault) return;
  const r = EMP.list[C.rival], D = DEF[r.id]; if (!D) return;
  const ph = C.t, G0 = D.main, [ix, iz] = inward(G0);
  // their towers shoot at your army while the gate holds
  if (ph > 16 && (D.shotT = (D.shotT || 0) - dt) <= 0) {
    D.shotT = .35; const live = D.towers.filter(t => !t.fall), t = live[R()*live.length|0];
    if (t) { const from = t.position.clone().setY(3.8), to = new THREE.Vector3(G0.x - ix*5 + (R() - .5)*6, .2, G0.z - iz*5 + (R() - .5)*6);
      const m = new THREE.Mesh(G.cyl, mat(D.tier === 2 ? 0xffe08a : 0x3a2a1a)); m.scale.set(.03, D.tier === 2 ? .2 : .5, .03); m.position.copy(from); scene.add(m);
      flyers.push({m, from, to, t:0, dur:D.tier === 2 ? .25 : .8, arc:D.tier === 2 ? .1 : 1.6, done:() => particle(0xc8b48a, to, new THREE.Vector3(0, .6, 0), .4, .15, {grow:.6, op:.6})}); }
  }
  // your engines pound the gate and the towers by it
  if (ph > 15.5 && (D.batT = (D.batT || 0) - dt) <= 0) {
    D.batT = .7; const to = new THREE.Vector3(G0.x + (R() - .5)*4, 1 + R()*1.5, G0.z + (R() - .5)*.6);
    for (let k = 0; k < 8; k++) particle(k % 2 ? 0x8a7a6a : 0xff9a3a, to, new THREE.Vector3((R() - .5)*4, 1 + R()*3, (R() - .5)*4), .7, .22, {grav:1});
    snd(70 + R()*30, .3, 'sawtooth', .05, .4); if (watchingWar()) shakeCam(.12);
    if (D.gate.g) D.gate.g.rotation.x = Math.sin(time*30)*.02;
  }
  // the towers by the gate fall, then the gate
  const near = D.towers.filter(t => Math.hypot(t.position.x - G0.x, t.position.z - G0.z) < 4);
  if (ph < 19 && near[0] && !near[0].fall) near[0].fall = 1e-3;
  if (ph < 17 && near[1] && !near[1].fall) near[1].fall = 1e-3;
  if (ph < 16 && !D.broken) {
    D.broken = true; medal('assault'); const gg = D.gate.g; gg.rotation.x = -Math.PI/2*.95; gg.position.set(0, .2, ix*1.2 + iz*1.2);
    const k = boxes.indexOf(D.gateBox); if (k >= 0) boxes.splice(k, 1);
    for (let j = 0; j < 24; j++) particle(j % 3 ? 0x7a6a5a : 0xb8a888, new THREE.Vector3(G0.x, 1, G0.z), new THREE.Vector3((R() - .5)*6, 2 + R()*4, (R() - .5)*6), 1.2, .3, {grav:1});
    slowmo(1.4); popText('💥 The gate is down!', new THREE.Vector3(G0.x, 4, G0.z), '#ffe06b'); snd(55, .9, 'sawtooth', .07, .5); if (watchingWar()) shakeCam(.4);
  }
  for (const t of D.towers) if (t.fall) { t.fall = Math.min(1, t.fall + dt*.8); t.rotation.z = t.fall*.9; t.position.y = -t.fall*1.6; if (t.fall < 1 && R() < dt*10) particle(0x9a9a9a, t.position.clone().setY(2), new THREE.Vector3((R() - .5)*2, 2, (R() - .5)*2), 1, .4, {grow:.8, op:.6}); }
  // inside: the headquarters takes the pounding, burns and comes down
  if (ph < 13 && ph > 9.5 && (D.hqT = (D.hqT || 0) - dt) <= 0) { D.hqT = .3; const p = new THREE.Vector3(D.hq.x + (R() - .5)*3, 1 + R()*2.5, D.hq.z + (R() - .5)*3); particle(R() < .5 ? 0xff7a2a : 0x555555, p, new THREE.Vector3(0, 2.2, 0), 1.2, .45, {grow:.8, op:.75}); }
  if (ph < 9.5 && !D.hqDown) {
    D.hqDown = true; slowmo(1.8); popText(`🏴 ${r.n} has fallen!`, new THREE.Vector3(D.hq.x, 5, D.hq.z), '#ffe06b'); snd(50, 1.2, 'sawtooth', .07, .6); if (watchingWar()) shakeCam(.5);
    for (let j = 0; j < 30; j++) particle(j % 3 ? 0x6a5a4a : 0xff8a3a, new THREE.Vector3(D.hq.x, 2, D.hq.z), new THREE.Vector3((R() - .5)*7, 2 + R()*5, (R() - .5)*7), 1.4, .35, {grav:1});
  }
  if (D.hqDown) { const h = D.hq.g; h.scale.y += (.35 - h.scale.y)*Math.min(1, dt*2); h.rotation.z += (.12 - h.rotation.z)*Math.min(1, dt*2); }
}
// when a city falls, much of its army joins yours
function armyJoins(r) {
  const n = clamp(Math.round(es(r).pow/10), 3, 10);
  W.army += n; for (let k = 0; k < n; k++) makeSoldier(4 + (k % 4)*.8, 58 + Math.floor(k / 4)*.8);
  return n;
}
