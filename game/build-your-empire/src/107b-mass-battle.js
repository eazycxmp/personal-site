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
  if (u.down >= 0) { const t = Math.min(1, u.down*3); MASS_O.position.set(u.x, .08*t, u.z); MASS_O.rotation.set(-Math.PI/2*t*u.fallDir, yaw, 0, 'YXZ'); }
  else { MASS_O.position.set(u.x, u.bob || 0, u.z); MASS_O.rotation.set(u.lean || 0, yaw, 0, 'YXZ'); }
  MASS_O.updateMatrix(); for (const m of im) m.setMatrixAt(k, MASS_O.matrix);
}
function updMassBattle(dt) {
  // (not while storming a city's walls: that fight is at the gate, and ranks drawn round it would stand in the walls)
  const C = W.camp || W.raid, land = C && C.type === 'land' && !C.assault && C.away !== false && C.t <= 22.5 && C.t > 6 && REGT.built && enemies.length;
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
