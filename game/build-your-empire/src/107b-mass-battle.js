// ------------------------------------------------------------------ the mass battle: hundreds a side behind the duelling front
// The duels up front are fought by real soldiers. Behind them each side's main body (your regiments, their host) stands
// in ranks: they close in when the fighting starts, the front ranks lunge and fire, men fall as the battle turns, and
// at the end the beaten side breaks and runs. Drawn as instanced figures (the regiment field's), so hundreds cost little.
const MASS = {id:-1, ims:null, foe:null, us:[], them:[], cap:312, fireT:0, look:-1};
const MASS_O = new THREE.Object3D();
function massBuild() {
  // the same figures as the regiment field: ours share its uniform, theirs get their own colours
  const mk = (src, col) => { const m = src.material.clone(); if (col !== undefined) m.color.set(col); const im = new THREE.InstancedMesh(src.geometry, m, MASS.cap); im.count = 0; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; };
  MASS.ims = REGT.ims.map(im => mk(im));
  MASS.foe = REGT.ims.map(im => mk(im));
}
// a side's ranks. The camera looks on from the south-east, so the two main bodies face each other across the screen
// (ours to the right, theirs to the left) and never stand between the camera and the duels in the middle.
const MASS_W = 24, MASS_AX = [Math.SQRT1_2, -Math.SQRT1_2], MASS_LAT = [Math.SQRT1_2, Math.SQRT1_2];
// a side's ranks: front centre (ox, oz), facing (fx, fz), rows going back, keep(x, z) saying where they may stand
function massRanks(n, ox, oz, fx, fz, keep, st = {}) {
  const lx = -fz, lz = fx, gap = st.gap || .72, rg = st.rowGap || .8, jit = st.jitter || 0, Wd = Math.max(8, Math.round(MASS_W*.72/gap));
  return [...Array(n)].map((_, k) => { const row = Math.floor(k / Wd), c = (k % Wd) - (Wd - 1)/2 + (row % 2)*.35, jx = jit ? (R() - .5)*jit : 0, jz = jit ? (R() - .5)*jit : 0, x = ox + lx*c*gap - fx*row*rg + jx, z = oz + lz*c*gap - fz*row*rg + jz;
    // a soldier whose place in the ranks falls inside a wall, a house or the sea (or the wrong side of the wall) is left out
    const out = !keep(x, z) || isWater(x, z) || boxes.some(b => x > b.x0 - .3 && x < b.x1 + .3 && z > b.z0 - .3 && z < b.z1 + .3) || boxes.some(b => { const ax = x + fx*3.4, az = z + fz*3.4; return ax > b.x0 && ax < b.x1 && az > b.z0 && az < b.z1; });
    return {x, z, hx:x, hz:z, fx, fz, down:out ? 99 : -1, ph:R()*6, run:0}; });
}
function massSide(n, dir, st) {
  // in the open: dir 1 ours, on the right facing left; -1 theirs, on the left facing right
  const fx = -dir*MASS_AX[0], fz = -dir*MASS_AX[1];
  return massRanks(n, BF.x + 1.5 + dir*MASS_AX[0]*8.5, BF.z + 1.2 + dir*MASS_AX[1]*8.5, fx, fz, () => true, st);
}
// at a walled city: your army forms up outside the wall facing its gate, theirs holds the streets just inside it
function massSiege(C, ours, theirs, st) {
  const r = C.rival != null ? EMP.list[C.rival] : null; if (!r || !DEF[r.id] || !CITY_LAND[r.id] || !r.bf) return null;
  const G0 = gatesOf(r), R0 = G0.R0, [bx, bz] = r.bf;
  const side = Object.entries({w:Math.abs(bx - R0.x0), e:Math.abs(bx - R0.x1), n:Math.abs(bz - R0.z0), s:Math.abs(bz - R0.z1)}).sort((p, q) => p[1] - q[1])[0][0];
  const [nx, nz] = {w:[-1, 0], e:[1, 0], n:[0, -1], s:[0, 1]}[side];
  const gx = G0.main ? G0.main.x : clamp(bx, R0.x0, R0.x1), gz = G0.main ? G0.main.z : clamp(bz, R0.z0, R0.z1);
  const inside = (x, z, m) => x > R0.x0 + m && x < R0.x1 - m && z > R0.z0 + m && z < R0.z1 - m;
  return {us:massRanks(ours, gx + nx*7, gz + nz*7, -nx, -nz, (x, z) => !inside(x, z, -1.2)), them:massRanks(theirs, gx - nx*3.5, gz - nz*3.5, nx, nz, (x, z) => inside(x, z, 1), st), spec:{ox:gx - nx*1.2, oz:gz - nz*1.2, fx:nx, fz:nz}};   // their chariots and knights sally out of the gate
}
function massPut(im, k, u, yaw) {
  const y0 = u.y0 || 0;
  if (u.down >= 0) { const t = Math.min(1, u.down*3), y = y0 ? Math.max(0, y0*(1 - u.down*u.down*4)) : 0; MASS_O.position.set(u.x + (u.drop || 0)*Math.min(1, u.down*2)*u.fx, y + .08*t, u.z + (u.drop || 0)*Math.min(1, u.down*2)*u.fz); MASS_O.rotation.set(-Math.PI/2*t*u.fallDir, yaw, 0, 'YXZ'); }
  else { MASS_O.position.set(u.x, y0 + (u.bob || 0), u.z); MASS_O.rotation.set(u.lean || 0, yaw, 0, 'YXZ'); }
  MASS_O.updateMatrix(); for (const m of im) m.setMatrixAt(k, MASS_O.matrix);
}
function updMassBattle(dt) {
  const C = W.camp || W.raid;
  // storming a city's walls: its defenders man the walls and your army attacks them there
  if (C && C.assault && REGT.built) { if (!MASS.ims) massBuild(); wallBattle(C, dt); return; }
  const land = C && C.type === 'land' && C.away !== false && C.t <= 22.5 && C.t > 6 && REGT.built && enemies.length;
  if (!land) { if (MASS.ims && MASS.ims[0].count) { for (const im of [...MASS.ims, ...MASS.foe]) im.count = 0; } MASS.id = -1; return; }
  if (!MASS.ims) massBuild();
  // a new battle: your regiments against their host, sized to the campaign
  if (MASS.id !== BT.id || MASS.c !== C) {
    MASS.id = BT.id; MASS.c = C;
    // ours are only the soldiers you have trained: everyone past the 24 who fight up front (none, with 24 or fewer)
    const ours = Math.min(MASS.cap, Math.max(0, (W.army || 0) - 24)), theirs = Math.min(MASS.cap, Math.max(0, Math.round(enemyStrength(C)) - enemies.length));
    const ST = MASS.st = warStyle(C), sg = massSiege(C, ours, theirs, ST);
    MASS.us = sg ? sg.us : massSide(ours, 1); MASS.them = sg ? sg.them : massSide(theirs, -1, ST);
    const look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, C.army && !C.name ? (W.troop || 0) + 1 : W.conquests)];
    // their host in their own colours (never your army's), and their own way of fighting
    MASS.gun = !!look.gun || ST.fire === 'musket' || ST.fire === 'laser'; for (const i of REGT.real ? [0] : [1, 3]) MASS.foe[i].material.color.set(i === 3 ? ST.hat : ST.col);
    massSpecials(C, ST, sg && sg.spec);
    for (let i = 0; i < MASS.ims.length; i++) MASS.ims[i].material.color.copy(REGT.ims[i].material.color);
  }
  const f = clamp((22 - C.t)/13, 0, 1), c5 = Math.min(1, f*5), close = c5*c5*(3 - 2*c5), lose = !!BT.lose, rout = C.t <= 10.5;
  // how many have fallen by now: the losing side bleeds far faster
  const killU = Math.floor(MASS.us.length*(lose ? .5 : .1)*f), killT = Math.floor(MASS.them.length*(lose ? .15 : .45)*f);
  const side = (list, dir, kill, beaten, im) => {
    const fy = Math.atan2(list[0] ? list[0].fx : 0, list[0] ? list[0].fz : 1); let fallen = 0;
    for (let k = 0; k < list.length; k++) {
      const u = list[k], row = Math.floor(k / MASS_W);
      if (u.down >= 0) { u.down += dt; if (u.down < 50) fallen++; continue; }
      if (fallen < kill && row < 3 + fallen/MASS_W && R() < dt*2.5) { u.down = 0; u.fallDir = R() < .5 ? 1 : -1; fallen++; continue; }
      if (rout && beaten) {   // the beaten side breaks: they turn and run for it
        u.run = Math.min(1, u.run + dt*(1 + R())); u.x -= u.fx*u.run*4.2*dt; u.z -= u.fz*u.run*4.2*dt; u.x += Math.sin(u.ph*3)*dt*.4; u.bob = Math.abs(Math.sin(time*11 + u.ph))*.1; u.lean = .25;
        if (Math.hypot(u.x - BF.x, u.z - BF.z) > 36) u.down = 99;
        continue;
      }
      // the ranks close in; the front rank lunges, the rest step and sway, waiting their turn
      const adv = dir < 0 && MASS.st && MASS.st.rush ? 3.4*MASS.st.rush : 3.4; u.x = u.hx + u.fx*close*adv; u.z = u.hz + u.fz*close*adv;
      const front = row < 2;
      u.bob = front ? Math.max(0, Math.sin(time*7 + u.ph))*.08 : Math.abs(Math.sin(time*3 + u.ph))*.03;
      u.lean = front && close > .5 && !rout ? Math.max(0, Math.sin(time*5 + u.ph))*.35 : 0;
      if (rout && !beaten) u.bob = Math.abs(Math.sin(time*9 + u.ph))*.18;   // the winners cheer
    }
    for (let k = 0; k < list.length; k++) { const u = list[k]; if (u.down > 50) { MASS_O.position.set(0, -50, 0); MASS_O.updateMatrix(); for (const m of im) m.setMatrixAt(k, MASS_O.matrix); continue; } massPut(im, k, u, fy + (rout && beaten && u.down < 0 ? Math.PI : 0) + (u.down < 0 ? Math.sin(u.ph)*.12 : 0)); }
    for (const m of im) { m.count = list.length; m.instanceMatrix.needsUpdate = true; }
  };
  side(MASS.us, 1, killU, lose, MASS.ims); side(MASS.them, -1, killT, !lose, MASS.foe);
  // shots and arrows from the front ranks while they close
  if (close > .3 && !rout && (MASS.fireT -= dt) <= 0) {
    MASS.fireT = .16;
    const ranged = wepLvl() >= 1, pick = (list, dir, gun) => { const u = list[R()*Math.min(MASS_W*2, list.length)|0]; if (!u || u.down >= 0) return;
      const at = new THREE.Vector3(u.x + u.fx*.4, 1.3, u.z + u.fz*.4);
      if (gun === 'laser') { particle(0x8ff8ff, at, new THREE.Vector3(u.fx*26, 0, u.fz*26), .22, .07); particle(0xbffcff, at, new THREE.Vector3(0, .2, 0), .08, .14); }
      else if (gun) { particle(0xe8e8e8, at, new THREE.Vector3(u.fx*.5, .4, u.fz*.5), .8, .22, {grow:.6, op:.28}); particle(0xffd070, at, new THREE.Vector3(0, .2, 0), .09, .16); }
      else particle(0x5a4630, at, new THREE.Vector3(u.fx*9 + (R() - .5)*.6, 4, u.fz*9), .7, .06, {grav:1}); };
    if (ranged) pick(MASS.us, 1, wepLvl() >= 2);
    if (MASS.st && MASS.st.fire) pick(MASS.them, -1, MASS.st.fire === 'laser' ? 'laser' : MASS.gun);
  }
  updSpecials(dt, C, close, rout, lose);
}

// Each rival fights its own way: its colours, how close its ranks stand and how deep, what it shoots, and a
// signature: Hellas a shield-wall phalanx, Kumo disciplined blocks, Aztlan loose warriors who rush you, the Nile
// Kingdom war chariots, Ostberg mounted knights, Port Azul musket volleys, Rajpur archers, the Sky Citadel lasers.
// The tribes fight as tribes, in earth colours.
const RIVAL_WAR = {
  ostberg:{col:0x2d4f8a, hat:0xd8dce2, gap:.72, fire:'arrow', knights:3},
  azul:{col:0x1f7a8c, hat:0xf2c200, gap:.75, fire:'musket'},
  kumo:{col:0x8a1a1a, hat:0xc8a24a, gap:.6, rowGap:.66, fire:'arrow'},
  nile:{col:0xd8c08a, hat:0x2a4a8a, gap:.78, fire:'arrow', chariots:3},
  aztlan:{col:0x2a7a3a, hat:0xe8b830, gap:1.05, rowGap:1, jitter:.45, fire:'arrow', rush:1.8},
  hellas:{col:0xe8e4dc, hat:0x2a5aa8, gap:.52, rowGap:.6, fire:null, shields:true},
  rajpur:{col:0xe08a1a, hat:0x8a1a5a, gap:.75, fire:'arrow', elephants:3, monkeys:14},
  nordheim:{col:0x6ad0ff, hat:0x1a2a3a, gap:.8, fire:'laser'},
  tribe:{col:0x7a5a3a, hat:0x3a2a1a, gap:.95, rowGap:.95, jitter:.35, fire:'arrow', rush:1.3}};
const warStyle = C => C.rival != null && EMP.list[C.rival] ? RIVAL_WAR[EMP.list[C.rival].id] || RIVAL_WAR.tribe : RIVAL_WAR.tribe;
// how many soldiers the other side really has: a tribe its campaign's army, a rival city its strength (a raid on you the
// same), so a small fight stays small and only a great power fields a great host
function enemyStrength(C) {
  if (C.rival != null && EMP.list[C.rival]) return es(EMP.list[C.rival]).pow*1.5;
  const c = CAMPAIGNS[C.ci ?? C.tribe ?? W.conquests]; return c ? c.army : 10;
}
// ------------------------------------------------------------------ the battle for the walls
// When the field is won and your army storms the city, its defenders man the walls on the gate side, shooting down at
// you. Your army forms up at the foot of the wall and fires back up; your planes bomb the walls from above (wallBomb).
// Defenders fall from the walls as the assault goes on; when the gate breaks the last of them are swept off and your
// army pours in through it.
const WALL = {c:null, n:0, shotT:0};
function wallBattle(C, dt) {
  const r = EMP.list[C.rival], D = r && DEF[r.id];
  if (!D || !D.main) { for (const im of [...MASS.ims, ...MASS.foe]) im.count = 0; return; }
  const G0 = gatesOf(r), R0 = G0.R0, gx = D.main.x, gz = D.main.z, h = LOOK[D.tier].h;
  const [ix, iz] = inward(D.main), nx = -ix, nz = -iz, lx = -nz, lz = nx;   // n: out from the city; l: along the wall
  if (WALL.c !== C) {
    WALL.c = C; MASS.id = -1;
    const ours = Math.min(MASS.cap, Math.max(0, (W.army || 0) - 24)), inside = (x, z) => x > R0.x0 + .5 && x < R0.x1 - .5 && z > R0.z0 + .5 && z < R0.z1 - .5;
    // your army: ranks at the foot of the wall, either side of the gate (the duellers take the gate itself)
    MASS.us = massRanks(ours, gx + nx*3.4, gz + nz*3.4, -nx, -nz, (x, z) => !inside(x, z));
    // the defenders: a man every 0.9 along the wall top, out to 13 either side of the gate's gap
    const them = [];
    const nDef = clamp(Math.round(enemyStrength(C)*.35), 6, 40), step = Math.max(.72, 28/nDef);
    for (let t = -14; t <= 14; t += step) {
      if (Math.abs(t) < 2.3) continue;
      const x = gx + lx*t - ix*.1, z = gz + lz*t - iz*.1;
      if (!(x >= R0.x0 - .5 && x <= R0.x1 + .5 && z >= R0.z0 - .5 && z <= R0.z1 + .5)) continue;   // the wall ends at the corner
      them.push({x, z, hx:x, hz:z, fx:nx, fz:nz, y0:h + .02, down:-1, ph:R()*6, run:0, drop:1.2});
    }
    MASS.them = them;
    MASS.gun = !!ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, W.conquests)].gun;
    for (const i of REGT.real ? [0] : [1, 3]) MASS.foe[i].material.color.set(i === 3 ? 0x3a1412 : 0x9a2620);
    for (let i = 0; i < MASS.ims.length; i++) MASS.ims[i].material.color.copy(REGT.ims[i].material.color);
  }
  const ph = C.t, broken = ph < 16, fy = Math.atan2(-nx, -nz);
  // the defenders: they fire down while the gate holds, fall to your fire and your bombs, and are swept away when it breaks
  const alive = MASS.them.filter(u => u.down < 0).length;
  for (const u of MASS.them) {
    if (u.down >= 0) { u.down += dt; continue; }
    if (broken) { if (R() < dt*3) { u.down = 0; u.fallDir = -1; } continue; }
    if (R() < dt*.035*(1 + (26 - ph)*.25)) { u.down = 0; u.fallDir = R() < .5 ? 1 : -1; }
    u.bob = Math.max(0, Math.sin(time*6 + u.ph))*.05; u.lean = Math.max(0, Math.sin(time*4 + u.ph))*.25;
  }
  // your army: firing up at the walls, then in through the broken gate
  for (const [k, u] of MASS.us.entries()) {
    if (u.down >= 0) { u.down += dt; continue; }
    if (broken) {
      const tx = gx - nx*4 + lx*((k % 9) - 4)*.5, tz = gz - nz*4 + lz*((k % 9) - 4)*.5, d = Math.hypot(tx - u.x, tz - u.z);
      if (d > .3) { const st = Math.min(d, 4.5*dt*(.6 + (k % 7)*.08)); u.x += (tx - u.x)/d*st; u.z += (tz - u.z)/d*st; u.bob = Math.abs(Math.sin(time*11 + u.ph))*.1; }
      else u.down = 99;   // through the gate and on into the city
      continue;
    }
    u.bob = Math.abs(Math.sin(time*5 + u.ph))*.04; u.lean = Math.max(0, Math.sin(time*4 + u.ph))*.2;
    if (R() < dt*.05) { u.down = 0; u.fallDir = 1; }   // the walls' fire takes its toll too
  }
  // shots both ways: tracers and puffs up from the foot of the wall, down from the wall top
  if (!broken && (WALL.shotT -= dt) <= 0) {
    WALL.shotT = .09;
    const a = MASS.us[R()*Math.min(MASS_W*2, MASS.us.length)|0], d = MASS.them.filter(q => q.down < 0)[R()*Math.max(1, alive)|0];
    const gun = wepLvl() >= 2;
    if (a && a.down < 0 && d) {
      const from = new THREE.Vector3(a.x, 1.3, a.z), to = new THREE.Vector3(d.x, d.y0 + 1, d.z);
      if (gun) { particle(0xffd070, from, new THREE.Vector3(0, .2, 0), .08, .14); particle(0xfff0b0, from.clone().lerp(to, .5), to.clone().sub(from).multiplyScalar(2.4), .2, .05); }
      else particle(0x5a4630, from, to.clone().sub(from).multiplyScalar(1.3).setY(4), .8, .06, {grav:1});
    }
    if (d && a && R() < .6) {
      const from = new THREE.Vector3(d.x, d.y0 + 1.2, d.z), to = new THREE.Vector3(a.x, .3, a.z);
      if (MASS.gun) { particle(0xffd070, from, new THREE.Vector3(0, .2, 0), .08, .14); particle(0xfff0b0, from.clone().lerp(to, .5), to.clone().sub(from).multiplyScalar(2.4), .2, .05); }
      else particle(0x5a4630, from, to.clone().sub(from).multiplyScalar(1.4).setY(1), .7, .06, {grav:1});
    }
  }
  const put = (list, im, yaw) => { for (let k = 0; k < list.length; k++) { const u = list[k]; if (u.down > 50) { MASS_O.position.set(0, -50, 0); MASS_O.updateMatrix(); for (const m of im) m.setMatrixAt(k, MASS_O.matrix); continue; } massPut(im, k, u, yaw); } for (const m of im) { m.count = list.length; m.instanceMatrix.needsUpdate = true; } };
  put(MASS.us, MASS.ims, fy); put(MASS.them, MASS.foe, fy + Math.PI);
}
// a bomb lands: defenders near it are blown off the wall
function wallBomb(x, z) {
  if (!WALL.c || !WALL.c.assault) return;
  for (const u of MASS.them) if (u.down < 0 && Math.hypot(u.x - x, u.z - z) < 3.2) { u.down = 0; u.fallDir = R() < .5 ? 1 : -1; u.drop = 2 + R()*1.5; }
}

// the rivals' signature troops on the field: the Nile's war chariots, Ostberg's knights, Hellas's shield wall
const WARSPEC = {list:[], c:null};
function massSpecials(C, st, at) {
  for (const u of WARSPEC.list) scene.remove(u.g); WARSPEC.list = []; WARSPEC.c = C;
  // in front of their host facing you (or, at a walled city, just inside the gate, about to sally out)
  const fx = at ? at.fx : MASS_AX[0], fz = at ? at.fz : MASS_AX[1], ox = at ? at.ox : BF.x + 1.5 - fx*6.2, oz = at ? at.oz : BF.z + 1.2 - fz*6.2, lx = -fz, lz = fx;
  WARSPEC.f = [fx, fz];
  const crew = {body:st.col, trim:st.hat, hat:'helmet', hatCol:st.hat, pants:0x3a2a1a};
  for (let i = 0; i < (st.chariots || 0); i++) {
    const CH = chariotModel(i + 3, st.col, {...crew, hat:'roman'}); const g = CH.g; g.position.set(ox + lx*(i - 1)*3, 0, oz + lz*(i - 1)*3); g.rotation.y = Math.atan2(fx, fz); scene.add(g);
    WARSPEC.list.push({g, ch:CH, x0:g.position.x, z0:g.position.z, sp:0});
  }
  for (let i = 0; i < (st.knights || 0); i++) {
    const g = new THREE.Group(), H = horseModel(HORSE.s); if (!H) break; horseCoat(H.g, i + 4); H.g.position.z = HORSE.z; g.add(H.g); saddleOn(g);
    const k = makeChar({...crew, hat:'greathelm', metal:true, sword:true, shield:'heater'}); k.ride = 'horse'; g.add(k.g); k.g.position.y = HORSE.ride;
    g.position.set(ox + lx*(i - 1)*2.4 + fx*1.5, 0, oz + lz*(i - 1)*2.4 + fz*1.5); g.rotation.y = Math.atan2(fx, fz); scene.add(g);
    WARSPEC.list.push({g, H, x0:g.position.x, z0:g.position.z, sp:0});
  }
  // war elephants: a saffron cloth over the back, a howdah with a canopy on top and an archer riding in it
  for (let i = 0; i < (st.elephants || 0); i++) {
    const b = beast('elephant', 2.7); if (!b) break;
    const g = new THREE.Group(); g.add(b); scene.add(g);
    mesh(G.box, 0xe08a1a, [1.25, .55, 1.6], [0, 1.95, 0], g); mesh(G.box, 0x8a1a5a, [1.28, .1, 1.62], [0, 2.2, 0], g);
    mesh(G.box, 0xc8a24a, [.9, .45, .9], [0, 2.5, -.05], g, {metalness:.5}); for (const [px, pz] of [[-.4, -.45], [.4, -.45], [-.4, .35], [.4, .35]]) mesh(G.cyl, 0x8a5a2b, [.03, .8, .03], [px, 3, pz], g);
    const can = mesh(G.cone4, 0x8a1a5a, [.75, .4, .75], [0, 3.55, -.05], g); can.rotation.y = Math.PI/4;
    const archer = makeChar({body:st.col, trim:st.hat, hat:'turban', hatCol:st.hat, pants:0xf0e8d8, bow:true}); archer.ride = 'stand'; archer.g.position.set(0, 2.7, -.05); archer.g.scale.setScalar(.8); g.add(archer.g);
    g.traverse(o => { if (o.isMesh) o.userData.noBake = true; });
    g.position.set(ox + lx*(i - 1)*3.4 - fx*1, 0, oz + lz*(i - 1)*3.4 - fz*1); g.rotation.y = Math.atan2(fx, fz);
    WARSPEC.list.push({g, beast:b, ph:R()*6, x0:g.position.x, z0:g.position.z, sp:0, slow:.55});
  }
  // a troop of monkeys that bounds across the field at your front ranks in great leaps
  for (let i = 0; i < (st.monkeys || 0); i++) {
    const g = monkeyModel(); scene.add(g);
    const x = ox + lx*((i % 7) - 3)*1.3 + fx*1.5, z = oz + lz*((i % 7) - 3)*1.3 + fz*1.5; g.position.set(x, 0, z);
    WARSPEC.list.push({g, monkey:true, x0:x, z0:z, ph:R()*6, hop:0, tgt:null, wait:R()*1.5});
  }
  // a phalanx's shields: a bronze disc on the front two ranks
  if (st.shields) {
    const front = MASS.them.filter((u, k) => k < 40 && u.down < 0), im = new THREE.InstancedMesh(G.cyl, mat(0xc8a24a, {metalness:.7, roughness:.35}), Math.max(1, front.length)), O = new THREE.Object3D();
    im.frustumCulled = false; im.userData.noBake = true; scene.add(im); WARSPEC.list.push({g:im, shields:front, O});
  }
}
function updSpecials(dt, C, close, rout, lose) {
  if (WARSPEC.c !== C) return;
  for (const u of WARSPEC.list) {
    if (u.shields) {
      const O = u.O; let n = 0;
      for (const s of u.shields) { if (s.down >= 0) continue; O.position.set(s.x + s.fx*.32, 1 + (s.bob || 0), s.z + s.fz*.32); O.rotation.set(Math.PI/2, Math.atan2(s.fx, s.fz), 0, 'YXZ'); O.scale.set(.32, .05, .32); O.updateMatrix(); u.g.setMatrixAt(n++, O.matrix); }
      u.g.count = n; u.g.instanceMatrix.needsUpdate = true; continue;
    }
    if (u.monkey) { updMonkey(u, dt, close, rout, lose); continue; }
    // chariots and knights charge across the field at your lines as the fighting starts, then wheel back
    const [fx, fz] = WARSPEC.f, go = close > .2 && !rout, reach = u.beast ? 17 : 10, d = go ? Math.min(reach, close*(reach + 1)) : rout && !lose ? -14*Math.min(1, (10.5 - C.t)*.4) : 0;
    const tx = u.x0 + fx*d, tz = u.z0 + fz*d, p = u.g.position, dd = Math.hypot(tx - p.x, tz - p.z);
    const want = dd > .2 ? Math.min(8*(u.slow || 1), dd*2) : 0; u.sp += (want - u.sp)*Math.min(1, dt*3);
    if (dd > .05) { p.x += (tx - p.x)/dd*Math.min(dd, u.sp*dt); p.z += (tz - p.z)/dd*Math.min(dd, u.sp*dt); u.g.rotation.y = Math.atan2(d >= 0 ? fx : -fx, d >= 0 ? fz : -fz); }
    if (u.ch) chariotRoll(u.ch, dt, u.sp); if (u.H) horseGait(u.H, dt, u.sp);
    if (u.beast) {
      u.ph += u.sp*dt*2.2; stride(u.beast, u.ph, Math.min(.45, u.sp*.12)); u.g.position.y = Math.abs(Math.sin(u.ph))*.05*Math.min(1, u.sp);
      // the charge: a trumpet blast, then whoever is in the way is trampled (your ranks and the soldiers fighting up front)
      if (go && !u.blown) { u.blown = true; snd(220, .6, 'sawtooth', .05, 2.4); setTimeout(() => snd(330, .5, 'sawtooth', .04, 1.8), 220); if (watchingWar()) shakeCam(.15); }
      if (go && u.sp > 1.2) {
        const ex = p.x, ez = p.z;
        for (const m of MASS.us) if (m.down < 0 && Math.abs(m.x - ex) < 1.7 && Math.abs(m.z - ez) < 1.7 && Math.hypot(m.x - ex, m.z - ez) < 1.6) { m.down = 0; m.fallDir = R() < .5 ? 1 : -1; m.drop = .8; m.fx = (m.x - ex) || .1; m.fz = (m.z - ez) || .1; const l = Math.hypot(m.fx, m.fz); m.fx /= l; m.fz /= l; }
        for (const sd of soldiers) if (!sd.down && sd.hp > 0 && Math.hypot(sd.pos.x - ex, sd.pos.z - ez) < 1.5) { sd.hp -= 4; sd.hit = .2; const kx = sd.pos.x - ex, kz = sd.pos.z - ez, kd = Math.hypot(kx, kz) || 1; sd.pos.x += kx/kd*1.2; sd.pos.z += kz/kd*1.2; if (sd.hp <= 0) { sd.down = true; sd.fall = 0; } }
        if (R() < dt*6) particle(0xc8b48a, new THREE.Vector3(ex + (R() - .5)*1.6, .15, ez + (R() - .5)*1.6), new THREE.Vector3((R() - .5)*.8, .7, (R() - .5)*.8), .5, .25, {grow:.8, op:.4});
      }
    }
  }
  if (C.t <= 7) { for (const u of WARSPEC.list) scene.remove(u.g); WARSPEC.list = []; WARSPEC.c = null; }
}

// a monkey: brown fur, a pale face, long arms and a curled tail
function monkeyModel() {
  const g = new THREE.Group(), fur = 0x6a4228, face = 0xd8b088;
  mesh(G.sph, fur, [.22, .26, .2], [0, .48, 0], g); mesh(G.sph, fur, [.16, .15, .15], [0, .82, .06], g); mesh(G.sph, face, [.1, .09, .06], [0, .8, .18], g);
  for (const sx of [-1, 1]) { mesh(G.sph, face, [.05, .05, .03], [sx*.13, .88, .05], g); const a = mesh(G.cyl, fur, [.045, .42, .045], [sx*.2, .45, .04], g); a.rotation.z = sx*.5; const l = mesh(G.cyl, fur, [.05, .3, .05], [sx*.1, .16, 0], g); l.rotation.z = sx*.2; }
  const tail = new THREE.Group(); tail.position.set(0, .4, -.18); g.add(tail);
  for (let k = 0; k < 5; k++) { const t = mesh(G.sph, fur, [.035, .035, .1], [0, k*.07 + Math.sin(k*.7)*.04, -k*.09], tail); t.rotation.x = -k*.25; }
  g.userData.tail = tail; g.scale.setScalar(.9 + R()*.25);
  g.traverse(o => { if (o.isMesh) { o.userData.noBake = true; o.castShadow = true; } });
  return g;
}
function updMonkey(u, dt, close, rout, lose) {
  const p = u.g.position; u.ph += dt*8; if (u.g.userData.tail) u.g.userData.tail.rotation.y = Math.sin(u.ph*.6)*.5;
  if ((u.wait -= dt) > 0 && !u.tgt) { p.y = Math.abs(Math.sin(u.ph))*.08; return; }
  if (!u.tgt) {
    // the next leap: at your front ranks while they fight, scattering home when the battle turns
    const fx = WARSPEC.f[0], fz = WARSPEC.f[1], d = rout ? (lose ? 0 : -9) : close > .2 ? 7 + R()*4 : 1 + R()*2;
    u.tgt = [u.x0 + fx*d + (R() - .5)*4, u.z0 + fz*d + (R() - .5)*4]; u.from = [p.x, p.z]; u.hop = 0; u.len = .55 + R()*.3;
  }
  u.hop = Math.min(1, u.hop + dt/u.len);
  p.x = u.from[0] + (u.tgt[0] - u.from[0])*u.hop; p.z = u.from[1] + (u.tgt[1] - u.from[1])*u.hop; p.y = Math.sin(u.hop*Math.PI)*(1 + Math.hypot(u.tgt[0] - u.from[0], u.tgt[1] - u.from[1])*.12);
  u.g.rotation.y = Math.atan2(u.tgt[0] - u.from[0], u.tgt[1] - u.from[1]);
  if (u.hop >= 1) { u.tgt = null; u.wait = .2 + R()*.9; if (R() < .08) snd(900 + R()*500, .06, 'square', .02, .4); }
}
