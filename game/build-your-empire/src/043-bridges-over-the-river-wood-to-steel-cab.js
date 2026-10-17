// ------------------------------------------------------------------ bridges over the river, wood to steel cables
let bridgeG = null;
const BR = {z:4.6, x0:-21.2, x1:-9.9}, walkers = [];
const DECK = [0, .18, .43, .38, .62];
function bridgeStage(n, anim) {
  W.bridge = n;
  if (bridgeG) scene.remove(bridgeG);
  if (n === 1) {
    makeCash('toll', -6.4, 4.6); clearForest({x0:-32, x1:-18, z0:3.4, z1:5.8}); slab(0xb98f5c, 9, 1.6, -27.3, BR.z, .006); slab(0xb98f5c, 5, 2.8, -20.7, BR.z, .006);
    AREAS.push({x0:-31.6, x1:BR.x1 + .4, z0:BR.z - .68, z1:BR.z + .68}, {x0:-31.6, x1:BR.x0, z0:BR.z - 1.4, z1:BR.z + 1.4});   // you can walk the bridge and the road beyond
  }
  const g = new THREE.Group(); g.position.set((BR.x0 + BR.x1)/2, 0, BR.z); scene.add(g); bridgeG = g;
  const L = BR.x1 - BR.x0;
  if (n === 1) {
    for (let i = 0; i < 14; i++) mesh(G.box, i % 2 ? 0x9a6b40 : 0x8a5d36, [.58, .1, 1.5], [-L/2 + .3 + i*.6, .12, 0], g);
    for (const x of [-2.6, -.9, .9, 2.6]) for (const z of [-.7, .7]) mesh(G.cyl, 0x5e3f22, [.09, 1.3, .09], [x, -.1, z], g);
    for (let x = -L/2 + .2; x <= L/2; x += 1.3) for (const z of [-.72, .72]) mesh(G.box, 0x5e3f22, [.07, .6, .07], [x, .42, z], g);
    for (const z of [-.72, .72]) mesh(G.cyl, 0xc8b080, [.025, L, .025], [0, .66, z], g).rotation.z = Math.PI/2;
  } else if (n === 2) {
    const ST0 = 0xb7b0a2;
    mesh(G.box, ST0, [L, .35, 1.7], [0, .25, 0], g);
    for (const z of [-.8, .8]) mesh(G.box, 0xa49d90, [L, .42, .18], [0, .63, z], g);
    for (const x of [-1.5, 1.5]) mesh(G.box, ST0, [.6, 1.1, 1.8], [x, -.4, 0], g);
    const ring = new THREE.RingGeometry(.5, .7, 14, 1, 0, Math.PI), hole = new THREE.CircleGeometry(.5, 14, 0, Math.PI);
    for (const x of [-3, 0, 3]) for (const z of [-.86, .86]) {
      const r = new THREE.Mesh(ring, mat(0xc9c2b2, {side:THREE.DoubleSide})); r.position.set(x, -.3, z); g.add(r);
      const h = new THREE.Mesh(hole, mat(0x1f4a5e, {side:THREE.DoubleSide})); h.position.set(x, -.3, z*1.002); g.add(h);
    }
  } else if (n === 3) {
    mesh(G.box, 0x3a3e44, [L, .25, 1.7], [0, .25, 0], g, {metalness:.5}); mesh(G.box, 0x6a5a4a, [L, .02, 1.3], [0, .39, 0], g);
    const IRON = 0x3a6a5a;
    for (const z of [-.85, .85]) {
      mesh(G.box, IRON, [L, .12, .12], [0, 1.7, z], g, {metalness:.5}); mesh(G.box, IRON, [L, .12, .12], [0, .42, z], g, {metalness:.5});
      for (let i = 0; i <= 8; i++) {
        const x = -L/2 + i*L/8;
        mesh(G.box, IRON, [.08, 1.3, .08], [x, 1.06, z], g, {metalness:.5});
        if (i < 8) { const dg = mesh(G.box, IRON, [.07, 1.62, .07], [x + L/16, 1.06, z], g, {metalness:.5}); dg.rotation.z = (i % 2 ? 1 : -1) * .66; }
      }
    }
    for (const x of [-L/2, L/2]) mesh(G.box, IRON, [.12, .12, 1.8], [x, 1.7, 0], g, {metalness:.5});
    for (const x of [-1.6, 1.6]) mesh(G.cyl, 0x8a857c, [.3, 1.2, .3], [x, -.5, 0], g);
  } else {
    const RED = 0xc8452e;
    mesh(G.box, 0x5a5e66, [L + .4, .3, 2], [0, .47, 0], g, {metalness:.3});
    for (let x = -L/2 + .4; x < L/2; x += .9) mesh(G.box, 0xf4f4f4, [.45, .02, .06], [x, .63, 0], g);
    for (const z of [-.95, .95]) mesh(G.box, RED, [L + .4, .25, .08], [0, .75, z], g);
    const T = 2.4, H = 6;
    for (const tx of [-T, T]) {
      for (const z of [-.95, .95]) mesh(G.box, RED, [.32, H + 1, .32], [tx, H/2 - .5, z], g);
      for (const y of [2.6, 4.4, H - .2]) mesh(G.box, RED, [.3, .3, 2.2], [tx, y, 0], g);
    }
    // main cables: down from each tower to the middle and out to the banks
    const cableY = x => { const ax = Math.abs(x); return ax <= T ? 1.4 + (H - 1.4) * Math.pow(ax / T, 2) : H - (H - .8) * ((ax - T) / (L/2 - T)); };
    for (const z of [-.95, .95]) {
      for (let x = -L/2; x < L/2 - .01; x += .35) {
        const x2 = x + .35, y1 = cableY(x), y2 = cableY(x2), len = Math.hypot(.35, y2 - y1);
        const c = mesh(G.cyl, 0xb83a28, [.035, len, .035], [(x + x2)/2, (y1 + y2)/2, z], g); c.rotation.z = Math.atan2(y2 - y1, .35) - Math.PI/2;
        if (Math.abs(x) > .1 && Math.round(x / .35) % 2 === 0) { const hy = cableY(x); mesh(G.cyl, 0xd0d0d0, [.012, hy - .62, .012], [x, (hy + .62)/2, z], g); }
      }
    }
  }
  fader(g, L, n === 4 ? 6 : 2);
  if (anim) {
    popIn(g);
    banner(['', '🌉 Wooden bridge!', '🏛️ Stone bridge!', '🌉 Iron bridge!', '🌁 Suspension bridge!'][n], 'Travelers from the west cross to eat, and every crossing pays a toll.');
  }
}
const WEST_PATH = () => [[BR.x1 - .2, BR.z], [-1, 4.6], [5.6, 4.6], [7.2, 2.4]];
function updBridge(dt) {
  if (!W.bridge) return;
  if (!walkers.length) for (let i = 0; i < 4; i++) {
    const c = makeChar({civ:true});
    walkers.push({c, x:-31 + i*2, dir:i % 2 ? -1 : 1, sp:1.5 + R()*.6, ph:R()*6});
  }
  const top = DECK[W.bridge];
  for (const w of walkers) {
    w.x += w.dir * w.sp * dt;
    if (w.dir > 0 && w.x > BR.x1 - .4) { w.dir = -1; addCash(CASH.toll, 2 + 3*W.bridge, {x:-6.4, z:BR.z}); }
    if (w.dir < 0 && w.x < -31) w.dir = 1;
    const deck = w.x > BR.x0 && w.x < BR.x1;
    w.c.g.position.set(w.x, deck ? top : 0, BR.z + w.dir*.38);
    w.c.g.rotation.y = w.dir > 0 ? Math.PI/2 : -Math.PI/2;
    const s = Math.sin(time*8 + w.ph);
    w.c.legL.rotation.x = s*.7; w.c.legR.rotation.x = -s*.7; w.c.armL.rotation.x = -s*.5; w.c.armR.rotation.x = s*.5;
  }
}

// the commercial bridge: two lanes wide, for builders, bulldozers and vans, so they stop squeezing over the
// airfield's footbridge; routes between the camp and the airfield take it first
const TBR = {z:20, x0:-23.4, x1:-8.6, built:false};
function tradeBridgeFx(anim) {
  if (TBR.built) return; TBR.built = true;
  const g = new THREE.Group(); scene.add(g); const L = TBR.x1 - TBR.x0, cx = (TBR.x0 + TBR.x1)/2;
  mesh(G.box, 0xb8b4ac, [L, .4, 4.6], [cx, .05, TBR.z], g);                                      // the deck
  mesh(G.box, 0x34373c, [L, .04, 3.6], [cx, .27, TBR.z], g);                                      // asphalt
  for (let x = TBR.x0 + 1; x < TBR.x1; x += 2) mesh(G.box, 0xf2c200, [1, .02, .1], [x, .3, TBR.z], g);   // the centre line
  for (const sz of [-2.2, 2.2]) {
    mesh(G.box, 0x8a8f96, [L, .45, .12], [cx, .5, TBR.z + sz], g, {metalness:.5, roughness:.4});  // railings
    for (let x = TBR.x0 + 1.5; x < TBR.x1; x += 4) { mesh(G.cyl, 0x5a5e66, [.05, 2.2, .05], [x, 1.35, TBR.z + sz], g, {metalness:.6}); bulb(g, x, 2.5, TBR.z + sz*.85, 0xffd890, .08); }
  }
  // two concrete arches under the deck, over the water
  for (const x of [-18.6, -13.4]) { mesh(G.box, 0x9a958c, [1, 1.4, 4], [x, -.6, TBR.z], g); }
  AREAS.push({x0:TBR.x0 - .4, x1:TBR.x1 + .4, z0:TBR.z - 2.1, z1:TBR.z + 2.1});
  EDGES.unshift(['camp', 'airfield', [[TBR.x1 + .4, TBR.z], [TBR.x0 - .2, TBR.z]]]);
  for (const w of workers) w.routeKey = null;                       // everyone re-plans their way
  if (anim) { popIn(g); banner('🌉 The commercial bridge!', 'Two lanes over the river to the airfield: builders, bulldozers and vans take it now.'); }
}
