// ------------------------------------------------------------------ the battlefield, south of the military grounds
const BF = {x:3, z:88}, BF_HOME = {x:3, z:88};
const atBattle = s => Math.abs(s.pos.x - BF.x) < 13 && s.pos.z > BF.z - 7 && s.pos.z < BF.z + 12;
clearForest({x0:-6, x1:12, z0:79, z1:96});
clearForest({x0:-10.8, x1:-8.2, z0:78, z1:96});   // the recruits' road
slab(0x9a8a5a, 18, 17.6, 3, 87.8, 0);
const enemies = [];
let enemyCamp = null;
// the road from the barracks to a rival's battlefield: through your regions, then along the long road
function armyPath(r) {
  const start = {x:5.2, z:79}, [bx, bz] = r.bf;
  if (r.via === 'east') return [...route(start, 50, 1.6), [54, 1.9], [67.3, 1.9], [bx - 8, 1.9], [bx, bz - 3]];
  if (r.via === 'west') return [...route(start, -85.8, 12), [-39, 12.1], [bx + 8, 12.1], [bx, bz - 3]];
  return [[bx, bz - 3]];
}
const pathLen = pts => pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
// walk straight to a point (the long roads are open country, so no steering needed)
function march(e, x, z, dt, sp) {
  const dx = x - e.pos.x, dz = z - e.pos.z, d = Math.hypot(dx, dz);
  // close enough, or held off the exact spot by the men round you for a couple of seconds: carry on
  e.nearT = d < 1.5 ? (e.nearT || 0) + dt : 0;
  if (d < .6 || e.nearT > 2) { e.vel.set(0, 0, 0); e.nearT = 0; return true; }
  const v = Math.min(sp, d/dt); e.vel.set(dx/d*v, 0, dz/d*v); e.pos.x += e.vel.x*dt; e.pos.z += e.vel.z*dt; return false;
}
// soldiers on a long march (out to a rival, or home again); true while marching
function marchSoldier(s, i, dt, C) {
  // four abreast, each soldier with a place of their own in the column
  const ox = ((i % 4) - 1.5)*.75, oz = Math.floor(i / 4)*.75;
  if (C && C.away && C.type === 'land') {
    const elapsed = C.dur - C.t;
    if (C.sail) {
      // to the harbour, aboard, across the sea, ashore on the island
      const S = C.sail;
      if (elapsed < S.board) { if (!s.down) { march(s, -9.2 + (i % 4)*.55, -5.6 + Math.floor(i / 4)*.5, dt, 6); animEntity(s, dt); } return true; }
      if (elapsed < S.board + S.dur) { s.char.g.visible = false; s.pos.set(-9.2, 0, -5.6); return true; }
      if (s.landed !== C.id) { s.landed = C.id; s.char.g.visible = true; s.pos.set(S.land[0] + ox, 0, S.land[1] + oz); }
      return false;
    }
    if (C.t <= 22) return false;
    if (s.marchId !== C.id) { s.marchId = C.id; s.pi = 0; }
    if (s.pi < C.path.length) { const [px, pz] = C.path[s.pi]; if (march(s, px + ox, pz + oz, dt, 6.5)) s.pi++; animEntity(s, dt); s.char.g.rotation.y = s.yaw; return true; }
    return false;
  }
  if (!C && s.ret && s.ret.length) {
    const [px, pz] = s.ret[0]; if (march(s, px + ox, pz + oz, dt, 6.5)) s.ret.shift(); animEntity(s, dt); s.char.g.rotation.y = s.yaw; return true;
  }
  return false;
}
// a troopship to the islands, under sail while the army is aboard
const SAILS = {g:null};
function updAwayWar(dt) {
  const C = W.camp;
  if (C && C.away) { BF.x = C.bf[0]; BF.z = C.bf[1]; }
  if (!(C && C.away && C.sail)) { if (SAILS.g) { scene.remove(SAILS.g); SAILS.g = null; } return; }
  const S = C.sail, u = (C.dur - C.t - S.board) / S.dur;
  if (u < 0 || u > 1) { if (SAILS.g) { scene.remove(SAILS.g); SAILS.g = null; } return; }
  if (!SAILS.g) { SAILS.g = new THREE.Group(); galleon(SAILS.g, SHIPS.troop()); scene.add(SAILS.g); SAILS.curve = new THREE.CatmullRomCurve3(S.pts.map(p => new THREE.Vector3(p[0], -.26, p[1])), false, 'centripetal'); }
  const e = u*u*(3 - 2*u), p = SAILS.curve.getPointAt(e), q = SAILS.curve.getPointAt(Math.min(1, e + .005));
  SAILS.g.position.copy(p); SAILS.g.rotation.y = Math.atan2(q.x - p.x, q.z - p.z);
}
function startBattle(c) {
  enemyCamp = new THREE.Group(); scene.add(enemyCamp);
  for (const [dx, dz] of [[-5, 5.5], [-1.5, 6.5], [2, 5.6], [5, 6.6]]) { const x = BF.x + dx, z = BF.z + dz; mesh(G.cone, 0x7a2a22, [1, 1.5, 1], [x, .75, z], enemyCamp); mesh(G.box, 0x2a1408, [.3, .5, .05], [x, .25, z + .7], enemyCamp); }
  mesh(G.cyl, 0x5e3f22, [.06, 3, .06], [BF.x, 1.5, BF.z + 7.3], enemyCamp);
  enemyCamp.flag = mesh(G.box, 0x9a1a1a, [.9, .55, .03], [BF.x + .47, 2.7, BF.z + 7.3], enemyCamp);
  // a real enemy host that holds the field until the rout (the odds, not this, decide who wins)
  const n = Math.min(18, campNeed(c) + 4), look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, c.army && !c.name ? (W.troop || 0) + 1 : W.conquests)];
  BT.id = (BT.id || 0) + 1;
  for (let i = 0; i < n; i++) {
    const e = entity(look, BF.x - 5.8 + (i % 9)*1.45, BF.z + 2.6 + Math.floor(i / 9)*1.3, 3, 0);
    e.yaw = Math.PI; e.alive = true; e.fall = 0; e.hp = e.maxHp = (5 + W.conquests)*2.4; e.gun = !!look.gun; e.cd = .3 + R(); enemies.push(e);
  }
}
function updBattle(dt) {
  if (!enemies.length) return;
  const BC = W.camp || W.raid, ph = BC ? BC.t : -1, fighting = ph > 9 && ph <= 22;
  // the beaten army breaks: anyone still standing at the end falls
  if (ph >= 0 && ph <= 10.5 && !BT.lose) for (const e of enemies) if (e.alive) knockOut(e);
  if (fighting) BT.snd = Math.max(0, BT.snd - dt);
  const foes = soldiers.filter(s => s.hp > 0 && !s.down && atBattle(s)).concat(CHARGE.riders.filter(r => r.g.visible && atBattle(r)));
  for (const e of enemies) {
    e.vel.set(0, 0, 0);
    if (e.alive && fighting) {
      if (!e.target || e.target.down || e.target.hp <= 0) e.target = nearest(e, foes);
      const t = e.target;
      if (t) {
        const d = Math.hypot(t.pos.x - e.pos.x, t.pos.z - e.pos.z), reach = e.gun ? 6 : .95;
        if (d > reach) { moveTo(e, t.pos.x, t.pos.z, dt); collideFighters(e, enemies); }
        e.yaw = Math.atan2(t.pos.x - e.pos.x, t.pos.z - e.pos.z);
        if ((e.cd -= dt) <= 0 && d <= reach + .1) { e.cd = e.gun ? 1.3 + R()*.8 : .9 + R()*.5; strike(e, t, e.gun && d > 1.2, e.gun && d > 1.2 ? 1 : 1.2); }
      }
    }
    animEntity(e, dt); e.char.g.rotation.y = e.yaw;
    if (e.alive) { if (e.swing > 0) { e.swing -= dt; e.char.armR.rotation.x = -2.4 + (1 - e.swing/.3)*2.2; } else if (fighting) e.char.armR.rotation.x = e.gun ? -1.5 : -.6; }
    poseFall(e, dt);
    healthBar(e);
  }
  if (enemyCamp && ph >= 0 && ph <= 9) enemyCamp.flag.material = mat(0xf2c200);
}
