// ------------------------------------------------------------------ space: a Moon landing you can watch, a base on the Moon, then a colony on Mars
const SPACE = {view:null, scenes:{}, cut:null, orbit:0};
function planetTex(kind) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  let sd = kind === 'earth' ? 5 : 9; const r = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  g.fillStyle = kind === 'earth' ? '#2f6fc0' : '#a8a49c'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < (kind === 'earth' ? 14 : 30); i++) {
    g.fillStyle = kind === 'earth' ? ['#3f9a4a', '#6aa84a', '#c8b078'][i % 3] : ['#8a867e', '#b8b4ac'][i % 2];
    g.beginPath(); g.ellipse(r()*256, 20 + r()*88, 8 + r()*30, 6 + r()*16, r()*3, 0, 7); g.fill();
  }
  if (kind === 'earth') { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.ellipse(r()*256, r()*128, 10 + r()*24, 3 + r()*5, 0, 0, 7); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function spaceScene(planet) {
  if (planet === 'belt') return beltScene();
  if (SPACE.scenes[planet]) return SPACE.scenes[planet];
  const sc = new THREE.Scene(), mars = planet === 'mars';
  sc.background = new THREE.Color(mars ? 0x1a0c08 : 0x02030a);
  const sun = new THREE.DirectionalLight(mars ? 0xffe0c0 : 0xffffff, 3.2); sun.position.set(30, 40, 20); sc.add(sun, new THREE.HemisphereLight(mars ? 0xd08060 : 0x8090b0, 0x201812, .7));
  // stars all round
  const n = 1600, pos = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const u = R()*2 - 1, a = R()*Math.PI*2, s = Math.sqrt(1 - u*u); pos.set([Math.cos(a)*s*180, Math.abs(u)*180 + 5, Math.sin(a)*s*180], i*3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sc.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff, size:1.6, sizeAttenuation:false})));
  // home, hanging in the sky
  const earth = new THREE.Mesh(new THREE.SphereGeometry(mars ? 2 : 11, 32, 20), new THREE.MeshStandardMaterial({map:planetTex('earth'), roughness:.7}));
  earth.position.set(-50, mars ? 60 : 38, -98); sc.add(earth);
  if (mars) for (const [x, y, s] of [[40, 50, 2.5], [70, 35, 1.6]]) { const m = new THREE.Mesh(G.ico, mat(0x8a7a6a, {flatShading:true})); m.position.set(x, y, -120); m.scale.setScalar(s); sc.add(m); }
  // the ground: craters on the Moon, red dunes and rocks on Mars
  seed = mars ? 61 : 47; const craters = [];
  for (let i = 0; i < 28; i++) craters.push([(rnd() - .5)*100, (rnd() - .5)*100, 1.5 + rnd()*5]);
  const H = (x, z) => {
    let h = Math.sin(x*.08)*Math.cos(z*.07)*(mars ? 1.6 : .8) + Math.sin(x*.31 + z*.2)*.25;
    for (const [cx, cz, r] of craters) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.4) h += d < 1 ? -(1 - d*d)*r*.25 : (1.4 - d)*r*.18; }
    if (Math.hypot(x, z) < 9) h *= Math.hypot(x, z) / 9;   // a flat landing zone
    return h;
  };
  const geo = new THREE.PlaneGeometry(130, 130, 130, 130); geo.rotateX(-Math.PI/2);
  const p = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = H(x, z); p.setY(i, h); c.setHex(mars ? 0xb8562a : 0x9a9894).offsetHSL(0, 0, h*.03 + (R() - .5)*.03); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  sc.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors:true, roughness:1, flatShading:true})));
  if (mars) for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(G.ico, mat(0x7a3a1e, {flatShading:true})); const x = (R() - .5)*90, z = (R() - .5)*90; if (Math.hypot(x, z) < 10) continue; m.position.set(x, H(x, z), z); m.scale.setScalar(.3 + R()*1.2); sc.add(m); }
  const base = new THREE.Group(); sc.add(base);
  const cam = new THREE.PerspectiveCamera(40, 1, .1, 500);
  return SPACE.scenes[planet] = {sc, cam, base, H, planet, built:-1};
}
// the base grows with your empire: domes, labs, solar farms and a rover
function buildBase(S) {
  if (S.belt) return;
  const mars = S.planet === 'mars', level = mars ? (W.flags.mars ? 2 : 0) : (W.unlocked.has('moonHotel') ? 3 : W.unlocked.has('moonBase') ? 2 : W.flags.moon ? 1 : 0);
  if (S.built === level) return; S.built = level;
  S.base.clear();
  const P = (geo, cl, s, pos, o) => mesh(geo, cl, s, pos, S.base, o);
  if (level >= 1) {
    // where we landed: the lander, footprints of a flag and our banner
    const l = new THREE.Group(); l.position.set(0, S.H(0, 0), 0); S.base.add(l); lander(l);
    P(G.cyl, 0xdfe4ea, [.04, 2.2, .04], [2.6, S.H(2.6, 1.4) + 1.1, 1.4]); ourFlag(P(G.box, 0xd9443a, [1, .6, .03], [3.1, S.H(2.6, 1.4) + 1.9, 1.4])); if (0) P(G.box, 0xf2c200, [.3, .3, .035], [2.9, S.H(2.6, 1.4) + 1.95, 1.4]);
  }
  if (level >= 2) {
    const glass = mat(mars ? 0xd8f0e0 : 0xdfeaf4, {metalness:.3, roughness:.15, transparent:true, opacity:.85});
    for (const [x, z, r] of [[-6, -3, 2.2], [-2, -7, 1.6], [4, -6, 2.6], [8, -1, 1.5]]) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI*2, 0, Math.PI/2), glass); d.position.set(x, S.H(x, z), z); S.base.add(d);
      P(G.cyl, 0xb8bcc2, [r, .3, r], [x, S.H(x, z) + .15, z], {metalness:.5});
      if (mars) for (let i = 0; i < 6; i++) P(G.sph, 0x3f9a3a, [.4, .3, .4], [x + Math.cos(i)*r*.5, S.H(x, z) + .5, z + Math.sin(i)*r*.5]);
      else bulb(S.base, x, S.H(x, z) + r*.7, z, 0xfff2c8, .2);
    }
    for (const [ax, az, bx, bz] of [[-6, -3, -2, -7], [-2, -7, 4, -6], [4, -6, 8, -1]]) { const t = P(G.cyl, 0xdfe4ea, [.35, Math.hypot(bx - ax, bz - az), .35], [(ax + bx)/2, S.H((ax + bx)/2, (az + bz)/2) + .4, (az + bz)/2], {metalness:.4}); t.rotation.order = 'YXZ'; t.rotation.set(Math.PI/2, Math.atan2(bx - ax, bz - az), 0); }
    for (let i = 0; i < 8; i++) { const x = -12 + (i % 4)*2.2, z = 5 + Math.floor(i / 4)*2; P(G.box, 0x1e3a6a, [1.8, .05, 1.2], [x, S.H(x, z) + .8, z], {metalness:.6, roughness:.2}).rotation.x = -.4; P(G.cyl, 0x9aa0a8, [.05, .8, .05], [x, S.H(x, z) + .4, z]); }
    const rover = new THREE.Group(); rover.position.set(6, S.H(6, 6), 6); S.base.add(rover); S.rover = rover;
    mesh(G.box, 0xdfe4ea, [1, .4, 1.6], [0, .55, 0], rover); for (const [x, z] of [[-.55, .55], [.55, .55], [-.55, -.55], [.55, -.55]]) mesh(G.cyl, 0x2a2a2e, [.28, .2, .28], [x, .28, z], rover).rotation.z = Math.PI/2;
    mesh(G.sph, 0xeef0f4, [.4, .12, .4], [0, 1.2, -.3], rover).rotation.x = -.6;
    for (let i = 0; i < 3; i++) { const a = astronaut(); a.g.position.set(-3 + i*2.5, S.H(-3 + i*2.5, 3), 3 + (i % 2)); S.base.add(a.g); (S.walkers ||= []).push(a); }
  }
  if (level >= 3) {
    // the Moon hotel: a glass tower with a ring of rooms and a view of Earth
    const y0 = S.H(-12, -10);
    P(G.cyl, 0xdfe4ea, [1.2, 7, 1.2], [-12, y0 + 3.5, -10], {metalness:.4}); P(G.cyl, 0x8fc6e8, [1.25, 6, 1.25], [-12, y0 + 3.6, -10], {metalness:.5, roughness:.1, transparent:true, opacity:.7});
    P(G.cyl, 0xf2c200, [2.6, .4, 2.6], [-12, y0 + 7.2, -10], {metalness:.7}); for (let i = 0; i < 16; i++) bulb(S.base, -12 + Math.cos(i/16*Math.PI*2)*2.6, y0 + 7.2, -10 + Math.sin(i/16*Math.PI*2)*2.6, 0xfff2c8, .1);
  }
}
function lander(l) {
  mesh(G.box, 0xc8a24a, [1.6, 1, 1.6], [0, 1.4, 0], l, {metalness:.8, roughness:.3}); mesh(G.box, 0xdfe4ea, [1.1, .9, 1.1], [0, 2.3, 0], l);
  mesh(G.box, 0x1a2a3a, [.4, .3, .05], [0, 2.4, .56], l);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const g = mesh(G.cyl, 0xb8bcc2, [.05, 1.4, .05], [x*.8, .7, z*.8], l, {metalness:.6}); g.rotation.z = -x*.3; g.rotation.x = z*.3; mesh(G.cyl, 0xb8bcc2, [.22, .05, .22], [x*1.05, .03, z*1.05], l); }
}
// an astronaut: a white suit, a glass bubble helmet with a gold visor on the head, a life-support pack on the back.
// Realistic people are animated even in the space scenes (c.space), so they walk rather than stand in a T.
function astronaut() {
  const c = makeChar({body:0xf4f4f4, body2:0xf4f4f4, pants:0xeeeeee, top:'jacket', long:true, hair:'bald', skin:0xe8b892, shoe:0xb8bcc2, noFit:true});
  scene.remove(c.g); c.space = true; c.blob = false;   // (the shadow blobs are drawn in the town's scene)
  const helmet = new THREE.Group(), pack = new THREE.Group();
  const glass = new THREE.Mesh(G.sph, new THREE.MeshStandardMaterial({color:0xdfefff, transparent:true, opacity:.28, roughness:.05, metalness:.2, depthWrite:false})); glass.scale.setScalar(.21); glass.position.set(0, 1.74, .01); helmet.add(glass);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, Math.PI*.12, Math.PI*.76, Math.PI*.2, Math.PI*.42), new THREE.MeshStandardMaterial({color:0xd9a52a, metalness:.95, roughness:.12, side:THREE.DoubleSide}));
  visor.scale.setScalar(.215); visor.position.set(0, 1.74, .01); helmet.add(visor);
  mesh(G.cyl, 0xe8e8ec, [.16, .05, .16], [0, 1.54, 0], helmet, {metalness:.4});   // the neck ring
  mesh(G.box, 0xdfe4ea, [.36, .46, .2], [0, 1.28, -.2], pack); mesh(G.box, 0x9aa0a8, [.3, .08, .16], [0, 1.53, -.2], pack, {metalness:.5});
  if (c.qn && c.bones.head) {
    // fixed to the head and the spine, so they move with every step
    c.root.updateMatrixWorld(true);
    for (const [g, bone] of [[helmet, c.bones.head], [pack, c.bones.spine || c.bones.head]]) { g.scale.setScalar(1/QN.S); g.position.multiplyScalar(1/QN.S); c.root.add(g); bone.attach(g); }
  } else { c.g.add(helmet); c.g.add(pack); }
  return c;
}
function startCut(planet) {
  const S = spaceScene(planet); buildBase(S);
  const l = new THREE.Group(); lander(l); S.sc.add(l);
  const flame = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0xffb040, toneMapped:false})); flame.scale.set(.5, 1.6, .5); flame.rotation.x = Math.PI; flame.position.y = .2; l.add(flame);
  SPACE.cut = {planet, t:0, l, flame, astros:[], dust:[]}; SPACE.view = planet; stage.classList.add('space');
}
function updCut(dt) {
  const C = SPACE.cut, S = spaceScene(C.planet); C.t += dt;
  const t = C.t, gy = S.H(0, 0);
  // descend, kick up dust, open the hatch, step out and plant the flag
  const y = t < 6 ? gy + 1 + Math.pow(1 - t/6, 2)*26 : gy;
  C.l.position.set(Math.max(0, 6 - t)*2, y, 0); C.flame.visible = t < 6; C.flame.scale.y = 1.4 + Math.sin(time*40)*.3;
  if (t > 4 && t < 6.5 && R() < .6) { const d = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:C.planet === 'mars' ? 0xc87a4a : 0xc8c4bc, transparent:true, opacity:.6, depthWrite:false})); d.position.set((R() - .5)*2, gy + .2, (R() - .5)*2); d.scale.setScalar(.3); S.sc.add(d); C.dust.push({m:d, v:new THREE.Vector3((R() - .5)*6, .5 + R(), (R() - .5)*6), t:0}); }
  for (const d of C.dust) { d.t += dt; d.m.position.addScaledVector(d.v, dt); d.m.scale.setScalar(.3 + d.t*1.5); d.m.material.opacity = Math.max(0, .6 - d.t*.25); }
  if (t > 7 && !C.astros.length) for (let i = 0; i < 2; i++) { const a = astronaut(); a.g.position.set(.8, gy + .2, 1); S.sc.add(a.g); C.astros.push(a); }
  C.astros.forEach((a, i) => {
    const u = clamp((t - 7 - i*.6) / 3, 0, 1), x = .8 + u*(1.6 + i*1.4), z = 1 + u*(1.2 - i*1.6);
    a.g.position.set(x, S.H(x, z) + Math.abs(Math.sin(t*4 + i))*.15, z); a.g.rotation.y = Math.atan2(1.6 + i*1.4, 1.2 - i*1.6);
    const s = Math.sin(t*4 + i); a.legL.rotation.x = s*.4; a.legR.rotation.x = -s*.4;
    if (i === 0 && t > 10.5) { a.armR.rotation.x = -2.6; }
  });
  if (t > 10.5 && !C.flag) {
    C.flag = new THREE.Group(); C.flag.position.set(3.6, S.H(3.6, 2.2), 2.2); S.sc.add(C.flag);
    mesh(G.cyl, 0xdfe4ea, [.04, 2.2, .04], [0, 1.1, 0], C.flag); ourFlag(mesh(G.box, 0xd9443a, [1, .6, .03], [.5, 1.9, 0], C.flag));
    banner(C.planet === 'mars' ? '🔴 A colony on Mars!' : '🌕 One small step!', C.planet === 'mars' ? 'Your empire now spans two planets.' : 'Your astronauts plant the flag of your empire on the Moon.');
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => snd(f, .25, 'triangle', .05), i*150));
  }
  if (C.flag) C.flag.scale.y = Math.min(1, (t - 10.5)*1.5);
  // the camera rides down with the lander, then circles the landing site
  const cam = S.cam;
  if (t < 6) { cam.position.set(C.l.position.x + 9, C.l.position.y + 4, C.l.position.z + 12); cam.lookAt(C.l.position.x, C.l.position.y, C.l.position.z); }
  else { const a = .6 + (t - 6)*.12; cam.position.set(Math.sin(a)*13, gy + 5, Math.cos(a)*13); cam.lookAt(1.5, gy + 1, 1); }
  if (t > 15) endCut();
}
function endCut() {
  const C = SPACE.cut, S = spaceScene(C.planet);
  for (const o of [C.l, C.flag, ...C.astros.map(a => a.g), ...C.dust.map(d => d.m)]) if (o) S.sc.remove(o);
  S.built = -1; buildBase(S);
  SPACE.cut = null; SPACE.view = null; stage.classList.remove('space');
}
function toggleSpace() {
  if (SPACE.cut) return;
  const places = ['moon', ...(W.flags.mars ? ['mars'] : []), ...(W.unlocked.has('asteroid') ? ['belt'] : [])], i = places.indexOf(SPACE.view);
  SPACE.view = i < 0 ? places[0] : places[i + 1] || null;
  stage.classList.toggle('space', !!SPACE.view);
  if (SPACE.view) { const S = spaceScene(SPACE.view); buildBase(S); }
}
function updSpaceView(dt) {
  if (SPACE.cut) return;
  if (SPACE.view === 'belt') {
    const S = beltScene(); SPACE.orbit += dt*.06;
    S.cam.position.set(Math.sin(SPACE.orbit)*36, 12, Math.cos(SPACE.orbit)*36); S.cam.lookAt(0, 0, 0);
    for (const r of S.rocks) { r.a += r.sp*dt; r.r.position.x = Math.cos(r.a)*r.d; r.r.position.z = Math.sin(r.a)*r.d; r.r.rotation.x += dt*.3; }
    for (const sh of S.ships) { const a = time*.2 + sh.ph, d = 18 + Math.sin(time*.5 + sh.ph)*8; sh.s.position.set(Math.cos(a)*d, Math.sin(time + sh.ph)*2, Math.sin(a)*d); sh.s.rotation.y = -a; }
    return;
  }
  const S = spaceScene(SPACE.view); SPACE.orbit += dt*.08;
  if (!updMoonWalk(dt, S)) { S.cam.position.set(Math.sin(SPACE.orbit)*20, S.H(0, 0) + 9, Math.cos(SPACE.orbit)*20); S.cam.lookAt(0, S.H(0, 0) + 1, -1); }
  if (S.rover) { S.rover.position.x = 6 + Math.sin(time*.3)*4; S.rover.position.y = S.H(S.rover.position.x, 6); S.rover.rotation.y = Math.cos(time*.3) > 0 ? Math.PI/2 : -Math.PI/2; }
  (S.walkers || []).forEach((a, i) => { const x = -3 + i*2.5 + Math.sin(time*.4 + i)*1.5, z = 3 + Math.cos(time*.3 + i); a.g.position.set(x, S.H(x, z) + Math.abs(Math.sin(time*3 + i))*.12, z); const s = Math.sin(time*3 + i); a.legL.rotation.x = s*.4; a.legR.rotation.x = -s*.4; });
}

