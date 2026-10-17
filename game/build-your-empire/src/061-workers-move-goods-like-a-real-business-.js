// ------------------------------------------------------------------ workers move goods like a real business: trays, wheelbarrows, carts, then trucks
const TRAY_KINDS = new Set(['burgercook', 'bunbaker', 'gardener', 'waiter', 'armorer', 'quartermaster', 'barkeep', 'treasurer', 'porter', 'butcher', 'fisher']);
const CARRY = {
  tray:{z:.42, y:1.02, nx:3, nz:2, sx:.15, sz:.13, step:.5, speed:1},
  scooter:{z:-.62, y:1.02, nx:2, nz:1, sx:.16, sz:.14, step:.5, speed:1.5},
  van:{z:-.62, y:.74, nx:3, nz:3, sx:.2, sz:.18, step:.42, speed:1.9},
  barrow:{z:.9, y:.48, nx:3, nz:2, sx:.16, sz:.14, step:.45, speed:1},
  cart:{z:1.1, y:.66, nx:3, nz:3, sx:.19, sz:.17, step:.42, speed:1.15},
  truck:{z:-.62, y:.74, nx:3, nz:3, sx:.22, sz:.2, step:.4, speed:1.6},
  dozer:{z:1.12, y:.95, nx:3, nz:2, sx:.22, sz:.18, step:.42, speed:1.75},
};
const fleetLvl = () => ['fleet1', 'fleet2', 'fleet3', 'fleet4'].filter(id => W.unlocked.has(id)).length;
const FLEET_N = ['', '🚐 Delivery vans', '🚚 Box trucks', '🚛 Semi-trucks', '🔋 Electric fleet'];
function fleetUp(n, anim) {
  WORKER.cap += [0, 4, 6, 8, 10][n];
  for (const w of workers) { w.cap = WORKER.cap + (w.kind === 'builder' ? 10 : 0); w.carry = null; equip(w); }
  if (anim) banner(`${FLEET_N[n]}!`, `Every hauler drives now: ${Math.round((1.6 + .4*n)/1.6*100 - 100)}% faster than the old trucks, and carrying more.`);
}
// builders and stonemasons drive bulldozers once there are tools to build them
const DOZER_KINDS = new Set(['builder', 'mason']);
const carryMode = w => DOZER_KINDS.has(w.kind) && W.unlocked.has('bulldozers') ? 'dozer' : TRAY_KINDS.has(w.kind) ? (W.unlocked.has('foodVans') ? 'van' : W.unlocked.has('scooters') ? 'scooter' : 'tray') : W.era >= 7 || fleetLvl() ? 'truck' : W.era >= 3 ? 'cart' : 'barrow';
function equip(w) {
  if (w.kind === 'broker' || w.kind === 'oilman') return;
  const mode = carryMode(w), C = CARRY[mode];
  w.speed = WORKER.speed * (mode === 'truck' || mode === 'dozer' ? C.speed + .4*fleetLvl() : C.speed);
  if (w.carry === mode && w.carryG && w.carryG.parent === w.char.g) return;
  if (w.carryG && w.carryG.parent) w.carryG.parent.remove(w.carryG);
  w.carry = mode; const g = w.carryG = new THREE.Group(); w.char.g.add(g);
  const M = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (mode === 'tray') M(G.cyl, 0xb8bcc2, [.3, .03, .25], [0, w.char.real ? 1.27 : .99, .42], {metalness:.6});
  else if (mode === 'scooter') {
    // a step-through scooter, the rider sitting on it, an insulated food box on the rack behind
    const col = [0xd9443a, 0x3f9a6a, 0xf2a21a, 0x3f7cc0][(w.kind.length*5 + workers.indexOf(w)) % 4];
    M(G.box, col, [.34, .3, .95], [0, .38, -.05], {metalness:.3, roughness:.35}); M(G.box, col, [.36, .5, .12], [0, .55, .42], {metalness:.3, roughness:.35});
    M(G.box, 0x1a1a1e, [.3, .08, .5], [0, .62, -.2]);
    M(G.cyl, 0x8a8f96, [.025, .55, .025], [0, .8, .48], {metalness:.7}); M(G.cyl, 0x2a2a2e, [.025, .5, .025], [0, 1.06, .48], {metalness:.6}).rotation.z = Math.PI/2;
    for (const z of [.5, -.48]) { M(G.cyl, 0x1a1a1a, [.19, .1, .19], [0, .19, z]).rotation.z = Math.PI/2; M(G.cyl, 0xb8bcc2, [.1, .11, .1], [0, .19, z], {metalness:.7}).rotation.z = Math.PI/2; }
    bulb(g, 0, .72, .5, 0xfff2c8, .05);
    M(G.box, 0xc8222a, [.44, .4, .4], [0, .82, -.62]); M(G.box, 0xf4f4f4, [.45, .06, .41], [0, .9, -.62]);
  } else if (mode === 'van') {
    // a little food delivery van: white, a red stripe, a glass cab and an open rack behind
    M(G.box, 0xf4f4f4, [.92, .8, .8], [0, .62, .5], {roughness:.4}); M(G.box, 0x8fc6e8, [.84, .32, .04], [0, .84, .91], {metalness:.5, roughness:.1});
    M(G.box, 0x3a3e44, [.94, .12, 2], [0, .22, -.05]); M(G.box, 0xf4f4f4, [.94, .08, 1.15], [0, .33, -.6]);
    for (const sx of [-1, 1]) { M(G.box, 0xf4f4f4, [.04, .3, 1.15], [sx*.46, .5, -.6]); M(G.box, 0xd9443a, [.02, .08, 1.95], [sx*.48, .42, -.05]); }
    M(G.box, 0xf4f4f4, [.94, .3, .04], [0, .5, -1.17]);
    for (const [x, z] of [[-.48, .45], [.48, .45], [-.48, -.76], [.48, -.76]]) M(G.cyl, 0x1a1a1a, [.19, .14, .19], [x, .19, z]).rotation.z = Math.PI/2;
    for (const sx of [-.3, .3]) bulb(g, sx, .5, .91, 0xfff2c8, .06);
  }
  else if (mode === 'barrow') {
    M(G.box, 0x3f7cc0, [.56, .22, .5], [0, .4, .92], {metalness:.3}); M(G.box, 0x2f5c90, [.6, .04, .54], [0, .52, .92]);
    M(G.cyl, 0x1a1a1a, [.16, .06, .16], [0, .16, 1.25]).rotation.z = Math.PI/2;
    for (const sx of [-1, 1]) { const h = M(G.box, 0x6b4526, [.04, .04, .7], [sx*.2, .62, .52]); h.rotation.x = .25; M(G.box, 0x6b4526, [.04, .3, .04], [sx*.2, .2, .74]); }
  } else if (mode === 'cart') {
    M(G.box, 0x8a5d36, [.8, .1, .74], [0, .58, 1.1]);
    for (const sx of [-1, 1]) { M(G.box, 0x7a5232, [.05, .2, .74], [sx*.4, .7, 1.1]); M(G.cyl, 0x5e3f22, [.3, .06, .3], [sx*.46, .3, 1.1]).rotation.z = Math.PI/2; M(G.box, 0x6b4526, [.04, .04, .8], [sx*.22, .62, .45]); }
    M(G.box, 0x7a5232, [.8, .2, .05], [0, .7, 1.47]);
  } else if (mode === 'dozer') {
    // a yellow bulldozer: steel tracks, an engine deck, a glass cab, and the blade raised in front with the load on it
    const Y = 0xf2b51a, D = 0x2a2a2e;
    for (const sx of [-1, 1]) { M(G.box, D, [.24, .3, 1.5], [sx*.42, .17, 0], {roughness:.8}); for (const z of [-.6, -.2, .2, .6]) M(G.cyl, 0x5a5a60, [.12, .26, .12], [sx*.42, .17, z], {metalness:.6}).rotation.z = Math.PI/2; }
    M(G.box, Y, [.62, .32, 1.2], [0, .48, -.05], {roughness:.45}); M(G.box, Y, [.58, .22, .5], [0, .74, -.42], {roughness:.45});
    M(G.box, 0x1a1a1e, [.5, .5, .5], [0, .9, .12]); M(G.box, 0x8fc6e8, [.46, .34, .02], [0, .95, .38], {metalness:.5, roughness:.1});
    for (const sx of [-1, 1]) M(G.box, 0x8fc6e8, [.02, .3, .4], [sx*.255, .95, .12], {metalness:.5, roughness:.1});
    M(G.box, Y, [.56, .05, .56], [0, 1.17, .12]);
    M(G.cyl, 0x3a3a3e, [.04, .4, .04], [.2, 1, -.5], {metalness:.6});
    // the arms and the blade
    for (const sx of [-1, 1]) { const a = M(G.box, Y, [.06, .06, .8], [sx*.36, .62, .62]); a.rotation.x = -.35; }
    M(G.box, Y, [1.05, .5, .08], [0, .78, 1.02], {metalness:.3, roughness:.4}); M(G.box, 0x9aa0a8, [1.05, .06, .3], [0, .54, 1.12], {metalness:.7, roughness:.3});
    bulb(g, -.18, 1.12, .4, 0xfff2c8, .05); bulb(g, .18, 1.12, .4, 0xfff2c8, .05); bulb(g, 0, 1.25, .12, 0xff8a1a, .05);
    M(G.sph, 0xe8b892, [.13, .13, .13], [0, 1.0, .12]); M(G.sph, 0xf2c200, [.15, .08, .15], [0, 1.1, .12]);
  } else {
    // a small delivery truck, the driver at the wheel
    const fl = fleetLvl(), col = fl >= 4 ? 0xf4f6f8 : [0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a, 0xf4f4f4][(w.kind.length*7 + workers.indexOf(w)) % 5];
    g.scale.setScalar(1 + .12*fl);   // bigger trucks as the fleet grows
    M(G.box, col, [.9, .75, .78], [0, .62, .5]); M(G.box, 0x8fc6e8, [.82, .3, .04], [0, .82, .9], {metalness:.5, roughness:.1});
    M(G.box, 0x3a3e44, [.92, .12, 1.95], [0, .22, -.05]); M(G.box, col, [.92, .06, 1.15], [0, .32, -.58]);
    for (const sx of [-1, 1]) M(G.box, col, [.04, .26, 1.15], [sx*.45, .48, -.58]);
    M(G.box, col, [.92, .26, .04], [0, .48, -1.15]);
    for (const [x, z] of [[-.47, .45], [.47, .45], [-.47, -.75], [.47, -.75]]) M(G.cyl, 0x1a1a1a, [.19, .14, .19], [x, .19, z]).rotation.z = Math.PI/2;
    for (const sx of [-.3, .3]) bulb(g, sx, .5, .9, 0xfff2c8, .06);
    if (fl >= 4) for (const sx of [-1, 1]) M(G.box, 0x2fbf6a, [.02, .08, 1.9], [sx*.47, .4, -.05]);   // the electric fleet's green stripe
    M(G.sph, 0xe8b892, [.15, .15, .15], [0, .92, .45]); M(G.cyl, LOOKS[w.kind]?.hatCol || 0x3a3a3a, [.16, .08, .16], [0, 1.06, .45]);
  }
  // in a truck the walking figure is tucked away; the driver sits in the cab
  w.char.g.children.forEach(o => { if (o === g) return; o.visible = mode !== 'truck' && mode !== 'van' && mode !== 'dozer'; if (o.userData.y0 == null) o.userData.y0 = o.position.y; o.position.y = o.userData.y0 + (mode === 'scooter' ? (w.char.real ? -.36 : -.1) : 0); });
  w.stack.layout = (i, it) => {
    const per = C.nx*C.nz, l = Math.floor(i / per), k = i % per;
    const lx = ((k % C.nx) - (C.nx - 1)/2)*C.sx*1.8, lz = C.z + (Math.floor(k / C.nx) - (C.nz - 1)/2)*C.sz*1.8;
    const s = Math.sin(w.yaw), c = Math.cos(w.yaw), h = ITEM[it.type].h;
    return {x:w.pos.x + lx*c + lz*s, y:C.y + (w.char.real && mode === 'tray' ? .28 : 0) + l*h*C.step + h/2 + w.char.g.position.y, z:w.pos.z - lx*s + lz*c, ry:w.yaw};
  };
}
function poseCarry(w) {
  if (w.carry === 'barrow' || w.carry === 'cart') w.char.armL.rotation.x = w.char.armR.rotation.x = -.95;
  else if (w.carry === 'tray' && w.stack.length) w.char.armL.rotation.x = w.char.armR.rotation.x = -1.3;
  else if (w.carry === 'scooter') { w.char.armL.rotation.x = w.char.armR.rotation.x = -1.15; w.char.legL.rotation.x = w.char.legR.rotation.x = -.95; }
}

