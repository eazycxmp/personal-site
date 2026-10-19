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
function massRanks(n, ox, oz, fx, fz, keep) {
  const lx = -fz, lz = fx;
  return [...Array(n)].map((_, k) => { const row = Math.floor(k / MASS_W), c = (k % MASS_W) - (MASS_W - 1)/2 + (row % 2)*.35, x = ox + lx*c*.72 - fx*row*.8, z = oz + lz*c*.72 - fz*row*.8;
    // a soldier whose place in the ranks falls inside a wall, a house or the sea (or the wrong side of the wall) is left out
    const out = !keep(x, z) || isWater(x, z) || boxes.some(b => x > b.x0 - .3 && x < b.x1 + .3 && z > b.z0 - .3 && z < b.z1 + .3) || boxes.some(b => { const ax = x + fx*3.4, az = z + fz*3.4; return ax > b.x0 && ax < b.x1 && az > b.z0 && az < b.z1; });
    return {x, z, hx:x, hz:z, fx, fz, down:out ? 99 : -1, ph:R()*6, run:0}; });
}
function massSide(n, dir) {
  // in the open: dir 1 ours, on the right facing left; -1 theirs, on the left facing right
  const fx = -dir*MASS_AX[0], fz = -dir*MASS_AX[1];
  return massRanks(n, BF.x + 1.5 + dir*MASS_AX[0]*8.5, BF.z + 1.2 + dir*MASS_AX[1]*8.5, fx, fz, () => true);
}
// at a walled city: your army forms up outside the wall facing its gate, theirs holds the streets just inside it
function massSiege(C, ours, theirs) {
  const r = C.rival != null ? EMP.list[C.rival] : null; if (!r || !DEF[r.id] || !CITY_LAND[r.id] || !r.bf) return null;
  const G0 = gatesOf(r), R0 = G0.R0, [bx, bz] = r.bf;
  const side = Object.entries({w:Math.abs(bx - R0.x0), e:Math.abs(bx - R0.x1), n:Math.abs(bz - R0.z0), s:Math.abs(bz - R0.z1)}).sort((p, q) => p[1] - q[1])[0][0];
  const [nx, nz] = {w:[-1, 0], e:[1, 0], n:[0, -1], s:[0, 1]}[side];
  const gx = G0.main ? G0.main.x : clamp(bx, R0.x0, R0.x1), gz = G0.main ? G0.main.z : clamp(bz, R0.z0, R0.z1);
  const inside = (x, z, m) => x > R0.x0 + m && x < R0.x1 - m && z > R0.z0 + m && z < R0.z1 - m;
  return {us:massRanks(ours, gx + nx*7, gz + nz*7, -nx, -nz, (x, z) => !inside(x, z, -1.2)), them:massRanks(theirs, gx - nx*3.5, gz - nz*3.5, nx, nz, (x, z) => inside(x, z, 1))};
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
    const ours = Math.min(MASS.cap, Math.max(0, (W.army || 0) - 24)), theirs = Math.min(MASS.cap, 60 + enemies.length*12);
    const sg = massSiege(C, ours, theirs);
    MASS.us = sg ? sg.us : massSide(ours, 1); MASS.them = sg ? sg.them : massSide(theirs, -1);
    const look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, C.army && !C.name ? (W.troop || 0) + 1 : W.conquests)];
    // their host in a strong red, whatever the age, so the two sides never blur together across the field
    MASS.gun = !!look.gun; for (const i of REGT.real ? [0] : [1, 3]) MASS.foe[i].material.color.set(i === 3 ? 0x3a1412 : 0x9a2620);
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
      u.x = u.hx + u.fx*close*3.4; u.z = u.hz + u.fz*close*3.4;
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
      if (gun) { particle(0xe8e8e8, at, new THREE.Vector3(u.fx*.5, .4, u.fz*.5), .8, .22, {grow:.6, op:.28}); particle(0xffd070, at, new THREE.Vector3(0, .2, 0), .09, .16); }
      else particle(0x5a4630, at, new THREE.Vector3(u.fx*9 + (R() - .5)*.6, 4, u.fz*9), .7, .06, {grav:1}); };
    if (ranged) pick(MASS.us, 1, wepLvl() >= 2);
    pick(MASS.them, -1, MASS.gun);
  }
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
    for (let t = -14; t <= 14; t += .72) {
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
