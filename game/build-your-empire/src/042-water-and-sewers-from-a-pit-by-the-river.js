// ------------------------------------------------------------------ water and sewers, from a pit by the river to a modern plant
let wellG = null, wheel = null, clarifiers = [], pumpSmoke = null, fountainAt = null;
const WATER_TXT = [null,
  ['🪣 Viking well house', 'A covered well, a trough and the first latrine. Guests pay 6% more and wait longer.'],
  ['⛲ Roman aqueduct', 'Arches carry water from the hills to a fountain, and stone drains run under the streets.'],
  ['⚙️ Medieval water wheel', 'A wheel on the river fills a stone cistern for the whole town.'],
  ['🏭 Victorian waterworks', 'A steam pump, an iron water tower and sewers under every street.'],
  ['💧 Modern water plant', 'Treated water on tap and a sewage plant outside town. Guests pay 30% more.']];
function waterStage(n, anim) {
  W.water = n;
  if (wellG) { scene.remove(wellG); const i = FADERS.findIndex(f => f.g === wellG); if (i >= 0) FADERS.splice(i, 1); }
  const ci = circles.findIndex(c => c.x === 9 && c.z === -7); if (ci >= 0) circles.splice(ci, 1);
  if (!boxes.some(b => b.water)) boxes.push({x0:7.3, x1:10.7, z0:-8.7, z1:-5.75, water:true});
  if (pumpSmoke) { smokers.splice(smokers.indexOf(pumpSmoke), 1); pumpSmoke = null; }
  fountainAt = null;
  const g = new THREE.Group(); g.position.set(9, 0, -7.2); scene.add(g); wellG = g;
  const BLUE = 0x3a9ad0;
  if (n === 1) {
    mesh(G.cyl, 0x7a5a3a, [.62, .7, .62], [-.5, .35, 0], g); mesh(G.cyl, 0x2b6f95, [.5, .02, .5], [-.5, .71, 0], g);
    for (const x of [-1.1, .1]) mesh(G.box, 0x5e3f22, [.12, 1.7, .12], [x, .85, 0], g);
    for (const s of [-1, 1]) mesh(G.box, 0x6a4a2a, [1.6, .08, .8], [-.5, 1.95, s*.3], g).rotation.x = s*.6;
    for (const x of [-1.35, .35]) { mesh(G.box, 0x4a3018, [.1, .55, .1], [x, 2.2, 0], g); mesh(G.box, 0x4a3018, [.26, .12, .12], [x + Math.sign(x + .5)*.1, 2.48, 0], g); }
    mesh(G.cyl, 0x5e3f22, [.05, 1.2, .05], [-.5, 1.45, 0], g).rotation.z = Math.PI/2;
    mesh(G.cyl, 0x8a6a3a, [.13, .2, .13], [-.5, 1.05, 0], g);
    mesh(G.box, 0x6a4a2a, [1.1, .35, .4], [.9, .18, .9], g); mesh(G.box, 0x2b6f95, [1, .02, .3], [.9, .36, .9], g);
    // the first latrine, with a moon on the door
    mesh(G.box, 0x7a5a36, [.75, 1.3, .75], [1.1, .65, -.7], g); mesh(G.box, 0x5a3a20, [.95, .08, .95], [1.1, 1.36, -.7], g).rotation.z = .15;
    mesh(G.box, 0x4a3018, [.05, .9, .42], [1.49, .5, -.7], g); mesh(G.sph, 0xf2d060, [.06, .06, .02], [1.52, .95, -.7], g);
  } else if (n === 2) {
    const MARB = 0xf1ece0;
    mesh(G.cyl, MARB, [1.05, .45, 1.05], [-.3, .22, 0], g); mesh(G.cyl, BLUE, [.92, .03, .92], [-.3, .45, 0], g, {roughness:.1, metalness:.2});
    mesh(G.cyl, MARB, [.14, 1.1, .14], [-.3, .9, 0], g); mesh(G.cyl, MARB, [.42, .1, .42], [-.3, 1.45, 0], g); mesh(G.cyl, BLUE, [.36, .02, .36], [-.3, 1.5, 0], g);
    mesh(G.cap, 0xd8d2c4, [.3, .45, .3], [-.3, 1.85, 0], g); mesh(G.sph, 0xd8d2c4, [.12, .12, .12], [-.3, 2.2, 0], g);
    // the castellum, where the aqueduct's water arrives
    mesh(G.box, 0xd9cdb0, [.9, 2.2, .9], [1.15, 1.1, -.65], g);
    mesh(G.cone4, 0xb8442e, [.75, .5, .75], [1.15, 2.45, -.65], g).rotation.y = Math.PI/4;
    mesh(G.box, 0x2a1d12, [.05, .7, .35], [1.61, .35, -.65], g);
    for (const [x, z] of [[1.1, .9], [-1.4, 1.05]]) { mesh(G.box, 0x6a5a3a, [.42, .03, .42], [x, .02, z], g); for (let i = -1; i <= 1; i++) mesh(G.box, 0x2a2420, [.04, .035, .38], [x + i*.12, .025, z], g); }
    fountainAt = new THREE.Vector3(8.7, 1.55, -7.2);
    if (!waterStage.aq) {
      // the aqueduct runs along the north wall from the hills
      const aq = new THREE.Group(); scene.add(aq); waterStage.aq = aq;
      const STONE = 0xcdb994, archG = new THREE.RingGeometry(.42, .62, 14, 1, 0, Math.PI);
      for (let x = -5.6; x <= 14.2; x += 1.4) mesh(G.box, STONE, [.32, 2.6, .5], [x, 1.3, -13.55], aq);
      mesh(G.box, STONE, [20, .45, .62], [4.2, 2.8, -13.55], aq); mesh(G.box, BLUE, [20, .04, .3], [4.2, 3.04, -13.55], aq);
      for (let x = -4.9; x < 14.2; x += 1.4) {
        const a = new THREE.Mesh(archG, mat(0xbfa982, {side:THREE.DoubleSide})); a.position.set(x, 1.95, -13.28); aq.add(a);
      }
      if (anim) popIn(aq);
    }
  } else if (n === 3) {
    mesh(G.cyl, 0x8f8a80, [.85, 2.4, .85], [-.4, 1.2, -.1], g);
    for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; mesh(G.box, 0x8f8a80, [.22, .3, .22], [-.4 + Math.cos(a)*.78, 2.55, -.1 + Math.sin(a)*.78], g); }
    mesh(G.cone, 0x4a5a6a, [1, 1.3, 1], [-.4, 3.2, -.1], g);
    mesh(G.box, 0x2a1d12, [.05, .8, .45], [.45, .4, -.1], g);
    mesh(G.box, 0x8f8a80, [1.1, .4, .45], [.9, .2, .95], g); mesh(G.box, BLUE, [1, .02, .32], [.9, .41, .95], g);
    mesh(G.box, 0x5e3f22, [.14, 1.1, .14], [1.3, .55, .95], g); mesh(G.box, 0x3a3a3e, [.6, .06, .06], [1.05, 1.08, .95], g, {metalness:.5}).rotation.z = -.4;
    mesh(G.box, 0x6a665e, [.25, .03, 1.3], [1.15, .02, -.4], g);
    if (!wheel) {
      // a water wheel on the river turns the town's pump
      const p = new THREE.Group(); p.position.set(-11.2, 0, 12.8); scene.add(p);
      mesh(G.box, 0x8f8a80, [.45, 1.4, .6], [.75, .2, 0], p);
      wheel = new THREE.Group(); wheel.position.set(0, .55, 0); p.add(wheel);
      const rim = new THREE.TorusGeometry(1.1, .05, 6, 24);
      for (const x of [-.25, .25]) { const r = new THREE.Mesh(rim, mat(0x6b4526)); r.rotation.y = Math.PI/2; r.position.x = x; wheel.add(r); }
      for (let i = 0; i < 10; i++) {
        const a = i/10*Math.PI*2, s = new THREE.Group(); s.rotation.x = a; wheel.add(s);
        mesh(G.box, 0x5e3f22, [.06, 1.1, .06], [0, .55, 0], s); mesh(G.box, 0x8a5a2b, [.55, .32, .06], [0, 1.08, 0], s);
      }
      mesh(G.cyl, 0x3a3a3e, [.08, .9, .08], [.3, 0, 0], wheel).rotation.z = Math.PI/2;
      if (anim) popIn(p);
    }
  } else if (n === 4) {
    mesh(G.box, 0x9a4a32, [1.7, 1.5, 1.4], [-.65, .75, .25], g);
    mesh(G.cone4, 0x4a5058, [1.35, .7, 1.15], [-.65, 1.85, .25], g).rotation.y = Math.PI/4;
    for (const x of [-1.1, -.2]) mesh(G.box, WIN, [.3, .45, .05], [x, .85, .96], g);
    mesh(G.cyl, 0x8a3a28, [.17, 2.8, .17], [-1.2, 1.4, -.25], g); mesh(G.cyl, 0x2a2a2e, [.21, .15, .21], [-1.2, 2.85, -.25], g);
    pumpSmoke = {x:9 - 1.2, y:3, z:-7.2 - .25}; smokers.push(pumpSmoke);
    for (const [x, z] of [[.7, -.9], [1.5, -.9], [.7, -.1], [1.5, -.1]]) mesh(G.cyl, 0x3a3e42, [.06, 3, .06], [x, 1.5, z], g, {metalness:.5});
    mesh(G.cyl, 0x5a6a5a, [.68, 1.1, .68], [1.1, 3.5, -.5], g, {metalness:.5, roughness:.4});
    mesh(G.cone, 0x3a4a3a, [.74, .45, .74], [1.1, 4.27, -.5], g, {metalness:.5});
    mesh(G.box, 0xf4f4f4, [.9, .2, .02], [1.1, 3.6, .19], g);
    if (!waterStage.manholes) {
      // cast-iron manholes over the new sewers, all over town
      waterStage.manholes = true;
      for (const [x, z] of [[0, -3.4], [6.6, -1.4], [-7.6, -2.4], [2.6, 9.8], [11.4, 1.2], [-2.8, 63.8], [38, -.6], [41.6, -6], [40.5, 66], [5.8, -35.2], [37.2, -39], [-6.8, 12.6], [7.6, 69.2]]) {
        mesh(G.cyl, 0x34363a, [.3, .03, .3], [x, .025, z], scene, {metalness:.6, roughness:.5});
        mesh(G.cyl, 0x4a4c50, [.2, .035, .2], [x, .03, z], scene, {metalness:.6, roughness:.5});
      }
    }
  } else {
    mesh(G.box, 0xeef1f4, [1.8, 1.2, 1.3], [-.7, .6, .3], g);
    mesh(G.box, 0x8fc6e8, [1.82, .35, 1.32], [-.7, .75, .3], g, {metalness:.5, roughness:.15});
    mesh(G.box, 0xdfe4ea, [1.9, .08, 1.4], [-.7, 1.24, .3], g);
    mesh(G.cyl, 0xeef1f4, [.22, 3.8, .22], [1, 1.9, -.4], g);
    mesh(G.sph, 0xdcecf6, [1, .9, 1], [1, 4.4, -.4], g, {metalness:.25, roughness:.3});
    mesh(G.cyl, 0x2f7fd0, [1.01, .16, 1.01], [1, 4.4, -.4], g);
    for (let i = 0; i < 3; i++) mesh(G.cyl, 0x9aa0a8, [.07, .5, .07], [-1.3 + i*.6, .25, -.65], g, {metalness:.6});
    if (!clarifiers.length) {
      // the sewage plant, out past the railway
      clearForest({x0:55, x1:63, z0:-10.5, z1:-2});
      const p = new THREE.Group(); scene.add(p);
      for (const [x, z] of [[57.2, -7.4], [60.6, -4.4]]) {
        mesh(G.cyl, 0xb8bcc2, [1.6, .7, 1.6], [x, .1, z], p); mesh(G.cyl, 0x4a8fb0, [1.45, .02, 1.45], [x, .46, z], p, {roughness:.1, metalness:.2});
        const arm = new THREE.Group(); arm.position.set(x, .62, z); p.add(arm); mesh(G.box, 0xf2c200, [3, .1, .18], [0, 0, 0], arm); clarifiers.push(arm);
      }
      mesh(G.box, 0xdfe4ea, [2.2, 1.4, 1.6], [60.6, .7, -8.2], p); mesh(G.box, 0x8fc6e8, [2.22, .3, 1.62], [60.6, .9, -8.2], p, {metalness:.5, roughness:.15});
      mesh(G.cyl, 0x9aa0a8, [.12, 3.4, .12], [58.9, .2, -5.9], p, {metalness:.6}).rotation.x = Math.PI/2;
      if (anim) popIn(p);
    }
  }
  fader(g, 3.4, n >= 4 ? 4.6 : 2.6);
  if (anim) { popIn(g); banner(...WATER_TXT[n]); }
}

