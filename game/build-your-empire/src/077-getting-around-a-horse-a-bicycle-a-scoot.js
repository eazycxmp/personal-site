// ------------------------------------------------------------------ getting around: a horse, a bicycle, a scooter, a car and finally a jetpack
const MOUNTS = [null,
  {n:'Horse', icon:'🐴', speed:1.25, y:.55}, {n:'Bicycle', icon:'🚲', speed:1.4, y:.28}, {n:'Scooter', icon:'🛵', speed:1.6, y:.32},
  {n:'Car', icon:'🚗', speed:1.85, y:.3}, {n:'Jetpack', icon:'🎒', speed:2.1, y:.15}, {n:'Motorcycle', icon:'🏍️', speed:2.0, y:.32}];
let mountG = null, jetFlame = null;
function mountStage(n, anim) {
  W.mount = n;
  if (mountG) player.char.g.remove(mountG);
  const M = MOUNTS[n], g = mountG = new THREE.Group(); g.position.y = -M.y; player.char.g.add(g); jetFlame = null;
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (n === 1) {
    P(G.box, 0x7a4a26, [.42, .5, 1.3], [0, .85, 0]); P(G.box, 0x7a4a26, [.24, .6, .28], [0, 1.25, .62]).rotation.x = -.5; P(G.box, 0x6a3e20, [.2, .2, .5], [0, 1.5, .85]);
    P(G.box, 0x2a1a10, [.06, .4, .3], [0, 1.3, .48]); P(G.box, 0x8a2a1e, [.46, .08, .5], [0, 1.12, -.05]);
    g.legs = []; for (const [x, z] of [[-.14, -.48], [.14, -.48], [-.14, .48], [.14, .48]]) { const l = new THREE.Group(); l.position.set(x, .62, z); g.add(l); mesh(G.box, 0x4a2a14, [.1, .62, .1], [0, -.31, 0], l); g.legs.push(l); }
    P(G.box, 0x2a1a10, [.06, .5, .06], [0, .9, -.68]).rotation.x = .6;
  } else if (n === 2) {
    for (const z of [-.5, .5]) P(G.cyl, 0x1a1a1a, [.32, .04, .32], [0, .32, z]).rotation.z = Math.PI/2;
    P(G.box, 0xd9443a, [.05, .05, 1], [0, .5, 0], {metalness:.6}); P(G.box, 0xd9443a, [.05, .45, .05], [0, .6, -.15], {metalness:.6}); P(G.box, 0x2a2a2e, [.4, .04, .04], [0, .85, .45]);
  } else if (n === 3) {
    P(G.box, 0x3fb0c0, [.4, .35, 1.1], [0, .45, 0]); P(G.box, 0x3fb0c0, [.36, .5, .2], [0, .75, .5]);
    for (const z of [-.45, .45]) P(G.cyl, 0x1a1a1a, [.2, .12, .2], [0, .2, z]).rotation.z = Math.PI/2;
    P(G.box, 0x2a2a2e, [.45, .04, .04], [0, 1.05, .55]); bulb(g, 0, .85, .62, 0xfff2c8, .05);
  } else if (n === 6 && MODELS.road && MODELS.road.getObjectByName('motorcycle')) {
    // a red sport bike; you lean into it
    const src = MODELS.road.getObjectByName('motorcycle').clone(true); src.position.set(0, 0, 0);
    const c = new THREE.Group(); c.add(src); c.scale.setScalar(1.25); c.rotation.y = 0; g.add(c); g.wheels = [];
    src.traverse(o => { if (/^moto_wheel\d$/.test(o.name)) g.wheels.push(o); if (o.isMesh) o.castShadow = true; });
    g.position.y -= .05;
  } else if (n === 4 && MODELS.car) {
    // a low red sports car; you sit in the cockpit
    const c = model('car', 2.5, 'z'); c.position.y = .02; g.add(c); g.wheels = [];
    c.traverse(o => { if (/^car_wheel\d$/.test(o.name)) g.wheels.push(o); });
    g.position.y -= .25;
  } else if (n === 4) {
    P(G.box, 0xd9443a, [1, .45, 1.9], [0, .45, 0], {metalness:.4, roughness:.3}); P(G.box, 0x8fc6e8, [.9, .3, .8], [0, .82, -.05], {metalness:.5, roughness:.1});
    for (const [x, z] of [[-.5, .6], [.5, .6], [-.5, -.6], [.5, -.6]]) P(G.cyl, 0x1a1a1a, [.2, .12, .2], [x, .2, z]).rotation.z = Math.PI/2;
    for (const x of [-.3, .3]) bulb(g, x, .5, .96, 0xfff2c8, .05);
  } else if (n === 5) {
    P(G.box, 0x8a8f96, [.45, .55, .25], [0, 1.15, -.3], {metalness:.7, roughness:.3});
    for (const x of [-.14, .14]) P(G.cyl, 0x3a3e44, [.08, .3, .08], [x, .8, -.3], {metalness:.6});
    jetFlame = new THREE.Group(); g.add(jetFlame);
    for (const x of [-.14, .14]) { const f = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0x5af0ff, toneMapped:false})); f.scale.set(.08, .35, .08); f.rotation.x = Math.PI; f.position.set(x, .5, -.3); jetFlame.add(f); }
  }
  if (anim) { puff(player.pos.x, player.pos.z); banner(`${M.icon} ${M.n}!`, `You get around ${Math.round((M.speed - 1)*100)}% faster.${n === 5 ? ' And you fly over buildings.' : ''}`); }
}
function updMount(dt) {
  // riding: the hero sits (or hovers, on the jetpack) instead of running along
  player.char.ride = !W.mount ? null : W.mount === 5 ? 'hover' : 'seat';
  if (!W.mount) { player.rideY = 0; return; }
  const M = MOUNTS[W.mount], moving = Math.hypot(player.vel.x, player.vel.z) > .3;
  player.rideY += ((W.mount === 5 && moving ? 1.3 : M.y) - (player.rideY || 0)) * Math.min(1, dt*4);
  if (mountG) mountG.position.y = -player.rideY;
  if (mountG && mountG.legs) mountG.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(time*12 + i*1.6)*.6 : 0; });
  if (mountG && mountG.wheels && moving) mountG.wheels.forEach(w => { w.rotation.x += dt*14; });
  if (jetFlame) { jetFlame.visible = moving; jetFlame.scale.y = .8 + Math.sin(time*30)*.2; if (moving && R() < dt*20) particle(0xd8f0ff, player.pos.clone().setY(player.rideY + .3), new THREE.Vector3((R() - .5), -1.5, (R() - .5)), .5, .1, {grow:.5, op:.5}); }
  // riding: legs out on the horse, bike and scooter; tucked away in the car
  if (W.mount <= 3 || W.mount === 6) { player.char.legL.rotation.x = player.char.legR.rotation.x = -1.2; player.char.legL.rotation.z = .3; player.char.legR.rotation.z = -.3; }
  else { player.char.legL.rotation.z = player.char.legR.rotation.z = 0; }
}

