// ------------------------------------------------------------------ the highway: up a ramp out of downtown, over the railway on pillars, into a tunnel to the next city
const HW = {pts:[[57.5, -54.6, 0], [57.5, -51, 1.6], [56.2, -48.9, 3.2], [51.4, -48.9, 3.4], [47.5, -48.9, 3.2], [43.8, -48.9, 1.7], [40.8, -48.3, .2], [39.2, -47.6, 0]], cars:[], len:0, segs:[], lights:[]};
function hwAt(u, lane) {
  // u runs 0..1 out of the tunnel to downtown on one lane, then back on the other
  let d = (u % 1) * HW.len*2, back = d > HW.len; if (back) d = HW.len*2 - d;
  for (const s of HW.segs) {
    if (d <= s.l) { const t = d / s.l, x = s.a[0] + (s.b[0] - s.a[0])*t, z = s.a[1] + (s.b[1] - s.a[1])*t, h = s.a[2] + (s.b[2] - s.a[2])*t, side = back ? -lane : lane;
      return {x:x + Math.cos(s.yaw)*side, z:z - Math.sin(s.yaw)*side, h, yaw:s.yaw + (back ? Math.PI : 0), pitch:(back ? 1 : -1)*Math.atan2(s.b[2] - s.a[2], s.l)}; }
    d -= s.l;
  }
  const s = HW.segs[HW.segs.length - 1]; return {x:s.b[0], z:s.b[1], h:0, yaw:s.yaw, pitch:0};
}
function highwayFx(anim) {
  clearForest({x0:49, x1:60, z0:-58, z1:-45});
  const g = new THREE.Group(); scene.add(g); HW.g = g;
  const CON = 0xb8b4ac, ASP = 0x3a3d42;
  HW.segs = []; HW.len = 0;
  for (let i = 0; i < HW.pts.length - 1; i++) {
    const a = HW.pts[i], b = HW.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), pitch = Math.atan2(b[2] - a[2], l);
    HW.segs.push({a, b, l, yaw}); HW.len += l;
    // the deck: asphalt on a concrete slab, with barriers and a dashed centre line
    const seg = new THREE.Group(); seg.position.set((a[0] + b[0])/2, (a[2] + b[2])/2, (a[1] + b[1])/2); seg.rotation.order = 'YXZ'; seg.rotation.set(-pitch, yaw, 0); g.add(seg);
    const L = Math.hypot(l, b[2] - a[2]) + .25;
    mesh(G.box, CON, [2.6, .35, L], [0, -.12, 0], seg); mesh(G.box, ASP, [2.2, .04, L], [0, .07, 0], seg);
    for (const s of [-1.22, 1.22]) mesh(G.box, 0xd8d4cc, [.16, .38, L], [s, .24, 0], seg);
    for (let t = -L/2 + .5; t < L/2 - .3; t += 1.1) mesh(G.box, 0xf2c200, [.07, .02, .55], [0, .1, t], seg);
    for (const s of [-.7, .7]) for (let t = -L/2 + .5; t < L/2 - .3; t += 1.1) mesh(G.box, 0xf2f2f2, [.05, .02, .45], [s, .1, t], seg);
    // pillars where the road is up in the air
    for (let t = .25; t < 1; t += .5) {
      const x = a[0] + (b[0] - a[0])*t, z = a[1] + (b[1] - a[1])*t, h = a[2] + (b[2] - a[2])*t;
      if (h < 1.2 || Math.abs(x - RAIL.x) < 1.2) continue;
      mesh(G.box, CON, [.6, h - .3, .6], [x, (h - .3)/2, z], g); mesh(G.box, CON, [2.4, .3, .7], [x, h - .45, z], g).rotation.y = yaw;
    }
  }
  // street lights along the elevated part
  for (let i = 1; i < HW.pts.length - 2; i++) {
    const [x, z, h] = HW.pts[i]; if (h < 1) continue;
    mesh(G.cyl, 0x8a8f96, [.04, 1.6, .04], [x + 1.3, h + .8, z], g, {metalness:.6}); mesh(G.box, 0x8a8f96, [.6, .05, .05], [x + 1.05, h + 1.6, z], g);
    HW.lights.push(bulb(g, x + .8, h + 1.55, z, 0xfff2c8, .09));
  }
  // a big green sign over the road
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('DOWNTOWN ▸', '#1d6b3a', '#ffffff'), toneMapped:false})); sign.scale.set(2, .55, 1); sign.position.set(55, 5.3, -48.9); sign.rotation.y = Math.PI/2; g.add(sign);
  for (const z of [-50.1, -47.7]) mesh(G.box, 0x8a8f96, [.08, 5.6, .08], [55, 2.8, z], g, {metalness:.6});
  mesh(G.box, 0x8a8f96, [.08, .08, 2.6], [55, 5.6, -48.9], g, {metalness:.6});
  // the tunnel to the next city
  mesh(G.cone, 0x7d838a, [5.5, 8.5, 5.5], [57.5, 3.6, -59.5], g, {flatShading:true});
  mesh(G.box, 0x9a958c, [3.4, 3, .9], [57.5, 1.5, -55], g); mesh(G.box, 0x15120f, [2.4, 2.1, .1], [57.5, 1.05, -54.5], g);
  for (const x of [56.6, 58.4]) bulb(g, x, 2.3, -54.4, 0xffd890, .08);
  // cars both ways
  const cols = [0xd9443a, 0x3f7cc0, 0xf2c200, 0xf4f4f4, 0x1e1e22, 0x3f9a6a, 0xb04f86, 0xff8a3a];
  for (let i = 0; i < 8; i++) { const v = vehicle(cols[i], 0, 0, 'car'); v.u = i/8; v.lane = .55; HW.cars.push(v); }
  if (anim) popIn(g);
}
// the interstate runs north-south between the camp and the east districts, up on viaducts over the three cross roads
const IHW_LINKS = [{x0:-51, x1:-39, z0:-40.8, z1:-37.2}, {x0:-51, x1:-39, z0:3.2, z1:6}, {x0:-51, x1:-39, z0:7.8, z1:11.4}];
const IHW = {links:IHW_LINKS, x:-45, z0:-50, z1:93, cross:[-39, 4.6, 9.6], built:false, open:false, cars:[], rect:{x0:-49.4, x1:-40.6, z0:-50, z1:93}, lanes:[-47.8, -46.2, -43.8, -42.2]};
const ihwH = z => IHW.cross.reduce((h, c) => Math.max(h, 3.2*clamp((16 - Math.abs(z - c))/10, 0, 1)), 0);
function interstateFx(anim) {
  if (IHW.built) return; IHW.built = true;
  const g = new THREE.Group(); scene.add(g); IHW.g = g;
  clearForest({x0:-52, x1:-38, z0:IHW.z0 - 4, z1:IHW.z1 + 4});
  const ASP = mat(0x34373c, {roughness:.85}), CON = mat(0xb8b4ac), RAILM = mat(0xc8ccd0, {metalness:.5, roughness:.4});
  const dash = [], step = 2;
  for (let z = IHW.z0; z < IHW.z1; z += step) {
    const h0 = ihwH(z), h1 = ihwH(z + step), seg = new THREE.Group(); seg.position.set(IHW.x, (h0 + h1)/2, z + step/2); seg.rotation.x = -Math.atan2(h1 - h0, step); g.add(seg);
    const L = Math.hypot(step, h1 - h0) + .04;
    mesh(G.box, CON, [9.4, .4, L], [0, -.18, 0], seg).material = CON; mesh(G.box, ASP, [9, .05, L], [0, .04, 0], seg).material = ASP;
    mesh(G.box, CON, [.35, .55, L], [0, .3, 0], seg).material = CON;                                  // the median barrier
    for (const sx of [-4.55, 4.55]) mesh(G.box, RAILM, [.12, .5, L], [sx, .3, 0], seg).material = RAILM;   // guard rails
    for (const lx of [-1.6, 1.6]) if ((z / step) % 2 === 0) dash.push([IHW.x + lx, (h0 + h1)/2 + .075, z + step/2]);
    if (h0 > 1.2 && (z % 4 === 0)) { mesh(G.box, CON, [1, h0 - .3, 1], [IHW.x - 2.4, (h0 - .3)/2, z], g); mesh(G.box, CON, [1, h0 - .3, 1], [IHW.x + 2.4, (h0 - .3)/2, z], g); }
  }
  // lane dashes, one instanced mesh
  const im = new THREE.InstancedMesh(G.box, mat(0xf2f2f2), dash.length), o = new THREE.Object3D();
  dash.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.scale.set(.14, .02, 1.1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); g.add(im);
  // edge lines
  for (const sx of [-4.2, 4.2, -.45, .45]) for (let z = IHW.z0; z < IHW.z1; z += step) { const h0 = ihwH(z), h1 = ihwH(z + step); const e = mesh(G.box, sx < -1 || sx > 1 ? 0xf2f2f2 : 0xf2c200, [.1, .02, step + .04], [IHW.x + sx, (h0 + h1)/2 + .075, z + step/2], g); e.rotation.x = -Math.atan2(h1 - h0, step); }
  // light poles on the median every so often, sign gantries
  for (let z = IHW.z0 + 6; z < IHW.z1; z += 14) { const h = ihwH(z); mesh(G.cyl, 0x8a8f96, [.06, 3.4, .06], [IHW.x, h + 1.9, z], g, {metalness:.6}); for (const sx of [-1, 1]) { mesh(G.box, 0x8a8f96, [1.4, .06, .06], [IHW.x + sx*.7, h + 3.55, z], g); bulb(g, IHW.x + sx*1.35, h + 3.45, z, 0xfff2c8, .1); } }
  for (const [z, txt, col] of [[14, 'EXIT ⛽ GAS', '#1d6b3a'], [-30, 'RANCH · QUARRY', '#1d6b3a'], [100, 'WONDERS · SOUTH', '#1d6b3a'], [-6, 'CAMP ▸', '#1d6b3a']]) {
    const h = ihwH(z); for (const sx of [-4.9, 4.9]) mesh(G.box, 0x8a8f96, [.12, 5.4, .12], [IHW.x + sx, h + 2.7, z], g, {metalness:.6});
    mesh(G.box, 0x8a8f96, [9.9, .14, .14], [IHW.x, h + 5.4, z], g);
    for (const sx of [-2.4, 2.4]) { const sg = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(txt, col, '#ffffff'), toneMapped:false, side:THREE.DoubleSide})); sg.scale.set(3.4, .9, 1); sg.position.set(IHW.x + sx, h + 4.8, z); g.add(sg); }
  }
  // tunnels into the hills at both ends
  for (const [z, dir] of [[IHW.z0, -1], [IHW.z1, 1]]) {
    mesh(G.cone, 0x7d838a, [9, 11, 9], [IHW.x, 4.4, z + dir*6], g, {flatShading:true}); mesh(G.cone, 0x5e7a4a, [9.4, 3, 9.4], [IHW.x, 1, z + dir*6], g, {flatShading:true});
    mesh(G.box, 0x9a958c, [10.4, 3.6, 1], [IHW.x, 1.8, z + dir*.6], g); for (const sx of [-2.3, 2.3]) mesh(G.box, 0x15120f, [3.8, 2.6, .1], [IHW.x + sx, 1.3, z], g);
  }
  // traffic: cars, trucks, vans and pickups in both directions
  const kinds = ['truck', 'pickup', 'van', 'car', 'car', 'car'], cols = [0xd9443a, 0x3f7cc0, 0xf2c200, 0xf4f4f4, 0x1e1e22, 0x3f9a6a, 0xb04f86, 0xff8a3a];
  for (let i = 0; i < 20; i++) {
    const kind = kinds[i % kinds.length], lane = IHW.lanes[i % 4];
    let v;
    if (kind !== 'car' && MODELS.road && MODELS.road.getObjectByName(kind)) { const src = MODELS.road.getObjectByName(kind).clone(true); src.position.set(0, 0, 0); const vg = new THREE.Group(); vg.add(src); vg.scale.setScalar(kind === 'truck' ? .42 : .38); scene.add(vg); v = {g:vg}; }
    else v = vehicle(cols[i % cols.length], 0, 0, 'car');
    v.lane = lane; v.dir = lane > IHW.x ? 1 : -1; v.z = IHW.z0 + R()*(IHW.z1 - IHW.z0); v.sp = (kind === 'truck' ? 6 : 8) + R()*3 + (Math.abs(lane - IHW.x) < 2 ? 2 : 0); v.kind = kind;
    IHW.cars.push(v);
  }
  if (anim) { popIn(g); banner('🛣️ The interstate!', 'Four lanes north to south, up over the cross roads. Drive it in your car, on your motorcycle or with a jetpack.'); }
}
// the gas station by the exit: a corner store that grows into a giant travel stop
const GAS2 = {plot:{x0:-39.5, x1:-18, z0:31, z1:46}, at:[-28.7, 38.5], g:null, lv:0, q:[], t:4, zone:null};
const gasLvl = () => Math.min(5, W.levels.gas || 1);
const gasCost = () => Math.round(30000 * Math.pow(2.6, gasLvl() - 1));
function gasPlotFx() {
  if (GAS2.ready) return; GAS2.ready = true;
  const P0 = GAS2.plot; clearForest({x0:P0.x0 - 1, x1:P0.x1 + 1, z0:P0.z0 - 1, z1:P0.z1 + 1}); clearForest({x0:-30.6, x1:-26.2, z0:10, z1:32});
  slab(0xb98f5c, 2.4, 20.4, -28.4, 21.2, .01);                                 // the access road from the airfield road
  AREAS.push({x0:-29.6, x1:-27.2, z0:10, z1:31.4}, P0);
  // the off-ramp and on-ramp from the southbound lanes
  for (const pts of [[[-42.2, 20], [-40.4, 25], [-38.5, 28.667]], [[-38.5, 32.333], [-40.4, 34], [-42.2, 39]]]) for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], l = Math.hypot(bx - ax, bz - az), r = mesh(G.box, 0x34373c, [2.4, .05, l + .3], [(ax + bx)/2, .02, (az + bz)/2], scene); r.rotation.y = Math.atan2(bx - ax, bz - az);
  }
}
function gasStationLook(anim) {
  const L = gasLvl(); if (L === GAS2.lv || !MODELS.road) return; GAS2.lv = L;
  if (!GAS2.g) { GAS2.g = new THREE.Group(); GAS2.g.position.set(GAS2.at[0], 0, GAS2.at[1]); GAS2.g.rotation.y = Math.PI/2; scene.add(GAS2.g); }
  const src = MODELS.road.getObjectByName('gas' + L); if (!src) return;
  const m = src.clone(true); m.position.set(0, 0, 0); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const bb = new THREE.Box3().setFromObject(m), w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z, sc = Math.min(15 / w, 21 / d, 1);
  GAS2.g.clear(); const holder = new THREE.Group(); holder.scale.setScalar(sc); holder.add(m); GAS2.g.add(holder);
  if (anim) { popIn(GAS2.g); banner(['', '⛽ A corner gas station', '⛽ A canopy over four pumps', '⛽ A modern station', '⛽ A travel center', '⛽ A giant travel stop'][L], `More pumps, more cars pulling in. Level ${L} of 5.`); }
  refreshGasTile();
}
function refreshGasTile() {
  if (!W.unlocked.has('gasStation')) return;
  if (GAS2.zone && gasLvl() >= 5) { removeZone(GAS2.zone); GAS2.zone = null; return; }
  if (gasLvl() >= 5) return;
  if (!GAS2.zone) GAS2.zone = addZone({kind:'gasup', x:-28.4, z:28.6, w:1.6, d:1.6, icon:'⬆️', tile:{}});
  const paid = W.upPaid.gas || 0, cost = gasCost(), key = gasLvl() + ':' + paid;
  if (GAS2.zone.key !== key) { GAS2.zone.key = key; drawTile(GAS2.zone.tc.g, '⬆️', {cost:cost - paid, cur:'💵', prog:paid/cost, title:`⛽ Lv ${gasLvl() + 1}`}); GAS2.zone.tc.t.needsUpdate = true; }
}
function payGas(zn, e) {
  const cost = gasCost(), paid = W.upPaid.gas || 0;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(cost - paid, W.coins, Math.max(1, Math.ceil(cost / 24)));
  W.coins -= amt; W.upSpent += amt; W.upPaid.gas = paid + amt; e.tick = .045; snd(800 + paid/cost*500, .03, 'triangle', .025);
  if (W.upPaid.gas >= cost) { W.upPaid.gas = 0; W.levels.gas = gasLvl() + 1; gasStationLook(true); shakeCam(.25); save(); }
  refreshGasTile();
}
// cars on the interstate: a few pull off at the exit, fill up at a pump and get back on
function updInterstate(dt) {
  if (!IHW.built) return;
  // the road is yours to drive only on wheels or with a jetpack
  const may = [4, 5, 6].includes(W.mount);
  if (may !== IHW.open) { IHW.open = may; const i = AREAS.indexOf(IHW.rect); if (may && i < 0) AREAS.push(IHW.rect, ...IHW.links); if (!may && i >= 0) { AREAS.splice(i, 1); for (const l of IHW.links) { const j = AREAS.indexOf(l); if (j >= 0) AREAS.splice(j, 1); } } }
  const pumps = GAS2.lv ? [2, 4, 6, 8, 10][GAS2.lv - 1] : 0;
  for (const v of IHW.cars) {
    if (v.fuel) {
      const f = v.fuel;
      if (f.wait > 0) { f.wait -= dt; if (f.wait <= 0) { f.i++; } continue; }
      const [tx, tz] = f.path[f.i], dx = tx - v.g.position.x, dz = tz - v.g.position.z, d = Math.hypot(dx, dz);
      if (d < .2) { if (f.i === f.pump) { f.wait = 3.5 + R()*2; const pay = Math.round((60 + 15*W.era) * [1, 1.6, 2.4, 3.4, 5][GAS2.lv - 1]); LEDGER.collecting = true; W.coins += pay; LEDGER.collecting = false; ledgerIncome(pay, '⛽ Oil and fuel'); W.earned += pay; if (R() < .3) popText(`⛽ +${pay}`, v.g.position.clone().setY(2), '#ffe06b'); continue; }
        f.i++; if (f.i >= f.path.length) { v.fuel = null; v.z = v.g.position.z; GAS2.q = GAS2.q.filter(q => q !== v); } continue; }
      const st = Math.min(d, 4*dt); v.g.position.x += dx/d*st; v.g.position.z += dz/d*st; v.g.position.y = 0; v.g.rotation.set(0, Math.atan2(dx, dz), 0); continue;
    }
    const pz = v.z; v.z += v.dir*v.sp*dt;
    if (v.z > IHW.z1) v.z = IHW.z0; if (v.z < IHW.z0) v.z = IHW.z1;
    // take the exit to the pumps when there is room
    if (pumps && v.dir === 1 && v.lane === -42.2 && pz < 23 && v.z >= 23 && GAS2.q.length < pumps && R() < .5) {
      const k = GAS2.q.length, px = GAS2.at[0] - 5 + (k % 5)*2.5, pz = GAS2.at[1] - 2 + Math.floor(k / 5)*3.5;
      v.fuel = {path:[[-40.4, 28], [-38.5, 33], [px, pz - 3], [px, pz], [px, pz + 3], [-38.5, 44], [-40.4, 49], [-42.2, 54]], i:0, pump:3, wait:0}; GAS2.q.push(v); continue;
    }
    const h = ihwH(v.z), h2 = ihwH(v.z + v.dir);
    v.g.position.set(v.lane, h + .06, v.z); v.g.rotation.order = 'YXZ'; v.g.rotation.set(-v.dir*Math.atan2(h2 - h, 1)*(v.dir), v.dir > 0 ? 0 : Math.PI, 0);
    v.g.visible = v.z > IHW.z0 + .5 && v.z < IHW.z1 - .5;
  }
}
let tollT = 15;
function updHighway(dt) {
  updInterstate(dt);
  if (!HW.cars.length) return;
  for (const v of HW.cars) {
    v.u = (v.u + dt * 5 / (HW.len*2)) % 1;
    const p = hwAt(v.u, v.lane);
    v.g.position.set(p.x, p.h + .12, p.z); v.g.rotation.order = 'YXZ'; v.g.rotation.set(p.pitch, p.yaw, 0);
    // hidden while inside the tunnel
    v.g.visible = Math.hypot(p.x - 57.5, p.z + 54.6) > .6;
  }
  if (started && (tollT -= dt) <= 0) { tollT = 15; const pay = 300 + 60*W.era; W.coins += pay; W.earned += pay; popText(`🛣️ +${pay} tolls`, new THREE.Vector3(51.4, 5, -48.9), '#ffe06b'); }
}

