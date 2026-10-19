// ------------------------------------------------------------------ oil: once the stone is no longer needed, the quarry becomes an oil field and refinery
const OIL = {jacks:[], flare:null, t:{well:20}, car:null, men:[]};
const REFINERY = {x0:-8.7, x1:-2.4, z0:-43.4, z1:-38.6};
const oilReady = () => PADS.every(p => p.cur !== 'stone' || W.unlocked.has(p.id));
function pipeline(pts, parent, y = 2.3) {
  // overhead pipes on tall stands: you can walk underneath
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], l = Math.hypot(bx - ax, bz - az);
    const p = mesh(G.cyl, 0x9aa0a8, [.14, l, .14], [(ax + bx)/2, y, (az + bz)/2], parent, {metalness:.7, roughness:.3});
    p.rotation.order = 'YXZ'; p.rotation.set(Math.PI/2, Math.atan2(bx - ax, bz - az), 0);
    for (let t = 0; t < l; t += 2.5) { const x = ax + (bx - ax)*t/l, z = az + (bz - az)*t/l; mesh(G.cyl, 0x5a5e66, [.05, y, .05], [x, y/2, z], parent, {metalness:.5}); }
    mesh(G.sph, 0x8a8f96, [.2, .2, .2], [bx, y, bz], parent, {metalness:.7});
  }
}
function pumpJack(g, x, z) {
  const j = new THREE.Group(); j.position.set(x, 0, z); j.rotation.y = R()*Math.PI; g.add(j);
  mesh(G.box, 0x3a3e44, [.9, .15, .5], [0, .07, 0], j); mesh(G.box, 0x3a3e44, [.12, 1.3, .3], [0, .7, 0], j);
  const beam = new THREE.Group(); beam.position.y = 1.35; j.add(beam);
  mesh(G.box, 0xf2a21a, [1.8, .16, .16], [0, 0, 0], beam); mesh(G.box, 0xf2a21a, [.3, .5, .2], [.95, -.15, 0], beam); mesh(G.box, 0x1e1e22, [.4, .28, .3], [-.85, -.05, 0], beam);
  mesh(G.cyl, 0x2a2a2e, [.03, 1.2, .03], [1.02, .5, 0], j); mesh(G.cyl, 0x5a5e66, [.12, .3, .12], [1.02, .15, 0], j);
  OIL.jacks.push(beam);
}
function oilFieldFx(anim) {
  const g = new THREE.Group(); scene.add(g);
  // the rocks are quarried out; pump jacks go where they stood
  for (const r of rocks) {
    r.dead = true; r.logs = 0; scene.remove(r.g);
    const ci = circles.findIndex(c => c.x === r.x && c.z === r.z); if (ci >= 0) circles.splice(ci, 1);
    const inRef = r.x > REFINERY.x0 - 1 && r.x < REFINERY.x1 + 1 && r.z > REFINERY.z0 - 1 && r.z < REFINERY.z1 + 1;
    if (!inRef) { pumpJack(g, r.x, r.z); circles.push({x:r.x, z:r.z, r:.7}); }
  }
  // the stone workers put on orange coveralls and work the field
  for (const w of workers) if (w.kind === 'mason') {
    for (const it of w.stack.items) scene.remove(it.mesh); w.stack.items.length = 0;
    const old = w.char; scene.remove(old.g);
    w.char = makeChar({body:0xf28a1a, body2:0xf28a1a, top:'tee', pants:0x2a3a5a, hat:'helmet', hatCol:0xf2c200, hair:'short'}); w.char.g.position.copy(old.g.position);
    w.kind = 'oilman'; w.carry = null; w.carryG = null; w.goal = null; w.wait = 0; OIL.men.push(w);
  }
  if (anim) popIn(g);
}
function refineryFx(anim) {
  const g = new THREE.Group(); scene.add(g);
  const cx = (REFINERY.x0 + REFINERY.x1)/2, cz = (REFINERY.z0 + REFINERY.z1)/2;
  slab(0x7a7e86, REFINERY.x1 - REFINERY.x0, REFINERY.z1 - REFINERY.z0, cx, cz, .006);
  for (const [x, z, h, r] of [[cx - 2.2, cz - .8, 4.6, .5], [cx - .9, cz - 1.1, 3.6, .38], [cx + .4, cz - .7, 5.2, .45]]) {
    mesh(G.cyl, 0xdfe4ea, [r, h, r], [x, h/2, z], g, {metalness:.5, roughness:.3});
    for (let y = .8; y < h; y += .9) mesh(G.cyl, 0x8a8f96, [r + .06, .06, r + .06], [x, y, z], g, {metalness:.6});
  }
  for (const [x, z] of [[cx + 1.9, cz + .9], [cx + 1.9, cz - .9], [cx - 1.6, cz + 1.2]]) { mesh(G.cyl, 0xf4f4f4, [.75, 1.2, .75], [x, .6, z], g, {metalness:.3}); mesh(G.cyl, 0xd9443a, [.77, .12, .77], [x, .9, z], g); }
  mesh(G.cyl, 0x5a5e66, [.12, 6, .12], [REFINERY.x0 + .3, 3, REFINERY.z0 + .3], g, {metalness:.5});
  OIL.flare = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0xffa040, toneMapped:false})); OIL.flare.scale.set(.25, .9, .25); OIL.flare.position.set(REFINERY.x0 + .3, 6.4, REFINERY.z0 + .3); g.add(OIL.flare);
  for (let i = 0; i < 5; i++) bulb(g, cx - 2.4 + i*1.2, 3.4 + (i % 2)*.8, cz - .4, 0xffe08a, .06);
  boxes.push({...REFINERY});
  // a pipeline in from the field
  pipeline([[2.2, -36.6], [2.2, -40.6], [REFINERY.x1, -52.6]], g);
  if (anim) popIn(g);
}
const GAS = {at:[39.2, -50.9]};
function gasStationFx(anim) {
  if (MODELS.road) { gasPlotFx(); gasStationLook(anim); OIL.car = null; if (W.unlocked.has('refinery')) pipeline([[REFINERY.x1 - .5, REFINERY.z0], [REFINERY.x1 - .5, -58.9], [12.6, -46.9], [-28.4, -46.9], [-28.4, 31]], scene, 2.6); return; }
  // just off the highway where it lands downtown, fed by a pipe from the refinery
  const g = new THREE.Group(); g.position.set(GAS.at[0], 0, GAS.at[1]); scene.add(g);
  slab(0x3a3d42, 6, 3.6, GAS.at[0], GAS.at[1], .006);
  for (const [x, z] of [[-1.6, -.8], [1.6, -.8], [-1.6, .8], [1.6, .8]]) mesh(G.box, 0xdfe4ea, [.14, 2.4, .14], [x, 1.2, z], g, {metalness:.5});
  mesh(G.box, 0xf4f6f8, [4, .25, 2.6], [0, 2.5, 0], g); mesh(G.box, 0xd9443a, [4.02, .16, 2.62], [0, 2.36, 0], g);
  for (const x of [-.8, .8]) { mesh(G.box, 0xd9443a, [.4, .9, .3], [x, .45, 0], g); mesh(G.box, 0x1a2a3a, [.25, .2, .32], [x, .7, 0], g); }
  mesh(G.box, 0xeef1f4, [1.4, 1.3, 1.2], [-2.6, .65, -.8], g); mesh(G.box, 0x8fc6e8, [1.42, .5, 1.22], [-2.6, .8, -.8], g, {metalness:.5, roughness:.1});
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('GAS', '#d9443a', '#ffffff'), toneMapped:false})); sign.scale.set(1, .4, 1); sign.position.set(0, 2.5, 1.32); g.add(sign);
  for (let i = 0; i < 6; i++) bulb(g, -1.8 + i*.72, 2.3, 1.32, 0xffffff, .05);
  pipeline([[REFINERY.x1 - .5, REFINERY.z0], [REFINERY.x1 - .5, -58.9], [12.6, -46.9], [36.4, -50.9]], scene, 2.6);
  OIL.car = vehicle(0x3f7cc0, 40.8, -48.3, 'car'); OIL.car.g.visible = false; OIL.car.speed = 4;
  if (anim) popIn(g);
}
let oilCarT = 6;
function updOil(dt) {
  OIL.jacks.forEach((b, i) => { b.rotation.z = Math.sin(time*1.6 + i*1.3) * .28; });
  if (OIL.flare) OIL.flare.scale.y = .8 + Math.sin(time*13)*.15 + Math.sin(time*7.3)*.1;
  // oil workers do the rounds of the pump jacks
  for (const w of OIL.men) {
    // at a pump jack: a wrench on the valve, both hands at it (and never the arms-out pose of a bare model)
    const A = w.char; if (A.armL) { A.armL.rotation.z = 0; A.armR.rotation.z = 0; }
    if (w.wait > 0) { w.wait -= dt; w.vel.set(0, 0, 0); if (A.armL) { A.armR.rotation.x = -1.3 + Math.sin(time*7 + w.pos.x)*.45; A.armL.rotation.x = -1.1; } w.yaw = Math.atan2(-1, -.9); continue; }
    if (!w.goal) { const r = rocks[R()*rocks.length|0]; w.goal = r ? [r.x + 1, r.z + .9] : [0, -38]; }
    if (moveTo(w, w.goal[0], w.goal[1], dt)) { w.goal = null; w.wait = 2.5 + R()*2; w.chopT = w.chopDur = .5; w.chopAt = [w.pos.x - 1, w.pos.z - .9]; w.chopItem = 'stone'; }
  }
  if (!started) return;
  // crude sells as it is pumped; refined fuel sells for far more
  if (W.unlocked.has('oilField') && (OIL.t.well -= dt) <= 0) {
    // (fuel always out-earns your rents: the order of the big earners is asteroids, space, fuel, then rent and the rest)
    OIL.t.well = 20; const pay = Math.max((W.unlocked.has('refinery') ? 2500 : 600) + 120*W.era, Math.round((RENT.last || 0)*1.35), Math.round(ledgerRate('🏠 Rent')*20*1.3)); OIL.lastPay = pay; W.coins += pay; W.earned += pay;
    popText(W.unlocked.has('refinery') ? `⛽ +${pay} fuel` : `🛢️ +${pay} crude`, new THREE.Vector3(-3, 4, -39), '#ffe06b');
  }
  // cars come down off the highway to fill up
  const C = OIL.car;
  if (C) {
    if (!C.busy && (oilCarT -= dt) <= 0) {
      oilCarT = 10 + R()*6; C.g.visible = true; C.g.position.set(43.8, 0, -48.9);
      driveTo(C, [[40.8, -48.3], [39.6, -50.6]], () => {
        C.wait = 3;
        const pay = 400 + 60*W.era; W.coins += pay; W.earned += pay;
        popText(`⛽ +${pay}`, new THREE.Vector3(39.4, 3, -50.8), '#ffe06b');
        setTimeout(() => driveTo(C, [[37.6, -50.4], [39.2, -47.6], [41, -47]], () => { C.busy = false; C.g.visible = false; }), 0);
      });
    }
    updVehicle(C, dt);
  }
}

