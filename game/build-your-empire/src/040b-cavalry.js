// ------------------------------------------------------------------ cavalry: horsemen, then lancers, then dragoons; tanks take over from the horses
// A branch of its own beside the army, the navy and the air force. Each tier is military technology you buy; the riders
// wait in a paddock on the military grounds, and the tank division parks in the same paddock once the horses retire.
const CAV = [null,
  {n:'Cavalry', icon:'🐎', pow:6, o:{body:0x6a5040, trim:0x8a6a4a, hat:'helmet', pants:0x4a3a2a, sword:true}},
  {n:'Lancers', icon:'🏇', pow:12, o:{body:0xb8bcc4, trim:0x2d4fa8, hat:'greathelm', pants:0x8a8f96, metal:true}, lance:true},
  {n:'Dragoons', icon:'🎖️', pow:20, o:{body:0x2d4fa8, trim:0xf2c200, hat:'tricorne', pants:0xf0ece0, gun:true, belts:true}}];
const TANK_POW = 30;
const PADDOCK = {x0:5.4, x1:12.6, z0:50.6, z1:55.4, g:null, rides:[], lvl:0};
const cavLvl = () => count(['cav1', 'cav2', 'cav3']);
const cavPower = () => W.unlocked.has('tanks') ? TANK_POW : cavLvl() ? CAV[cavLvl()].pow : 0;
const cavName = () => W.unlocked.has('tanks') ? 'Tank division' : cavLvl() ? CAV[cavLvl()].n : 'Cavalry';
function cavStage(n, anim) {
  const P = PADDOCK;
  if (!P.g) {
    // a rail fence round the paddock, open on the side facing the drill yard
    P.g = new THREE.Group(); scene.add(P.g);
    slab(0xb59a6a, P.x1 - P.x0, P.z1 - P.z0, (P.x0 + P.x1)/2, (P.z0 + P.z1)/2, .005);
    const post = (x, z) => mesh(G.box, 0x6a4a2a, [.1, .9, .1], [x, .45, z], P.g);
    const rail = (x, z, len, alongX) => { for (const y of [.4, .75]) mesh(G.box, 0x8a6a42, alongX ? [len, .06, .05] : [.05, .06, len], [x, y, z], P.g); };
    for (let x = P.x0; x <= P.x1 + .01; x += 1.2) { post(x, P.z0); post(x, P.z1); }
    for (let z = P.z0 + 1.2; z < P.z1; z += 1.2) post(P.x1, z);
    rail((P.x0 + P.x1)/2, P.z0, P.x1 - P.x0, true); rail((P.x0 + P.x1)/2, P.z1, P.x1 - P.x0, true); rail(P.x1, (P.z0 + P.z1)/2, P.z1 - P.z0, false);
    boxes.push({x0:P.x0, x1:P.x1, z0:P.z0, z1:P.z1});
    if (anim) popIn(P.g);
  }
  for (const r of P.rides) P.g.remove(r.g);
  P.rides = []; P.lvl = n;
  if (!n || W.unlocked.has('tanks')) return;
  // two more riders than the tier: three horsemen, four lancers, five dragoons, side by side facing the gate
  const k = n + 2, C = CAV[n];
  for (let i = 0; i < k; i++) {
    const H = horseModel(HORSE.s, [1, .72, 1.15, .85, .6][i]); if (!H) break;
    const g = new THREE.Group(); g.position.set(P.x0 + 1 + i*(P.x1 - P.x0 - 2)/Math.max(1, k - 1), 0, (P.z0 + P.z1)/2 + (i % 2 ? .4 : -.4)); g.rotation.y = Math.PI; P.g.add(g);
    H.g.position.z = HORSE.z; g.add(H.g); saddleOn(g);
    const rider = makeChar(C.o); rider.ride = 'horse'; g.add(rider.g); rider.g.position.set(0, HORSE.ride, 0);
    if (C.lance) mesh(G.cyl, 0x8a6a42, [.04, 2.6, .04], [.32, HORSE.ride + 1.4, -.1], g).rotation.x = .25;
    H.idleT = R()*8; P.rides.push({g, H, rider});
  }
  if (anim) { puff((P.x0 + P.x1)/2, (P.z0 + P.z1)/2); banner(`${C.icon} ${C.n}!`, `Your mounted troops: strength ${C.pow}. Send them to war on their own, beside the army.`); }
}
function updCavalry(dt) {
  const P = PADDOCK; if (!P.rides.length) return;
  // the riders leave the paddock while they are away at war
  const away = CHARGE.riders.length > 0 || (typeof FRONTS !== 'undefined' && FRONTS.busy('cav'));
  const near = camera.position.distanceToSquared(new THREE.Vector3((P.x0 + P.x1)/2, 0, (P.z0 + P.z1)/2)) < 70*70;
  for (const r of P.rides) { r.g.visible = !away; if (!away && near) horseGait(r.H, dt, 0); }
}
// ------------------------------------------------------------------ the charge: your cavalry (or tanks) ride out to a land battle and fight it
// Who goes to a land battle: the army unless you sent only other branches; the cavalry when you sent it.
const armyGoes = C => !!C && (C.br ? C.br.includes('army') : C.branch ? C.branch === 'army' : true);
const cavGoes = C => !!C && C.type === 'land' && (C.br ? C.br.includes('cav') : C.branch === 'cav');
const CHARGE = {riders:[], id:null, back:null};
function chargeStart(C) {
  chargeClear();
  C.id ||= Math.random(); CHARGE.id = C.id; CHARGE.back = null;
  const tanks = W.unlocked.has('tanks'), n = tanks ? 3 : cavLvl() + 2, Cv = CAV[Math.max(1, cavLvl())], P = PADDOCK;
  // out of the paddock, down the corridor past the mess, onto the field; or the long march to a faraway battlefield
  CHARGE.path = C.away ? (C.path || []).map(p => [...p]) : [[(P.x0 + P.x1)/2, P.z1 + 1.5], [5.2, 60.5], [5.2, 67], [5.2, 79]];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); scene.add(g);
    const r = {g, i, n, tank:tanks, pos:new THREE.Vector3(), vel:new THREE.Vector3(), yaw:0, hp:99, maxHp:99, pi:0, mode:'ride', cd:R(), sp:0};
    if (tanks) { const t = model('tank', 2.4, 'z'); if (t) g.add(t); }
    else {
      r.H = horseModel(HORSE.s, [1, .72, 1.15, .85, .6][i]); if (r.H) { r.H.g.position.z = HORSE.z; g.add(r.H.g); }
      saddleOn(g); r.char = makeChar(Cv.o); r.char.ride = 'horse'; g.add(r.char.g); r.char.g.position.y = HORSE.ride;
      if (Cv.lance) { r.lance = mesh(G.cyl, 0x8a6a42, [.04, 2.6, .04], [.32, HORSE.ride + 1.2, .2], g); r.lance.rotation.x = .25; }
    }
    const [sx, sz] = CHARGE.path[0] || [BF.x, BF.z - 30];
    r.pos.set(sx + (i - (n - 1)/2)*1.6, 0, sz - (C.away ? i*1.4 : 0)); g.position.copy(r.pos);
    CHARGE.riders.push(r);
  }
}
function chargeClear() { for (const r of CHARGE.riders) { scene.remove(r.g); if (r.bar) scene.remove(r.bar); } CHARGE.riders = []; CHARGE.id = null; }
// move toward a point at a gallop, turning like a horse (not on the spot); true when there
function ride(r, tx, tz, sp, dt) {
  const dx = tx - r.pos.x, dz = tz - r.pos.z, d = Math.hypot(dx, dz);
  if (d < .3) { r.sp += (0 - r.sp)*Math.min(1, dt*4); return true; }
  let a = Math.atan2(dx, dz) - r.yaw; a = Math.atan2(Math.sin(a), Math.cos(a));
  r.yaw += clamp(a, -dt*(r.tank ? 1.6 : 3.2), dt*(r.tank ? 1.6 : 3.2));
  const want = Math.abs(a) > 1.2 ? sp*.4 : Math.min(sp, d*2.5);
  r.sp += (want - r.sp)*Math.min(1, dt*(r.tank ? 1.5 : 3));
  r.pos.x += Math.sin(r.yaw)*r.sp*dt; r.pos.z += Math.cos(r.yaw)*r.sp*dt;
  return false;
}
function updCharge(dt) {
  const C = W.camp;
  if (cavGoes(C) && CHARGE.id !== C.id) chargeStart(C);
  if (!CHARGE.riders.length) return;
  const live = cavGoes(C) && CHARGE.id === C.id, ph = live ? C.t : 0;
  if (!live && !CHARGE.back) CHARGE.back = [...CHARGE.path].reverse();
  const alive = enemies.filter(e => e.alive);
  let home = 0;
  for (const r of CHARGE.riders) {
    r.hp = 99;   // the horsemen take blows but always ride home (the battle's outcome is set by the odds)
    const fx = BF.x + (r.i - (r.n - 1)/2)*2.2, fz = BF.z - 5.5;
    // by sea: aboard the troop boats until they land with the army
    const S = live && C.sail, el = live ? C.dur - C.t : 0;
    if (S && el < S.board + S.dur) { r.g.visible = false; r.pos.set(S.land[0] + (r.i - 1)*1.6, 0, S.land[1] - 2); continue; }
    r.g.visible = true;
    if (!live) {
      // the battle is over: back the way they came, then into the paddock
      if (r.bi === undefined) r.bi = 0;
      const pt = CHARGE.back[r.bi];
      if (!pt) { home++; continue; }
      if (ride(r, pt[0] + (r.i - (r.n - 1)/2)*1.4, pt[1], r.tank ? 4 : 6, dt)) r.bi++;
    } else if (ph > 22 || r.mode === 'ride') {
      // ride out along the road, then dress the line facing the enemy
      const pt = CHARGE.path[r.pi];
      if (pt && ph > 22) { if (ride(r, pt[0] + (r.i - (r.n - 1)/2)*1.4, pt[1], r.tank ? 5 : 8, dt)) r.pi++; }
      else if (ride(r, fx, fz, r.tank ? 5 : 8, dt) && ph <= 22) r.mode = 'charge';
      else if (ph <= 22 && Math.hypot(fx - r.pos.x, fz - r.pos.z) < 2) r.mode = 'charge';
    } else if (ph > 9) {
      if (!r.target || !r.target.alive) { r.target = alive.length ? alive[(r.i*3 + (r.pass || 0)) % alive.length] : null; r.aim = null; }
      const t = r.target;
      if (r.tank) {
        // tanks halt at range, turn their guns on a target and fire
        if (t) { const d = Math.hypot(t.pos.x - r.pos.x, t.pos.z - r.pos.z); if (d > 7) ride(r, t.pos.x, t.pos.z, 4, dt); else { r.sp *= .9; r.yaw += Math.atan2(Math.sin(Math.atan2(t.pos.x - r.pos.x, t.pos.z - r.pos.z) - r.yaw), Math.cos(Math.atan2(t.pos.x - r.pos.x, t.pos.z - r.pos.z) - r.yaw))*Math.min(1, dt*2); if ((r.cd -= dt) <= 0) { r.cd = 1.4 + R()*.6; strike(r, t, true, 3); particle(0x6a6a6a, new THREE.Vector3(r.pos.x, 1.4, r.pos.z), new THREE.Vector3(0, 1.2, 0), 1.2, .35, {grow:.8, op:.6}); } } }
        else ride(r, fx, fz, 4, dt);
      } else if (t) {
        // charge straight through the target and out the far side, then wheel round and come again
        if (!r.aim) { const dx = t.pos.x - r.pos.x, dz = t.pos.z - r.pos.z, d = Math.hypot(dx, dz) || 1; r.aim = [t.pos.x + dx/d*4, t.pos.z + dz/d*4]; r.struck = false; }
        if (!r.struck && Math.hypot(t.pos.x - r.pos.x, t.pos.z - r.pos.z) < 1.3) {
          r.struck = true; strike(r, t, false, 2.6);
          const kx = t.pos.x - r.pos.x, kz = t.pos.z - r.pos.z, kd = Math.hypot(kx, kz) || 1; t.pos.x += kx/kd*.7; t.pos.z += kz/kd*.7;
          if (r.lance) r.lance.rotation.x = 1.3;
        }
        if (ride(r, r.aim[0], r.aim[1], 10, dt) || Math.hypot(r.aim[0] - r.pos.x, r.aim[1] - r.pos.z) < 1.2) { r.aim = null; r.pass = (r.pass || 0) + 1; r.target = null; if (r.lance) r.lance.rotation.x = .25; }
      } else ride(r, fx, fz, 6, dt);
    } else {
      // the enemy breaks: rein in on the field
      ride(r, fx, fz, 4, dt);
    }
  }
  for (const r of CHARGE.riders) {
    r.g.position.set(r.pos.x, 0, r.pos.z); r.g.rotation.y = r.yaw;
    if (r.H && r.g.visible) horseGait(r.H, dt, r.sp);
  }
  if (!live && home >= CHARGE.riders.length) chargeClear();
}
