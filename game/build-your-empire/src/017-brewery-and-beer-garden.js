// ------------------------------------------------------------------ brewery and beer garden
function brewery(anim) {
  const g = new THREE.Group(); g.position.set(43.5, 0, 63.5); scene.add(g); if (ST.brewery) ST.brewery.body = g;
  mesh(G.box, 0x8a5a3a, [2.4, 1.6, 1.9], [0, .8, 0], g); roofOn(g, 2.8, 2.4, .8, 2, 0x6a3a2a);
  for (const x of [-.6, .6]) { mesh(G.cyl, 0xc87a3a, [.42, .9, .42], [x, .45, 1.2], g, {metalness:.6, roughness:.3}); mesh(G.sph, 0xc87a3a, [.42, .2, .42], [x, .9, 1.2], g, {metalness:.6, roughness:.3}); }
  mesh(G.cyl, 0x7a7a7e, [.12, .8, .12], [.7, 2.4, -.4], g);
  smokers.push({x:44.2, y:2.9, z:63.1});
  fader(g, 2.6, 2.4);
  if (anim) popIn(g);
}
const SEATS = [...Array(6)].map((_, i) => [43.75 + i*.9, 76.95]);
function beerGardenFx(anim) {
  const g = new THREE.Group(); g.position.set(46, 0, 75.5); scene.add(g);
  mesh(G.box, 0x6b4526, [5.4, .9, 1.2], [0, .45, 0], g); mesh(G.box, 0x9a6a3a, [5.6, .1, 1.4], [0, .95, 0], g);
  mesh(G.box, 0x8a5a2b, [5.6, .12, .45], [0, .44, 1.75], g);
  for (const x of [-2.6, 2.6]) mesh(G.box, 0x5e3f22, [.1, .44, .4], [x, .22, 1.75], g);
  for (const x of [-2.9, 2.9]) mesh(G.cyl, 0x5e3f22, [.06, 2.6, .06], [x, 1.3, -.5], g);
  mesh(G.box, 0x5e3f22, [5.8, .05, .05], [0, 2.5, -.5], g);
  for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(G.sph, new THREE.MeshBasicMaterial({color:[0xffd36b, 0xff9a5a, 0xfff2b0][i % 3], toneMapped:false})); b.scale.setScalar(.07); b.position.set(-2.7 + i*.49, 2.4, -.5); g.add(b); }
  for (const x of [-4.3, 4.3]) { mesh(G.cyl, 0x5e3f22, [.05, 2, .05], [x, 1, 1.6], g); mesh(G.cone, 0xd9443a, [1, .5, 1], [x, 2.1, 1.6], g); }
  boxes.push({x0:43.4, x1:48.6, z0:74.8, z1:76.2});
  fader(g, 5.6, 2.6);
  if (anim) popIn(g);
}
function gardenUpdate(L, dt) {
  if ((L.spawnT -= dt) <= 0) { L.spawnT = 3.2 * (.7 + R()*.6); if (L.q.length < SEATS.length) spawnIn(L); }
  for (const c of [...L.q]) {
    if (c.seat == null) {
      c.seat = SEATS.findIndex((_, i) => !L.q.some(o => o !== c && o.seat === i));
      c.mug = mesh(G.cyl, 0xe0a030, [.09, .18, .09], [0, -.55, .08], c.char.armR); c.mug.visible = false;
    }
    const [sx, sz] = SEATS[c.seat];
    if (!moveTo(c, sx, sz, dt)) continue;
    c.waitT += dt; c.sip = Math.max(0, (c.sip || 0) - dt);
    const w = c.wants[0];
    if (w.need > 0) {
      if ((c.eatT -= dt) <= 0 && L.table.stack.count(['beer'])) {
        c.eatT = 1.4; c.waitT = 0; c.sip = 1.2;
        const it = L.table.stack.take(['beer']); flyAway(it.mesh, () => new THREE.Vector3(c.pos.x, 1.4, c.pos.z), .3);
        w.need--; snd(440 + R()*80, .08, 'triangle', .03);
      }
    } else if (!c.sip && (c.drinkT = (c.drinkT ?? 2) - dt) <= 0) payOut(c, L);
  }
  for (const c of [...L.leaving]) {
    if (!c.route) c.route = L.exit.map(p => [...p]);
    if (moveTo(c, c.route[0][0], c.route[0][1], dt)) {
      c.route.shift();
      if (!c.route.length) { scene.remove(c.char.g); c.el.remove(); L.leaving.splice(L.leaving.indexOf(c), 1); stacks.delete(c.stack); }
    }
  }
}

