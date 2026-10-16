// ------------------------------------------------------------------ the Ranch, across the river from the quarry: cows, tomatoes and a fishing pier for new dishes
const RANCH = {bridge:null, leaves:[], up:0, block:null, animals:[]};
function ranchBridge(anim) {
  // a bascule bridge that lifts for passing ships
  const g = new THREE.Group(); scene.add(g); RANCH.bridge = g;
  for (const x of [-10.6, -17.4]) mesh(G.box, 0x8f8a80, [.9, .9, 1.8], [x, -.1, -51], g);
  for (const [hinge, off, dir] of [[-10.6, -1.7, -1], [-17.4, 1.7, 1]]) {
    const pivot = new THREE.Group(); pivot.position.set(hinge, .35, -21); g.add(pivot);
    const leaf = new THREE.Group(); leaf.position.x = off; pivot.add(leaf);
    mesh(G.box, 0x6a5a48, [3.4, .2, 1.5], [0, 0, 0], leaf); for (const z of [-.68, .68]) mesh(G.box, 0x3a6a5a, [3.4, .4, .06], [0, .25, z], leaf, {metalness:.5});
    pivot.dir = dir; RANCH.leaves.push(pivot);
  }
  if (anim) popIn(g);
}
function ranchFx(kind, anim) {
  const g = new THREE.Group(); scene.add(g);
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (kind === 'dairy') {
    // a fenced pasture with grazing cows
    for (let x = -92.8; x <= -87.2; x += .7) for (const z of [-58.6, -54.4]) P(G.box, 0x8a5a2b, [.08, .6, .08], [x, .3, z]);
    for (let z = -58.6; z <= -54.4; z += .7) for (const x of [-92.8, -87.2]) P(G.box, 0x8a5a2b, [.08, .6, .08], [x, .3, z]);
    for (const z of [-58.6, -54.4]) P(G.box, 0x8a5a2b, [5.6, .06, .06], [-90, .5, z]); for (const x of [-92.8, -87.2]) P(G.box, 0x8a5a2b, [.06, .06, 4.2], [x, .5, -56.5]);
    P(G.box, 0xb8322a, [1.6, 1.3, 1.2], [-91.6, .65, -57.6]); P(G.cone4, 0x6a3a22, [1.3, .7, 1], [-91.6, 1.65, -57.6]).rotation.y = Math.PI/4;
    for (let i = 0; i < 3; i++) RANCH.animals.push(animal(g, 'cow', -90 + (i - 1)*1.4, -56.2 + (i % 2)*.8, {x0:-92.4, x1:-87.6, z0:-58.2, z1:-54.8}));
    boxes.push({x0:-92.8, x1:-87.2, z0:-58.6, z1:-54.4});
  } else if (kind === 'creamery') {
    P(G.box, 0xf4f0e6, [2.6, 1.8, 2.2], [-81.2, .9, -56.5]); P(G.box, 0xff9ec0, [2.62, .3, 2.22], [-81.2, 1.6, -56.5]);
    P(G.cone, 0xe8c48a, [.35, .8, .35], [-81.2, 2.4, -56.5]).rotation.x = Math.PI; P(G.sph, 0xff9ec0, [.38, .32, .38], [-81.2, 2.9, -56.5]);
    boxes.push({x0:-82.5, x1:-79.9, z0:-57.6, z1:-55.4});
  } else if (kind === 'tomatoes') {
    P(G.box, 0x6a4a2a, [5.2, .12, 2.6], [-90, .06, -50.5]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { P(G.cone, 0x3f8a3a, [.18, .55, .18], [-92.3 + c*.5, .35, -51.4 + r*.6]); P(G.sph, 0xd9302a, [.08, .08, .08], [-92.2 + c*.5, .45, -51.3 + r*.6]); }
    boxes.push({x0:-92.6, x1:-87.4, z0:-51.8, z1:-49.2});
  } else if (kind === 'pizzeria') {
    P(G.box, 0xe8d0a8, [2.6, 1.7, 2.2], [-81.2, .85, -50.5]); for (let i = 0; i < 5; i++) P(G.box, i % 2 ? 0xf4f0e6 : 0x3f9a3a, [.52, .06, .7], [-82.24 + i*.52, 1.7, -49.1]).rotation.x = .35;
    P(G.cyl, 0x9a4a32, [.3, 1.2, .3], [-80.4, 2, -51.2]); smokers.push({x:-80.4, y:2.7, z:-51.2});
    const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('PIZZA', '#3f9a3a', '#ffffff'), toneMapped:false})); s.scale.set(1.4, .4, 1); s.position.set(-81.2, 1.35, -49.38); g.add(s);
    boxes.push({x0:-82.5, x1:-79.9, z0:-51.6, z1:-49.4});
  } else if (kind === 'pier') {
    for (let i = 0; i < 6; i++) P(G.box, i % 2 ? 0x9a6b40 : 0x8a5d36, [.5, .14, 1.6], [-17.4 + i*.52, .22, -46.2]);
  } else if (kind === 'sushi') {
    P(G.box, 0x2a2a30, [2.6, 1.7, 2.2], [-81.2, .85, -46.2]); P(G.box, 0xd9443a, [2.8, .2, 2.4], [-81.2, 1.75, -46.2]);
    const r = P(G.cone4, 0x2a2a30, [2, .6, 1.8], [-81.2, 2.15, -46.2]); r.rotation.y = Math.PI/4;
    for (const x of [-82.1, -80.3]) bulb(g, x, 1.4, -45.05, 0xff6a5a, .1);
    const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('SUSHI', '#d9443a', '#ffffff'), toneMapped:false})); s.scale.set(1.4, .4, 1); s.position.set(-81.2, 1.2, -45.08); g.add(s);
    boxes.push({x0:-82.5, x1:-79.9, z0:-47.3, z1:-45.1});
  }
  if (anim) popIn(g);
}
// cows, chickens and pigs that wander their pens
function beast(kind, h) {
  const src = MODELS.animals && MODELS.animals.getObjectByName(kind); if (!src) return null;
  const m = src.clone(true); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(m), g = new THREE.Group(); m.position.y = -bb.min.y; g.add(m); g.scale.setScalar(h / (bb.max.y - bb.min.y));
  const legs = [], wings = [];
  m.traverse(o => { if (/_leg\d$/.test(o.name)) legs.push(o); if (/_wing\d$/.test(o.name)) wings.push(o); if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  legs.sort((a, b) => a.name < b.name ? -1 : 1); wings.sort((a, b) => a.name < b.name ? -1 : 1);
  g.userData.legs = legs; g.userData.wings = wings; return g;
}
// walking: front-left with back-right, then the other pair
function stride(g, ph, amt) { (g.userData.legs || []).forEach((l, i) => { l.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * amt; }); }
const BEAST_H = {cow:1.35, pig:.7, chicken:.42, goat:1.05, lion:1.05, tiger:1.0, elephant:2.1, giraffe:3.1, zebra:1.35, penguin:.55, bear:1.15, panda:.95};
function animal(parent, kind, x, z, pen) {
  const b = beast(kind, BEAST_H[kind] || 1);
  if (b) { b.position.set(x, 0, z); parent.add(b); return {g:b, pen, tx:x, tz:z, t:0, ph:R()*6, sp:kind === 'chicken' ? 1 : .4}; }
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  if (kind === 'cow') {
    mesh(G.box, 0xf4f4f4, [.5, .45, .9], [0, .55, 0], g); mesh(G.box, 0x1a1a1a, [.51, .2, .3], [0, .62, .1], g); mesh(G.box, 0xf4f4f4, [.3, .3, .3], [0, .72, .55], g); mesh(G.box, 0xffb0b0, [.2, .12, .1], [0, .62, .72], g);
    for (const [lx, lz] of [[-.18, -.32], [.18, -.32], [-.18, .32], [.18, .32]]) mesh(G.box, 0x3a3a3a, [.08, .35, .08], [lx, .17, lz], g);
  } else if (kind === 'chicken') {
    mesh(G.sph, 0xf4f0e6, [.14, .14, .18], [0, .2, 0], g); mesh(G.sph, 0xf4f0e6, [.08, .08, .08], [0, .32, .12], g); mesh(G.box, 0xd9443a, [.03, .06, .05], [0, .41, .12], g); mesh(G.cone, 0xf2a21a, [.03, .06, .03], [0, .32, .2], g).rotation.x = Math.PI/2;
  } else {
    mesh(G.box, 0xffb0c0, [.4, .35, .6], [0, .35, 0], g); mesh(G.box, 0xff9eb0, [.22, .2, .1], [0, .38, .33], g); for (const [lx, lz] of [[-.13, -.2], [.13, -.2], [-.13, .2], [.13, .2]]) mesh(G.box, 0xff9eb0, [.07, .2, .07], [lx, .1, lz], g);
  }
  return {g, pen, tx:x, tz:z, t:0, sp:kind === 'chicken' ? 1 : .4};
}
function ranchAnimals() {
  const g = new THREE.Group(); scene.add(g);
  for (let x = -93.2; x <= -87; x += .7) mesh(G.box, 0xc8a878, [.06, .4, .06], [x, .2, -47.6], g);
  for (let i = 0; i < 6; i++) RANCH.animals.push(animal(g, i < 4 ? 'chicken' : 'pig', -91 + i*.8, -46, {x0:-93, x1:-87.4, z0:-47.2, z1:-44.8}));
}
function updRanch(dt) {
  // the bridge lifts when a ship comes up or down the river
  if (RANCH.leaves.length) {
    const shipNear = boats.some(b => Math.abs(b.z + 51) < 3.2) || pirates.some(p => Math.abs(p.g.position.z + 51) < 3.2);
    RANCH.up += ((shipNear ? 1 : 0) - RANCH.up) * Math.min(1, dt*3);
    for (const p of RANCH.leaves) p.rotation.z = p.dir * RANCH.up * 1.25;
    const want = RANCH.up > .15;
    if (want && !RANCH.block) { RANCH.block = {x0:-17, x1:-11, z0:-51.8, z1:-50.2}; boxes.push(RANCH.block); }
    if (!want && RANCH.block) { boxes.splice(boxes.indexOf(RANCH.block), 1); RANCH.block = null; }
  }
  for (const a of RANCH.animals) {
    if ((a.t -= dt) <= 0) { a.t = 2 + R()*4; a.tx = a.pen.x0 + R()*(a.pen.x1 - a.pen.x0); a.tz = a.pen.z0 + R()*(a.pen.z1 - a.pen.z0); }
    const p = a.g.position, dx = a.tx - p.x, dz = a.tz - p.z, d = Math.hypot(dx, dz);
    if (d > .1) { p.x += dx/d*Math.min(d, a.sp*dt); p.z += dz/d*Math.min(d, a.sp*dt); a.g.rotation.y = Math.atan2(dx, dz); }
    if (a.g.userData.legs) { const mv = d > .1; a.ph = (a.ph || 0) + dt*(mv ? a.sp*14 : 0); stride(a.g, a.ph, mv ? .45 : 0); }
  }
}

