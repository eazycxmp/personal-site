// ------------------------------------------------------------------ the line to the next towns: stagecoach, steam, then bullet trains
let railRoadG = null, railsG = null, depotG = null;
function railStage(n, anim) {
  if (n === 1) {
    clearForest({x0:51, x1:57.5, z0:-28.381, z1:48}); clearForest({x0:55, x1:67, z0:95, z1:108});
    railRoadG = slab(0xa58a62, 2.4, RAIL.z1 - RAIL.z0, RAIL.x, (RAIL.z0 + RAIL.z1)/2, .004);
    railRoadG.material[0].map = groundTex([1, 20]);
    const g = new THREE.Group(); scene.add(g);
    const tn = new THREE.Group(); tn.position.set(RAIL.x, 0, RAIL.z0); g.add(tn);
    mesh(G.cone, 0x7d838a, [6, 9, 6], [0, 3.5, -3.5], tn, {flatShading:true});
    mesh(G.box, 0x9a958c, [3, 2.8, .8], [0, 1.4, .2], tn); mesh(G.box, 0x15120f, [1.8, 2.1, .1], [0, 1.05, .62], tn);
    seed = 77;
    for (let i = 0; i < 10; i++) {
      const x = 56.5 + (i % 4)*2.4 + rnd()*.6, z = 97 + Math.floor(i / 4)*3 + rnd()*.6, h = 1.2 + rnd()*1.6, col = [0xe8d8b0, 0xd9a0a0, 0xa0c4d9, 0xe0c890, 0xb8d8a8][i % 5];
      mesh(G.box, col, [1.6, h, 1.5], [x, h/2, z], g); mesh(G.cone4, [0x8a3a2a, 0x4a5a6a, 0x6a3a2a][i % 3], [1.3, .8, 1.2], [x, h + .4, z], g).rotation.y = Math.PI/4;
      mesh(G.box, WIN, [.05, .35, .3], [x - .82, h*.55, z], g);
    }
    if (anim) popIn(g);
  }
  if (n >= 2 && !railsG) {
    railsG = new THREE.Group(); scene.add(railsG);
    const cnt = Math.ceil((RAIL.z1 - RAIL.z0) / .6), sl = new THREE.InstancedMesh(G.box, mat(0x5a3d22), cnt), o = new THREE.Object3D();
    for (let i = 0; i < cnt; i++) { o.position.set(RAIL.x, .03, RAIL.z0 + i*.6); o.scale.set(1.5, .06, .2); o.updateMatrix(); sl.setMatrixAt(i, o.matrix); }
    sl.receiveShadow = true; railsG.add(sl);
    for (const s of [-.42, .42]) mesh(G.box, 0x9aa0a8, [.07, .08, RAIL.z1 - RAIL.z0], [RAIL.x + s, .09, (RAIL.z0 + RAIL.z1)/2], railsG, {metalness:.8, roughness:.3});
    for (const z of [1.6, 3.6, 77.6]) for (const s of [-.9, .9]) mesh(G.box, 0xf4f4f4, [.25, .01, 1.4], [RAIL.x + s, .02, z], railsG);
    railRoadG.material[0].color.set(0x8f8a82); railRoadG.material[0].map = groundTex([1, 30]);
  }
  if (n === 3) {
    // overhead wires for the electric trains
    for (let z = RAIL.z0 + 2; z < RAIL.z1; z += 7) { mesh(G.cyl, 0x8a8f96, [.05, 3.2, .05], [RAIL.x + 1.1, 1.6, z], railsG, {metalness:.6}); mesh(G.box, 0x8a8f96, [1.2, .05, .05], [RAIL.x + .55, 3.1, z], railsG, {metalness:.6}); }
    mesh(G.box, 0x3a3a3e, [.02, .02, RAIL.z1 - RAIL.z0], [RAIL.x, 2.95, (RAIL.z0 + RAIL.z1)/2], railsG);
  }
  if (depotG) { scene.remove(depotG); const i = FADERS.findIndex(f => f.g === depotG); if (i >= 0) FADERS.splice(i, 1); }
  const d = new THREE.Group(); scene.add(d); depotG = d;
  const st = new THREE.Group(); st.position.set(RAIL.x + 2.6, 0, RAIL.stop); d.add(st);
  if (n === 1) {
    // a wooden coaching inn with a hitching rail and a water trough
    mesh(G.box, 0x8a5d36, [2, 1.6, 3.6], [0, .8, 0], st); roofOn(st, 2.4, 4, .9, 2, 0x6a3a22);
    for (const z of [-1, .2]) mesh(G.box, WIN, [.05, .5, .45], [-1.02, .9, z], st);
    mesh(G.box, 0x4a2a14, [.05, 1, .5], [-1.02, .5, 1.1], st);
    for (const z of [-1.4, 1.4]) mesh(G.cyl, 0x5e3f22, [.05, .8, .05], [-2.6, .4, z], d.add(new THREE.Group()) && st);
    mesh(G.box, 0x5e3f22, [.06, .06, 2.8], [-2.6, .75, 0], st);
    mesh(G.box, 0x6b4526, [.5, .35, 1.1], [-2.2, .18, 2.4], st); mesh(G.box, 0x2b6f95, [.4, .02, 1], [-2.2, .36, 2.4], st);
    const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('COACHES', '#4a2a14', '#ffe8b0')})); sign.scale.set(1.5, .45, 1); sign.rotation.y = -Math.PI/2; sign.position.set(-1.04, 1.45, 0); st.add(sign);
  } else {
    const modern = n === 3;
    mesh(G.box, 0xc9c4ba, [1.5, .36, 8], [-4.05, .18, 0], st); mesh(G.box, 0xf2c200, [.1, .01, 8], [-3.38, .365, 0], st);
    for (const z of [-3, -1, 1, 3]) mesh(G.cyl, modern ? 0xdfe4ea : 0x3a3e44, [.06, 2, .06], [-4.4, 1.36, z], st, {metalness:.5});
    mesh(G.box, modern ? 0x8fc6e8 : 0x6a7a8a, [1.3, .08, 8.2], [-4.2, 2.38, 0], st, modern ? {metalness:.5, roughness:.1, transparent:true, opacity:.75} : {metalness:.3});
    if (modern) {
      mesh(G.box, 0xeef1f4, [2.4, 2.6, 5.4], [0, 1.3, 0], st); mesh(G.box, 0x8fc6e8, [2.42, 1.6, 5.2], [0, 1.4, 0], st, {metalness:.5, roughness:.12});
      mesh(G.box, 0xdfe4ea, [2.8, .15, 6], [0, 2.7, 0], st);
      const led = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('EXPRESS ▸', '#0a0f18', '#5af0ff'), toneMapped:false})); led.scale.set(1.8, .5, 1); led.rotation.y = -Math.PI/2; led.position.set(-1.22, 2.25, 0); st.add(led);
    } else {
      mesh(G.box, 0x9a4a32, [2.2, 2.2, 5], [0, 1.1, 0], st); roofOn(st, 2.7, 5.5, 1, 2.7, 0x4a5058);
      for (const z of [-1.6, -.5, .6, 1.7]) mesh(G.box, WIN, [.05, .7, .45], [-1.12, 1.2, z], st);
      mesh(G.box, 0x9a4a32, [.9, 1.2, .9], [0, 3.4, 0], st);
      const face = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xfdfaf0})); face.scale.set(.3, .04, .3); face.rotation.z = Math.PI/2; face.position.set(-.47, 3.5, 0); st.add(face);
      const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('STATION', '#1e3a5a', '#ffffff')})); sign.scale.set(1.6, .5, 1); sign.rotation.y = -Math.PI/2; sign.position.set(-1.14, 2.05, 0); st.add(sign);
    }
  }
  fader(d, 2.6, 4);
  if (anim) popIn(d);
}
function makeWagon(g, cars) {
  const h = new THREE.Group(); g.add(h); cars.push(h); h.legs = [];
  // a team of two real horses when the model has loaded (the old box horses otherwise)
  const team = [-.3, .3].map((x, i) => { const H = horseModel(.3, i ? .72 : 1); if (H) { H.g.position.x = x; h.add(H.g); } return H; });
  if (team.every(Boolean)) h.team = team;
  else for (const x of [-.35, .35]) {
    const horse = new THREE.Group(); horse.position.x = x; h.add(horse);
    mesh(G.box, x < 0 ? 0x6a4226 : 0x3a2618, [.32, .36, .9], [0, .85, 0], horse);
    mesh(G.box, x < 0 ? 0x6a4226 : 0x3a2618, [.18, .45, .2], [0, 1.15, .45], horse).rotation.x = -.5;
    mesh(G.box, x < 0 ? 0x6a4226 : 0x3a2618, [.16, .16, .34], [0, 1.32, .62], horse);
    mesh(G.box, 0x1a1210, [.05, .3, .18], [0, 1.2, .38], horse);
    for (const [lx, lz] of [[-.1, -.32], [.1, -.32], [-.1, .32], [.1, .32]]) {
      const leg = new THREE.Group(); leg.position.set(lx, .7, lz); horse.add(leg); mesh(G.box, 0x2a1a10, [.07, .7, .07], [0, -.35, 0], leg); h.legs.push(leg);
    }
  }
  const w = new THREE.Group(); g.add(w); cars.push(w);
  mesh(G.box, 0x8a5d36, [1.1, .4, 2], [0, .7, 0], w);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 1.9, 14, 1, true, -Math.PI/2, Math.PI), mat(0xf2ecdc, {side:THREE.DoubleSide}));
  cover.rotation.x = Math.PI/2; cover.position.y = .9; cover.castShadow = true; w.add(cover);
  for (const z of [-.7, .7]) for (const x of [-.6, .6]) mesh(G.cyl, 0x5e3f22, [.32, .06, .32], [x, .32, z], w).rotation.z = Math.PI/2;
  const driver = makeChar({body:0x6a3a2a, hat:'straw', pants:0x3a3a4a}); scene.remove(driver.g); driver.g.scale.setScalar(.6); driver.g.position.set(0, .9, 1); w.add(driver.g);
}

