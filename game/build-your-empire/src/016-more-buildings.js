// ------------------------------------------------------------------ more buildings
function longTable(x, z, alongXAxis) {
  const g = new THREE.Group(); g.position.set(x, 0, z); if (alongXAxis) g.rotation.y = Math.PI/2; scene.add(g);
  mesh(G.box, 0xa8733f, [1.4, .14, 5.2], [0, .85, 0], g);
  for (let i = -1; i <= 1; i++) mesh(G.box, 0x8a5a2b, [1.42, .03, .05], [0, .93, i*1.6], g);
  [[-.55, -2.3], [.55, -2.3], [-.55, 2.3], [.55, 2.3]].forEach(([a, b]) => mesh(G.box, 0x6b4526, [.14, .85, .14], [a, .42, b], g));
  return g;
}
function roofOn(g, w, d, h, y, color) { const r = mesh(G.cone4, color, [1, h, 1], [0, y, 0], g); r.rotation.y = Math.PI/4; r.scale.set(w*.72, h, d*.72); return r; }
Object.assign(buildFx, {
  mine(anim) {
    const g = new THREE.Group(); g.position.set(0, 0, -60.4); scene.add(g);
    mesh(G.box, 0x1a1410, [2, 2.2, .6], [0, 1.1, 0], g);
    for (const x of [-1.1, 1.1]) mesh(G.box, 0x6b4526, [.28, 2.6, .28], [x, 1.3, .3], g);
    mesh(G.box, 0x6b4526, [2.6, .3, .32], [0, 2.55, .3], g);
    for (let i = 0; i < 6; i++) mesh(G.box, 0x5a4a3a, [1.2, .05, .14], [0, .03, .9 + i*.45], g);
    for (const x of [-.4, .4]) mesh(G.box, 0x8a8f96, [.05, .05, 2.8], [x, .07, 2], g, {metalness:.5});
    const cart = new THREE.Group(); cart.position.set(1.9, .3, 1.2); g.add(cart);
    mesh(G.box, 0x6a5040, [.8, .45, 1], [0, .15, 0], cart);
    for (const [x, z] of [[-.2, -.2], [.2, .1], [0, .3]]) mesh(G.ico, 0x5a4a44, [.2, .16, .2], [x, .45, z], cart);
    if (anim) popIn(g);
  },
  masonry(anim) {
    const g = new THREE.Group(); g.position.set(-6, 0, -49.3); scene.add(g);
    for (let i = 0; i < 3; i++) mesh(G.box, 0xa3a6ab, [.7, .4, .5], [(i - 1)*.72, .2, 0], g);
    mesh(G.box, 0x9a9da2, [.7, .4, .5], [-.36, .6, 0], g); mesh(G.box, 0x9a9da2, [.7, .4, .5], [.36, .6, 0], g);
    circles.push({x:-6, z:-49.3, r:.7});
    if (anim) popIn(g);
  },
  smelter(anim) {
    const g = new THREE.Group(); g.position.set(6.5, 0, -52); scene.add(g);
    mesh(G.cyl, 0x7a6a5a, [.95, 1.6, .95], [0, .8, 0], g);
    mesh(G.cone, 0x6a5a4a, [1, .8, 1], [0, 2, 0], g);
    mesh(G.cyl, 0x5a4a3a, [.22, 1.4, .22], [0, 2.9, 0], g);
    const glow = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({color:0xff7a1a})); glow.scale.set(.6, .45, .05); glow.position.set(0, .6, .95); g.add(glow);
    smokers.push({x:6.5, y:3.7, z:-52}); if (ST.smelter) ST.smelter.body = g;
    if (anim) popIn(g);
  },
  smithy(anim) {
    const g = new THREE.Group(); g.position.set(-5, 0, 78.5); scene.add(g); if (ST.smith) ST.smith.body = g;
    for (const [x, z] of [[-1.1, -.9], [1.1, -.9], [-1.1, .9], [1.1, .9]]) mesh(G.cyl, 0x5e3f22, [.09, 2.2, .09], [x, 1.1, z], g);
    roofOn(g, 2.8, 2.4, .9, 2.6, 0x7a4a2a); fader(g, 3, 3.1);
    mesh(G.box, 0x6a6058, [1, .9, .9], [-.3, .45, 0], g);
    fire(g, -.3, .9, 0, .5);
    mesh(G.box, 0x2a2a2e, [.5, .25, .25], [.6, .62, 0], g, {metalness:.6}); mesh(G.box, 0x3a3a3e, [.2, .5, .2], [.6, .25, 0], g);
    if (anim) popIn(g);
  },
  pavilion(anim) {
    const g = new THREE.Group(); g.position.set(52, 0, 7); scene.add(g);
    // open-air hall: posts strung with bunting, so the camera can see the table
    for (const [x, z] of [[-2.9, -1], [2.9, -1], [-2.9, 1], [2.9, 1]]) mesh(G.cyl, 0x6b4526, [.12, 2.6, .12], [x, 1.3, z], g);
    for (const z of [-1, 1]) {
      mesh(G.box, 0x5e3f22, [5.8, .06, .06], [0, 2.55, z], g);
      for (let i = 0; i < 12; i++) { const f = mesh(G.cone4, [0xd9443a, 0xf0c030, 0x3f7cc0, 0x3f9a6a][i % 4], [.16, .3, .03], [-2.6 + i*.47, 2.36, z], g); f.rotation.x = Math.PI; }
    }
    longTable(52, 7, true);
    for (const x of [-2.9, 2.9]) { const l = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:0xffd36b})); l.scale.setScalar(.14); l.position.set(x, 2.2, 1.1); g.add(l); }
    if (anim) popIn(g);
  },
  market(anim) {
    const g = new THREE.Group(); g.position.set(50, 0, -8.2); scene.add(g);
    mesh(G.box, 0x9a6a3a, [2.4, .9, 1], [0, .45, 0], g);
    for (const x of [-1.15, 1.15]) mesh(G.cyl, 0x5e3f22, [.07, 2.2, .07], [x, 1.1, .45], g);
    for (let i = 0; i < 6; i++) mesh(G.box, i % 2 ? 0xffffff : 0xd9443a, [.42, .06, 1.3], [-1.05 + i*.42, 2.2, .1], g).rotation.x = -.25;
    for (const [x, c] of [[-.7, 0xe4bf55], [0, 0xc0463a], [.7, 0x8aa3b5]]) mesh(G.sph, c, [.25, .18, .25], [x, 1, 0], g);
    if (anim) popIn(g);
  },
  library(anim) {
    const g = new THREE.Group(); g.position.set(55.5, 0, -9.6); scene.add(g); if (ST.library) ST.library.body = g;
    mesh(G.box, 0xd8d2c4, [4, .3, 3], [0, .15, 0], g);
    mesh(G.box, 0xe8e2d4, [3.6, 2.2, 2.6], [0, 1.4, 0], g);
    for (let i = 0; i < 4; i++) mesh(G.cyl, 0xf4f0e6, [.14, 2.2, .14], [-1.35 + i*.9, 1.4, 1.4], g);
    const roof = mesh(G.cone4, 0x5a6a8a, [1, 1.2, 1], [0, 3.1, 0], g); roof.rotation.y = Math.PI/4; roof.scale.set(2.9, 1.2, 2.2);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.7, 14, 8, 0, Math.PI*2, 0, Math.PI/2), mat(0x8ab0c8, {metalness:.3}));
    dome.position.y = 3.6; g.add(dome);
    mesh(G.box, 0x4a3020, [.8, 1.3, .1], [0, .95, 1.32], g);
    fader(g, 4.2, 4.2);
    if (anim) popIn(g);
  },
  mess(anim) {
    const g = longTable(2, 82, true);
    ground(0xd9bf8a, 7.4, 5.4, 9, 78.2, .013);
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Group(); d.position.set(12.4, 0, 76 + i*1.8); scene.add(d);
      mesh(G.cyl, 0x6b4526, [.08, 1.1, .08], [0, .55, 0], d); mesh(G.cyl, 0xd9c08a, [.25, .6, .25], [0, 1.25, 0], d); mesh(G.box, 0xd9c08a, [.8, .12, .12], [0, 1.3, 0], d);
    }
    if (anim) popIn(g);
  },
  barracks(anim) {
    baseCamp(anim);
    if (MODELS.b2) { const g = BASE.hq = new THREE.Group(); g.position.set(9.5, 0, 87.5); scene.add(g); BASE.tier = 0; baseTier(false); fader(g, 5.6, 4); if (anim) popIn(g); return; }
    const g = new THREE.Group(); g.position.set(9.5, 0, 87.5); scene.add(g);
    mesh(G.box, 0x8a6a4a, [5, 2, 3], [0, 1, 0], g);
    roofOn(g, 5.8, 3.6, 1.2, 2.6, 0x3a4a6a);
    mesh(G.box, 0x3a2414, [.9, 1.3, .1], [0, .65, -1.52], g);
    for (const x of [-1.6, 1.6]) { mesh(G.cyl, 0xb0b4ba, [.3, .06, .3], [x, 1.3, -1.54], g, {metalness:.5}).rotation.x = Math.PI/2; }
    mesh(G.cyl, 0x5e3f22, [.05, 2, .05], [2.6, 3, -1], g);
    ST.flag2 = mesh(G.box, 0x3a6ad9, [.7, .4, .03], [2.96, 3.7, -1], g);
    fader(g, 5.6, 4);
    if (anim) popIn(g);
  },
  castle(anim) {
    const g = new THREE.Group(); g.position.set(-5.5, 0, 87.6); scene.add(g); castleG = g;
    mesh(G.box, 0x9a9a98, [4.4, 3.6, 3.8], [0, 1.8, 0], g);
    for (let i = -2; i <= 2; i++) for (const z of [-1.9, 1.9]) mesh(G.box, 0x8a8a88, [.45, .5, .3], [i*.95, 3.85, z], g);
    for (const [x, z] of [[-2.3, -2], [2.3, -2], [-2.3, 2], [2.3, 2]]) {
      mesh(G.cyl, 0xa4a4a2, [.85, 5, .85], [x, 2.5, z], g);
      mesh(G.cone, 0x3a5ab0, [1, 1.6, 1], [x, 5.8, z], g);
    }
    mesh(G.box, 0x2a1d12, [1.2, 1.8, .1], [0, .9, -1.92], g);
    mesh(G.cyl, 0x5e3f22, [.06, 2.4, .06], [0, 4.8, 0], g);
    ST.flag3 = mesh(G.box, 0xf0c030, [1, .55, .03], [.52, 5.7, 0], g);
    fader(g, 6.4, 6.6);
    if (anim) popIn(g);
  },
  boatyard(anim) {
    const g = new THREE.Group(); scene.add(g);
    for (let i = 0; i < 6; i++) mesh(G.box, i % 2 ? 0x9a6b40 : 0x8a5d36, [.5, .14, 1.8], [-12.9 + i*.52, .22, -7.2], g);
    for (const z of [-8, -6.4]) mesh(G.cyl, 0x5e3f22, [.09, .7, .09], [-14.2, .1, z], g);
    if (anim) popIn(g);
  },
});
