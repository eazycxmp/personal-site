// ------------------------------------------------------------------ war in the air
// the enemy holds a mountain range to the east: ridges, snowy peaks and pine forest, with fortresses in two valleys
const AIR_TARGETS = [[84, -20], [86, 13]];
const TERR = {x0:67, x1:112, z0:-46, z1:40};
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t*t*(3 - 2*t); };
function terrainH(x, z) {
  let h = 4.4 + 3.4*Math.sin(x*.21 + 1.3)*Math.cos(z*.17) + 2.3*Math.sin(x*.47 + z*.31) + 1.3*Math.sin(z*.6 + x*.13)*Math.sin(x*.9) + .5*Math.sin(x*1.7 + z*1.3);
  h += Math.max(0, x - 92) * .22;
  for (const [tx, tz] of AIR_TARGETS) h *= smooth(6.5, 13, Math.hypot(x - tx, z - tz));
  h *= smooth(2.6, 8, Math.abs(z - 1.9));
  for (const r of [ZOOPARK, ZOOPARK.path]) { const dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1); h *= smooth(1, 7, Math.hypot(dx, dz)); }
  h *= smooth(TERR.x0, TERR.x0 + 6, x);
  return Math.max(0, h);
}
{
  const W0 = TERR.x1 - TERR.x0, D0 = TERR.z1 - TERR.z0, geo = new THREE.PlaneGeometry(W0, D0, MOBILE ? 60 : 110, MOBILE ? 115 : 210);
  geo.rotateX(-Math.PI/2); geo.translate((TERR.x0 + TERR.x1)/2, 0, (TERR.z0 + TERR.z1)/2);
  const p = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = terrainH(x, z), slope = Math.abs(terrainH(x + .4, z) - h) + Math.abs(terrainH(x, z + .4) - h);
    p.setY(i, h - .3);
    if (h > 7.4) c.setHex(0xf2f6f8); else if (h > 5.6 || slope > .9) c.setHex(h > 6.6 ? 0xc8ccd0 : 0x8a8478); else if (h > 2.4) c.setHex(0x4a7a3a); else if (h > .3) c.setHex(0x6a9a42); else c.setHex(0x8a9a5a);
    c.offsetHSL(0, 0, (Math.sin(x*3.1) * Math.cos(z*2.7)) * .03);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const terr = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors:true, roughness:.95, flatShading:true}));
  terr.receiveShadow = true; terr.castShadow = true; scene.add(terr);
  // pines on the lower slopes
  const spots = []; seed = 202;
  for (let n = 0; n < 6000 && spots.length < (MOBILE ? 260 : 620); n++) {
    const x = TERR.x0 + 4 + rnd()*(W0 - 6), z = TERR.z0 + 2 + rnd()*(D0 - 4), h = terrainH(x, z);
    if (h > .5 && h < 5 && AIR_TARGETS.every(([tx, tz]) => Math.hypot(x - tx, z - tz) > 11.5)) spots.push([x, h - .3, z, .7 + rnd()*.6]);
  }
  const tr = new THREE.InstancedMesh(G.cone, mat(0x2f6a32), spots.length), o = new THREE.Object3D();
  spots.forEach(([x, y, z, s], i) => { o.position.set(x, y + .9*s, z); o.scale.set(.55*s, 1.9*s, .55*s); o.updateMatrix(); tr.setMatrixAt(i, o.matrix); });
  tr.castShadow = true; scene.add(tr);
  // a lake in a hollow between the two valleys
  const lake = new THREE.Mesh(new THREE.CircleGeometry(4, 24), mat(0x2a7ab0, {roughness:.08, metalness:.2})); lake.rotation.x = -Math.PI/2; lake.position.set(77, .05, -9); scene.add(lake);
}
for (const [x, z] of AIR_TARGETS) slab(0x8a7a5a, 12, 12, x, z, 0);
const forts = {};
function fortress(ti, captured) {
  if (forts[ti]) return forts[ti];
  const [x, z] = AIR_TARGETS[ti], g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (const [a, b, w, d] of [[0, -3, 6.4, .5], [0, 3, 6.4, .5], [-3, 0, .5, 6.4], [3, 0, .5, 6.4]]) mesh(G.box, 0x8a7a6a, [w, 1.6, d], [a, .8, b], g);
  const towers = [];
  for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    const t = new THREE.Group(); t.position.set(a, 0, b); g.add(t);
    mesh(G.cyl, 0x7a6a5a, [.75, 3, .75], [0, 1.5, 0], t); mesh(G.cone, 0x5a2a2a, [.95, 1.1, .95], [0, 3.55, 0], t); towers.push(t);
  }
  mesh(G.box, 0x6a5a4a, [2.4, 2.6, 2.4], [0, 1.3, 0], g);
  mesh(G.cyl, 0x3a2a1a, [.05, 2.4, .05], [0, 3.8, 0], g);
  const flag = mesh(G.box, captured ? 0xf2c200 : 0x9a1a1a, [.9, .5, .03], [.47, 4.6, 0], g);
  const f = forts[ti] = {g, towers, flag, hits:0, troops:[], aa:[]};
  if (!captured) {
    // a garrison and two anti-aircraft guns
    for (const [a, b] of [[-1.8, 1.8], [1.8, -1.8]]) {
      const t = new THREE.Group(); t.position.set(x + a, 0, z + b); scene.add(t);
      mesh(G.cyl, 0x5a5e56, [.45, .35, .45], [0, .17, 0], t); const head = new THREE.Group(); head.position.y = .45; t.add(head);
      mesh(G.box, 0x4a5238, [.5, .3, .5], [0, 0, 0], head); for (const s of [-.1, .1]) mesh(G.cyl, 0x2a2a2e, [.04, 1, .04], [s, .2, .45], head, {metalness:.6}).rotation.x = Math.PI/2 - .9;
      f.aa.push({t, head, cd:R()});
    }
    const look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, W.conquests)];
    for (let i = 0; i < 12; i++) {
      const c = makeChar(look), a = R()*Math.PI*2, r = 3.6 + R()*2.4;
      const tp = {c, x:x + Math.cos(a)*r, z:z + Math.sin(a)*r, tx:0, tz:0, t:0, down:false, fall:0};
      tp.tx = tp.x; tp.tz = tp.z; c.g.position.set(tp.x, 0, tp.z); f.troops.push(tp);
    }
  }
  return f;
}
const planes = [];
const RUNWAY = {x:-32, z0:10, z1:-12};
// the military airbase, south-east of the army base: the fighters take off and land here
const AIRBASE = {rect:{x0:70, x1:96.4, z0:84.2, z1:110}, rw:{x:93.6, z0:106, z1:86}, built:false};
function makePlane(x, z) {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; scene.add(g);
  // the same jet fighter that scrambles against the kaiju, parked or flying
  const jet = model('fighter', 4.2, 'x');
  if (jet) {
    jet.position.y = .15; g.add(jet);
    g.position.set(x, 0, z); g.rotation.y = Math.PI;
    const p = {g, prop:new THREE.Group(), park:[x, z], bombT:0}; planes.push(p); return p;
  }
  const body = new THREE.Group(); body.position.y = .62; g.add(body);
  mesh(G.cyl, 0x6b7d3a, [.32, 3, .32], [0, 0, 0], body).rotation.x = Math.PI/2;
  mesh(G.cone, 0x5a6a30, [.32, .5, .32], [0, 0, 1.75], body).rotation.x = Math.PI/2;
  mesh(G.box, 0x6b7d3a, [4.4, .08, .85], [0, .02, .25], body);
  for (const sx of [-1.5, 1.5]) mesh(G.cyl, 0xffffff, [.2, .02, .2], [sx, .07, .25], body);
  mesh(G.box, 0x6b7d3a, [1.5, .06, .5], [0, .08, -1.3], body); mesh(G.box, 0x6b7d3a, [.06, .7, .55], [0, .4, -1.3], body);
  mesh(G.sph, 0x8fd0ff, [.24, .18, .4], [0, .28, .35], body, {metalness:.4, roughness:.1});
  const prop = new THREE.Group(); prop.position.set(0, 0, 2.02); body.add(prop);
  mesh(G.box, 0x2a2a2a, [.09, 1.3, .04], [0, 0, 0], prop); mesh(G.box, 0x2a2a2a, [1.3, .09, .04], [0, 0, 0], prop);
  for (const sx of [-.5, .5]) mesh(G.cyl, 0x1a1a1a, [.15, .1, .15], [sx, -.42, .5], body).rotation.z = Math.PI/2;
  g.position.set(x, 0, z); g.rotation.y = Math.PI;
  const n = planes.length;
  // a pilot's style: orbit radius, circling direction, cruising height, timing, how much they weave, and whether they roll
  const style = planeStyle(n);
  const p = {g, prop, park:[x, z], bombT:0, rw:x > 0 ? AIRBASE.rw : RUNWAY, style}; planes.push(p); airbaseFx(); return p;
}
// taxi, take off, climb over the ridges, dive-bomb the valley in passes, pull up, fly home and land
// fly like an aircraft: the drawn plane follows its flight path smoothly (no corners where one leg meets the next), points
// where it is going, pitches with its climb and dive, and banks into each turn by how hard it is turning
function flyPose(p, a, b, dt, roll = 0) {
  const g = p.g, air = a[1] > .05;
  // (smoothed on the ground too, so touching down and rolling out carry on from the flight without a jump; parked, it sits exactly)
  const parked = !air && Math.hypot(a[0] - b[0], a[2] - b[2]) < 1e-4 && (!p.fly || Math.hypot(a[0] - p.fly.x, a[2] - p.fly.z) < .05);
  if (!p.fly || parked || Math.hypot(a[0] - p.fly.x, a[2] - p.fly.z) > 14) p.fly = {x:a[0], y:a[1], z:a[2], yaw:p.fly ? p.fly.yaw : g.rotation.y, bank:0, pitch:0};
  const F = p.fly, k = 1 - Math.exp(-dt*5), px = F.x, py = F.y, pz = F.z;
  F.x += (a[0] - F.x)*k; F.y += (a[1] - F.y)*k; F.z += (a[2] - F.z)*k;
  let vx = F.x - px, vy = F.y - py, vz = F.z - pz;
  if (!air && Math.hypot(vx, vz) < 1e-3) { vx = b[0] - a[0]; vy = 0; vz = b[2] - a[2]; }
  const vh = Math.hypot(vx, vz);
  if (vh > 1e-5) {
    let dy = Math.atan2(vx, vz) - F.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (air) dy = clamp(dy, -2.4*dt, 2.4*dt);   // no aircraft turns faster than this
    F.yaw += dy;
    const rate = dt > 0 ? dy/dt : 0, want = air ? clamp(-rate*.6, -1.2, 1.2) : 0;
    F.bank += (want - F.bank)*Math.min(1, dt*4); F.pitch += (-Math.atan2(vy, vh) - F.pitch)*Math.min(1, dt*6);
  } else if (!air) { F.bank *= .8; }
  g.position.set(F.x, F.y, F.z); g.rotation.order = 'YXZ'; g.rotation.set(F.pitch, F.yaw, F.bank + roll);
}
// a pilot's style: run length, which way they turn, cruising height, timing, how much they weave, and whether they roll
const planeStyle = n => ({r:7.5 + (n % 3)*1.8, dir:n % 2 ? -1 : 1, alt:8 + (n % 4)*1.1, ph:n*1.3, weave:n % 3 === 1 ? 4 : n % 3 === 2 ? 2 : 0, sp:.9 + (n % 3)*.12, roll:n % 2 === 0});
function airPos(e, p, tx, tz) {
  const L = (a, b, u) => a + (b - a)*Math.max(0, Math.min(1, u));
  // the runway beside where it is parked (planes rebuilt from a save don't carry theirs): the airbase's out east, else the airport's
  const [px, pz] = p.park, RW = p.rw || (px > 30 && AIRBASE.rw ? AIRBASE.rw : RUNWAY);
  if (e < 0) return [px, 0, pz];
  if (e < 4) { const u = e/4; return [L(px, RW.x, u), 0, L(pz, RW.z0, u)]; }
  if (e < 9) { const u = (e - 4)/5; return [RW.x, u > .45 ? (u - .45)/.55*5 : 0, L(RW.z0, RW.z1, u)]; }
  // each pilot flies their own way: a weave on the way in, their own orbit (size, direction, height) and dive rhythm
  const S = p.style ||= planeStyle(Math.max(0, planes.indexOf(p)));   // planes rebuilt from a save get theirs back
  // attack runs on a racetrack: a straight run across the target (diving through the middle, then pulling up), a banked
  // half-circle out, a straight leg back up high, a half-circle in, and round again; each pilot crosses at their own angle
  // the first run carries straight on from the approach (no turning back on itself), each pilot a little off the line
  const ang = Math.atan2(tz - RW.z1, tx - RW.x) + (S.ph % 1.2 - .6)*.5, ux = Math.cos(ang), uz = Math.sin(ang), vx = -uz*S.dir, vz = ux*S.dir, Rr = S.r, rho = S.r*.55;
  const legL = 2*Rr, arc = Math.PI*rho, lap = 2*legL + 2*arc, speed = 8.5*S.sp;
  const oval = k => {
    let d = (k*speed) % lap;
    if (d < legL) { const bell = Math.pow(Math.sin(d/legL*Math.PI), 2); return [tx - ux*Rr + ux*d, S.alt - (S.alt - 5.2)*bell, tz - uz*Rr + uz*d]; }   // pulling out of the dive well above the fighting
    if ((d -= legL) < arc) { const a = d/rho, cx = tx + ux*Rr + vx*rho, cz = tz + uz*Rr + vz*rho; return [cx - vx*rho*Math.cos(a) + ux*rho*Math.sin(a), S.alt, cz - vz*rho*Math.cos(a) + uz*rho*Math.sin(a)]; }
    if ((d -= arc) < legL) return [tx + ux*Rr + 2*rho*vx - ux*d, S.alt, tz + uz*Rr + 2*rho*vz - uz*d];
    d -= legL; const a = d/rho, cx = tx - ux*Rr + vx*rho, cz = tz - uz*Rr + vz*rho;
    return [cx + vx*rho*Math.cos(a) - ux*rho*Math.sin(a), S.alt, cz + vz*rho*Math.cos(a) - uz*rho*Math.sin(a)];
  };
  const [ox0, , oz0] = oval(0);
  if (e < 17) { const u = (e - 9)/8, w = Math.sin(u*Math.PI*2.5 + S.ph)*S.weave*(1 - u); return [L(RW.x, ox0, u) + w, 5 + (S.alt - 2)*Math.sin(Math.min(1, u*1.6)*Math.PI/2) - (u > .75 ? (u - .75)/.25*3 : 0), L(RW.z1, oz0, u) + w*.4]; }
  if (e < 29) return oval(e - 17);
  const [ex, , ez] = oval(12);
  if (e < 36) { const u = (e - 29)/7; return [L(ex, RW.x, u), 9 + 3*Math.sin(u*Math.PI) - 4*u, L(ez, RW.z1 - 8, u)]; }
  if (e < 40) { const u = (e - 36)/4; return [RW.x, 5*(1 - u)*(1 - u), L(RW.z1 - 8, RW.z0 - 2, u)]; }
  const u = (e - 40)/2; return [L(RW.x, px, u), 0, L(RW.z0 - 2, pz, u)];
}
function airbaseFx() {
  if (AIRBASE.built) return; AIRBASE.built = true;
  const r = AIRBASE.rect, rw = AIRBASE.rw, g = new THREE.Group(); scene.add(g); AIRBASE.g = g;
  clearForest({x0:r.x0, x1:r.x1, z0:r.z0, z1:r.z1});
  slab(0x9a9a92, r.x1 - r.x0, r.z1 - r.z0, (r.x0 + r.x1)/2, (r.z0 + r.z1)/2, .004);
  slab(0x3e4248, 3.6, 24, rw.x, 96, .008);
  for (let z = 85.5; z <= 106.5; z += 2.2) slab(0xf4f4f4, .22, 1.1, rw.x, z, .012);
  for (const z of [84.9, 107.1]) for (let k = -1; k <= 1; k++) slab(0xf4f4f4, .18, .9, rw.x + k*.6, z, .012);
  slab(0x55595f, 9, 1.4, 88, 96, .01);   // the taxiway to the runway
  // two arched hangars, a control tower, a fuel tank and the airbase's flag
  for (const z of [89, 99]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 6, 18, 1, false, 0, Math.PI), mat(0x6a7058, {roughness:.6, metalness:.3}));
    h.rotation.z = Math.PI/2; h.rotation.y = Math.PI/2; h.position.set(19.6, 0, z); h.castShadow = true; g.add(h);
    mesh(G.box, 0x2a2e26, [.1, 2.2, 3.6], [22.62, 1.1, z], g);
    boxes.push({x0:70.6, x1:76.7, z0:z - 2.7, z1:z + 2.7});
  }
  mesh(G.box, 0xd8d4cc, [1.6, 5, 1.6], [91, 2.5, 108], g); mesh(G.box, 0x3a6a8a, [2.4, 1.2, 2.4], [91, 5.6, 108], g, {metalness:.5, roughness:.15}); mesh(G.box, 0xd8d4cc, [2.6, .2, 2.6], [91, 6.3, 108], g);
  bulb(g, 91, 6.6, 108, 0xff3a2a, .12); boxes.push({x0:89.9, x1:92.1, z0:106.9, z1:109.1});
  mesh(G.cyl, 0xc8ccd0, [1.1, 2, 1.1], [72.4, 1, 106.6], g, {metalness:.4}); circles.push({x:72.4, z:106.6, r:1.2});
  mesh(G.cyl, 0x5e3f22, [.05, 3.6, .05], [71, 1.8, 85.2], g); mesh(G.box, 0xf2c200, [1, .6, .03], [71.52, 3.3, 85.2], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('AIRBASE', '#3a4a2a', '#ffffff'), toneMapped:false, side:THREE.DoubleSide}));
  sign.scale.set(2.2, .6, 1); sign.position.set(83, 2, 84.4); g.add(sign); for (const x of [81.9, 84.1]) mesh(G.cyl, 0x5e3f22, [.05, 2.3, .05], [x, 1.15, 84.4], g);
  AREAS.push({x0:r.x0, x1:rw.x - 2, z0:r.z0, z1:r.z1}, {x0:13, x1:r.x0 + .5, z0:84.5, z1:95});
}
function startAir(c) { fortress(c.target, false); }
function planeVsBoss(p, i, B, dt) {
  // out: taxi, take off, fly to it, then circle with dives for as long as it fights; home: fly back and land
  let e, tx, tz;
  if (B) { p.bossBack = null; p.bossT = (p.bossT || 0) + dt; e = p.bossT*1.5 - i*.7; tx = B.x; tz = B.z; if (e > 17) e = 17 + ((e - 17) % 11.5); p.bossAt = [tx, tz]; }
  else { if (p.bossBack == null) { p.bossBack = 0; if ((p.bossT || 0)*1.5 - i*.7 < 4) { p.bossBack = 13; } } p.bossBack += dt*1.5; e = 29 + p.bossBack; [tx, tz] = p.bossAt || [p.park[0], p.park[1]]; if (e >= 42) { p.bossBack = null; p.bossT = 0; e = -1; } }
  const a = e >= 0 ? airPos(e, p, tx, tz) : [p.park[0], 0, p.park[1]], b = e >= 0 ? airPos(e + .08, p, tx, tz) : a;
  p.alt = a[1]; flyPose(p, a, b, dt);
  p.prop.rotation.z += dt*(e > 0 && e < 42 ? 40 : 0);
  // over an enemy army: bombs at the bottom of each dive
  if (B && B.foes && e > 17 && e < 29 && a[1] < 5.5 && (p.bombT = (p.bombT || 0) - dt) <= 0) {
    p.bombT = .45; const f = B.foes[R()*B.foes.length|0]; if (!f) return;
    const to = new THREE.Vector3(f.pos.x + (R() - .5)*2, 0, f.pos.z + (R() - .5)*2), bomb = new THREE.Mesh(G.sph, mat(0x2a2a2e)); bomb.scale.set(.12, .2, .12); bomb.position.set(a[0], a[1] - .3, a[2]); scene.add(bomb);
    flyers.push({m:bomb, from:bomb.position.clone(), to, t:0, dur:.6, arc:0, done:() => warHit(to, 2.6, 5, true)});
  }
}
// planes sent alongside the army, the cavalry or the navy: they take off as the battle starts and time their dives to the
// fight (on the field, or the fort the fleet is shelling), then fly home and land after it is over
const AIRS = {id:null, on:false, t0:0, tx:0, tz:0, n:0};
function airSupport(C) {
  if (!C || C.type === 'air' || !(C.br || []).includes('air') || !planesBuilt()) return;
  C.id ||= Math.random(); if (AIRS.id === C.id) return;
  // on the field, at the fort the fleet shells, or over the rival fleet off their coast
  const N = C.naval, start = C.type === 'land' ? 22 : N ? N.fight + 4 : C.dur - 21, fort = C.type === 'sea' && COAST.cur ? COAST.cur.g.position : null;
  const [tx, tz] = N ? N.anchor : fort ? [fort.x, fort.z] : [BF.x, BF.z + 4];
  Object.assign(AIRS, {id:C.id, on:true, t0:time - (17 + start - C.dur), tx, tz, n:planesBuilt()});
}
function updAir(dt) {
  if (HANGAR.g && ((HANGAR.chk = (HANGAR.chk || 0) - dt) <= 0)) { HANGAR.chk = 2; hangarLook(true); }
  const C = W.camp, airT = C && C.type === 'air';
  airSupport(C);
  if (AIRS.on && time - AIRS.t0 > 44 + .7*AIRS.n) AIRS.on = false;   // once the last one in line has landed
  const air = airT || AIRS.on;
  const c0 = airT ? CAMPAIGNS[C.ci] : null, f0 = c0 && c0.target != null && C.goal === 'air' ? forts[c0.target] : null;
  const B0 = typeof WARFIRE !== 'undefined' ? sortieTarget() : null;
  planes.forEach((p, i) => {
    if (!air && (B0 || p.bossBack != null)) { planeVsBoss(p, i, B0, dt); return; }
    const c = c0, e = airT ? C.dur - C.t - i*.7 : AIRS.on ? time - AIRS.t0 - i*.7 : -1;
    const [tx, tz] = airT ? (C.tx != null ? [C.tx, C.tz] : c ? AIR_TARGETS[c.target] : [0, 0]) : [AIRS.tx, AIRS.tz];
    const flying = air && i < (airT ? C.n ?? (c ? c.planes : 0) : AIRS.n);
    const a = flying ? airPos(e, p, tx, tz) : [p.park[0], 0, p.park[1]], b = flying ? airPos(e + .08, p, tx, tz) : a;
    // banked by the turn itself, and a barrel roll on the way in for the show-offs
    const S = p.style || {dir:1};
    p.alt = a[1]; flyPose(p, a, b, dt, flying && S.roll && e > 11 && e < 12.6 ? (e - 11)/1.6*Math.PI*2 : 0);
    p.prop.rotation.z += dt * (flying && e > 0 && e < 42 ? 40 : 0);
    // bombs go only at the bottom of each dive
    if (flying && e > 17 && e < 28.5 && a[1] < 5 && (p.bombT -= dt) <= 0) {
      p.bombT = .22;
      const f = c && c.target != null && C && C.goal === 'air' ? forts[c.target] : null, bomb = new THREE.Mesh(G.sph, ballMat); bomb.scale.set(.12, .2, .12); bomb.position.set(a[0], a[1] - .3, a[2]); scene.add(bomb);
      const gx = a[0]*.35 + tx*.65 + (R() - .5)*4, gz = a[2]*.35 + tz*.65 + (R() - .5)*4;
      flyers.push({m:bomb, from:bomb.position.clone(), to:new THREE.Vector3(gx, 0, gz), t:0, dur:.7, arc:0, done:() => {
        for (let k = 0; k < 16; k++) particle([0xffd040, 0xff7a2a, 0x555555][k % 3], new THREE.Vector3(gx, .4, gz), new THREE.Vector3((R() - .5)*6, 2 + R()*4, (R() - .5)*6), .9, .3, {grow:.6, op:.85});
        snd(55 + R()*30, .5, 'sawtooth', .06, .4);
        if (watchingWar()) shakeCam(.35);
        // the blast knocks down enemy soldiers caught near it
        for (const en of enemies) if (en.alive && Math.hypot(en.pos.x - gx, en.pos.z - gz) < 2.6) { en.hp -= 4; en.hit = .18; if (en.hp <= 0) knockOut(en); }
        if (f) {
          f.hits++; const t = f.towers[Math.min(3, Math.floor(f.hits / 6))]; if (f.hits % 6 === 0 && t) t.rotation.z = .9;
          for (const tp of f.troops) if (!tp.down && Math.hypot(tp.x - gx, tp.z - gz) < 2.4) tp.down = true;
        }
      }});
    }
  });
  if (!f0) return;
  // the garrison runs for cover and the guns fire back at the planes
  const lead = planes.find(p => (p.alt || 0) > 2);
  for (const tp of f0.troops) {
    const ch = tp.c;
    if (tp.down) { tp.fall = Math.min(1, tp.fall + dt*3); ch.g.rotation.x = -tp.fall*Math.PI/2; continue; }
    if ((tp.t -= dt) <= 0 || Math.hypot(tp.tx - tp.x, tp.tz - tp.z) < .2) { const [x, z] = AIR_TARGETS[c0.target], a = R()*Math.PI*2, r = 3.4 + R()*3; tp.tx = x + Math.cos(a)*r; tp.tz = z + Math.sin(a)*r; tp.t = 2 + R()*2; }
    const dx = tp.tx - tp.x, dz = tp.tz - tp.z, d = Math.hypot(dx, dz), sp = lead ? 2.6 : .8;
    if (d > .05) { tp.x += dx/d*Math.min(d, sp*dt); tp.z += dz/d*Math.min(d, sp*dt); ch.g.rotation.y = Math.atan2(dx, dz); }
    const s = Math.sin(time*(lead ? 14 : 6) + tp.tx); ch.legL.rotation.x = s*.7; ch.legR.rotation.x = -s*.7; ch.armL.rotation.x = -s*.5; ch.armR.rotation.x = lead ? -2.4 : s*.5;
    ch.g.position.set(tp.x, Math.abs(s)*.05, tp.z);
  }
  for (const g of f0.aa) {
    if (!lead) continue;
    const dx = lead.g.position.x - g.t.position.x, dz = lead.g.position.z - g.t.position.z;
    g.head.rotation.y = Math.atan2(dx, dz);
    if ((g.cd -= dt) <= 0) {
      g.cd = .25 + R()*.25;
      const from = g.t.position.clone().setY(1), to = lead.g.position.clone().add(new THREE.Vector3((R() - .5)*4, (R() - .3)*3, (R() - .5)*4));
      const b = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0xffc060, toneMapped:false})); b.scale.setScalar(.07); b.position.copy(from); scene.add(b);
      flyers.push({m:b, from, to, t:0, dur:.45, done:() => { if (R() < .5) particle(0x3a3a3a, to, new THREE.Vector3(0, .3, 0), 1.2, .45, {grow:.8, op:.7}); }});
      if (watchingWar() && R() < .3) snd(90, .05, 'square', .02);
    }
  }
}
function endAir(c) {
  const f = forts[c.target];
  if (f) { for (const tp of f.troops) scene.remove(tp.c.g); for (const g of f.aa) scene.remove(g.t); f.troops = []; f.aa = []; }
  fortress(c.target, true).flag.material = mat(0xf2c200);
}
function airfieldFx() {
  slab(0x4a4f57, 3.4, 27, RUNWAY.x, -1, .004);
  for (let z = -12; z <= 11; z += 2.2) slab(0xf4f4f4, .22, 1.1, RUNWAY.x, z, .008);
  slab(0x5a5f67, 6, 1.4, -28.5, -1, .006);
  // the bridge over the river
  const g = new THREE.Group(); scene.add(g);
  mesh(G.box, 0x9a958c, [7.6, .22, 1.6], [-13.95, -.06, 9.6], g);
  for (const x of [-12.2, -15.6]) mesh(G.cyl, 0x8a857c, [.4, 1.2, .4], [x, -.6, 9.6], g);
  for (let x = -17.5; x <= -10.4; x += .9) for (const z of [8.85, 10.35]) mesh(G.box, 0xdcd6cc, [.12, .55, .12], [x, .28, z], g);
  for (const z of [8.85, 10.35]) mesh(G.box, 0xdcd6cc, [7.4, .08, .1], [-13.95, .55, z], g);
  // control tower
  const t = new THREE.Group(); t.position.set(-25.6, 0, 6); scene.add(t);
  mesh(G.box, 0xdfe2e6, [1.4, 3.6, 1.4], [0, 1.8, 0], t); mesh(G.box, 0x8fc6e8, [1.9, .9, 1.9], [0, 4, 0], t, {metalness:.5, roughness:.15}); mesh(G.box, 0xf4f4f4, [2.1, .15, 2.1], [0, 4.5, 0], t);
  boxes.push({x0:-26.3, x1:-24.9, z0:5.3, z1:6.7});
}
const HANGAR = {tier:0, g:null};
const hangarTier = () => planesBuilt() >= 5 || W.era >= 9 ? 3 : planesBuilt() >= 3 || W.era >= 6 ? 2 : 1;
function hangarLook(anim) {
  const t = hangarTier(), m = kit2('hangar' + t, [0, 5.2, 5.8, 6.4][t]); if (!m || t === HANGAR.tier) return;
  if (HANGAR.g) { HANGAR.g.clear(); HANGAR.g.add(m); HANGAR.tier = t; if (anim) { popIn(HANGAR.g); banner(['', '', '🛩️ A bigger hangar', '✨ A glass-and-steel hangar'][t], 'Room for your growing air force.'); } }
}
// the fighters' hangar stands at the military airbase, where they take off (not at the airport)
const HANGAR_AT = [72.5, 107.5];
function hangar(anim) {
  if (MODELS.b2) {
    const g = HANGAR.g = new THREE.Group(); g.position.set(HANGAR_AT[0], 0, HANGAR_AT[1]); scene.add(g); HANGAR.tier = 0; hangarLook(false);
    boxes.push({x0:HANGAR_AT[0] - 2.4, x1:HANGAR_AT[0] + 2.4, z0:HANGAR_AT[1] - 2.3, z1:HANGAR_AT[1] + 2.3}); if (anim) popIn(g); return;
  }
  const g = new THREE.Group(); g.position.set(HANGAR_AT[0], 0, HANGAR_AT[1]); scene.add(g);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4.6, 16, 1, false, 0, Math.PI), mat(0x9aa0a8, {metalness:.4, roughness:.4}));
  roof.rotation.z = Math.PI/2; roof.rotation.y = Math.PI/2; roof.position.y = 0; g.add(roof); roof.castShadow = true;
  mesh(G.box, 0x2a2e36, [3.6, 2.1, .1], [0, 1.05, 2.3], g);
  boxes.push({x0:HANGAR_AT[0] - 2.4, x1:HANGAR_AT[0] + 2.4, z0:HANGAR_AT[1] - 2.3, z1:HANGAR_AT[1] + 2.3});
  fader(g, 5, 2.6);
  if (anim) popIn(g);
}
const WATCH = {on:false};
const watchingWar = () => (W.camp && ((player.zone && player.zone.kind === 'war') || WATCH.on)) || ((W.raid || (typeof INV !== 'undefined' && INV.on)) && WATCH.on);
function setWatch(v) {
  WATCH.on = !!v && !!(W.camp || W.raid || INV.on); updWatchBtn();
  if (WATCH.on) note(W.raid && !W.camp ? '🎥 Watching the enemy army' : '🎥 Following your forces', 'Walk, tap 🎥 or press F to come back.');
}
function updWatchBtn() {
  const b = $('bWatch'); if (!b) return;
  const war = !!(W.camp || W.raid || INV.on); if (!war && WATCH.on) WATCH.on = false;
  b.hidden = !war || TRIP.on; b.textContent = WATCH.on ? '🎥 Back to you' : W.raid && !W.camp ? '🎥 Watch the enemy' : '🎥 Follow the army';
}
function warFocus() {
  if (LEAD.on) return [player.pos.x, player.pos.z + 1.5];
  const C = W.camp;
  const mid = list => { const a = list.filter(e => !e.down && (e.alive !== false)); if (!a.length) return null; let x = 0, z = 0; for (const e of a) { x += e.pos.x; z += e.pos.z; } return [x/a.length, z/a.length]; };
  if (!C && INV.on && INV.units.length) { const m = mid(INV.units); if (m) return [m[0], m[1] + 1.5]; }
  if (!C) { const m = mid(enemies) || mid(soldiers); return m ? [m[0], m[1] + 1.5] : [player.pos.x, player.pos.z]; }
  if (C.type === 'land') { if (C.sail && SAILS.g) return [SAILS.g.position.x, SAILS.g.position.z]; const m = mid(soldiers.filter(q => q.char.g.visible)); return m && C.t > 9 ? [m[0], m[1] + 1.5] : [BF.x - 1, BF.z + 1.5]; }
  if (C.type === 'sea' && C.naval) { const fl = fleet(); if (fl.length) { let x = 0, z = 0; for (const b of fl) { x += b.g.position.x; z += b.g.position.z; } return [x/fl.length, z/fl.length]; } }
  if (C.type === 'sea') { const fl = fleet().map(b => b.g ? b.g.position : b).filter(q => q.z > -81); if (fl.length) { let x = 0, z = 0; for (const q of fl) { x += q.x; z += q.z; } return [x/fl.length, z/fl.length]; } const f = COAST.cur; return f ? [f.g.position.x - 3, -94] : [-13.6, -68]; }
  const c = CAMPAIGNS[C.ci], [tx, tz] = C.tx != null ? [C.tx, C.tz] : AIR_TARGETS[c.target], e = C.dur - C.t;
  const lead = planes[0]; return lead && (lead.alt || 0) > .5 ? [lead.g.position.x, lead.g.position.z, lead.g.position.y*.8] : [tx, tz, 0];
}

