// ------------------------------------------------------------------ getting around: a horse, a bicycle, a scooter, a car and finally a jetpack
const MOUNTS = [null,
  {n:'Horse', icon:'🐴', speed:1.25, y:.55}, {n:'Bicycle', icon:'🚲', speed:1.4, y:.28}, {n:'Scooter', icon:'🛵', speed:1.6, y:.32},
  {n:'Car', icon:'🚗', speed:1.85, y:.3}, {n:'Jetpack', icon:'🎒', speed:2.1, y:.15}, {n:'Motorcycle', icon:'🏍️', speed:2.0, y:.32},
  // flying mounts: they climb to their cruising height while you move and land when you stop (so tiles still work)
  {n:'Your own plane', icon:'🛩️', speed:3.2, y:.7, fly:9}, {n:'Your own dragon', icon:'🐉', speed:3.6, y:.9, fly:7}];
const heroFlies = () => W.mount === 5 || !!(MOUNTS[W.mount] && MOUNTS[W.mount].fly);
let mountG = null, jetFlame = null;
// the horse model: scale, where it sits under you, where its saddle is (under your hips) and how high you ride
const HORSE = {s:.4, z:-.28, seat:-.3, saddle:1.4, ride:.96, walk:1.3, gallop:4.6, IDLES:['Idle', 'Idle', 'Idle_2', 'Idle_Headlow', 'Eating']};
function mountStage(n, anim) {
  W.mount = n;
  if (mountG) player.char.g.remove(mountG);
  if (n === 1 && MODELS.horse && MODELS.horse.userData.anims) MOUNTS[1].y = HORSE.ride;
  const M = MOUNTS[n], g = mountG = new THREE.Group(); g.position.y = -M.y; player.char.g.add(g); jetFlame = null;
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (n === 1 && MODELS.horse && MODELS.horse.userData.anims) {
    // a real horse (Quaternius, CC0) that walks, gallops, idles and grazes; a saddle sits where you do
    const h = skClone(MODELS.horse); h.scale.setScalar(HORSE.s); h.position.z = HORSE.z; g.add(h);
    h.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    // a red blanket, a leather seat with a pommel in front and a cantle behind, and a girth strap round the belly
    const S = HORSE.saddle, Z = HORSE.seat;
    P(G.box, 0x8a2a1e, [.6, .03, .7], [0, S - .03, Z]); P(G.box, 0x5a3418, [.46, .07, .5], [0, S + .01, Z]);
    P(G.box, 0x4a2a12, [.2, .1, .08], [0, S + .07, Z + .24]); P(G.box, 0x4a2a12, [.36, .1, .07], [0, S + .06, Z - .24]);
    P(G.box, 0x3a2414, [.58, .34, .04], [0, S - .2, Z + .06]);
    const mx = new THREE.AnimationMixer(h), acts = {};
    for (const c of MODELS.horse.userData.anims) acts[c.name] = mx.clipAction(c);
    g.horse = {mx, acts, cur:null, idle:'Idle', idleT:4};
  } else if (n === 1) {
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
  } else if (n === 7) {
    // the same jet as the air force's, yours to fly; you sit in the cockpit
    const jet = model('fighter', 3.4, 'x');
    // the cockpit (forward of the middle) goes under the seat
    if (jet) { jet.position.set(0, .55, -.95); g.add(jet); jet.traverse(o => { if (o.isMesh) o.castShadow = true; }); }
    else { P(G.cyl, 0xd9443a, [.3, 2.6, .3], [0, .5, 0]).rotation.x = Math.PI/2; P(G.box, 0xd9443a, [3.4, .07, .7], [0, .5, .1]); P(G.box, 0xd9443a, [1.2, .06, .4], [0, .55, -1.1]); }
    g.plane = true;
  } else if (n === 8) {
    // a dragon of your own, tamed after you beat one: you sit between its shoulders
    const d = dragonModel(.42);
    if (d) { d.position.set(0, -.15, -.35); g.add(d); g.dragon = d; }
    else { P(G.sph, 0x3a7a3a, [.7, .6, 1.6], [0, .6, 0]); g.dragon = null; }
  } else if (n === 5) {
    P(G.box, 0x8a8f96, [.45, .55, .25], [0, 1.15, -.3], {metalness:.7, roughness:.3});
    for (const x of [-.14, .14]) P(G.cyl, 0x3a3e44, [.08, .3, .08], [x, .8, -.3], {metalness:.6});
    jetFlame = new THREE.Group(); g.add(jetFlame);
    for (const x of [-.14, .14]) { const f = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0x5af0ff, toneMapped:false})); f.scale.set(.08, .35, .08); f.rotation.x = Math.PI; f.position.set(x, .5, -.3); jetFlame.add(f); }
  }
  if (anim) { puff(player.pos.x, player.pos.z); banner(`${M.icon} ${M.n}!`, `You get around ${Math.round((M.speed - 1)*100)}% faster.${n === 5 || M.fly ? ' And you fly over buildings.' : ''} Switch rides with 🐎 (M).`); }
  W.flags.mountSel = n; updMountBtn();
}
function updMount(dt) {
  // riding: the hero sits (or hovers, on the jetpack) instead of running along
  // the ride you chose last time, once the camp has loaded (unlocking replays every ride in order)
  if (!updMount.restored && started) { updMount.restored = true; const s = W.flags.mountSel; if (s != null && s !== W.mount && (s === 0 || W.unlocked.has('mount' + s))) { if (s) mountStage(s, false); else dismount(); } updMountBtn(); }
  player.char.ride = !W.mount ? null : W.mount === 5 ? 'hover' : mountG && mountG.horse ? 'horse' : 'seat';
  if (!W.mount) { player.rideY = 0; return; }
  // flying rides never come down onto water: over the river or the sea they hold their height until there is land below
  const M = MOUNTS[W.mount], moving = Math.hypot(player.vel.x, player.vel.z) > .3, aloft = moving || isWater(player.pos.x, player.pos.z), up = M.fly ? (aloft ? M.fly : M.y) : W.mount === 5 && aloft ? 1.3 : M.y;
  // (starts from 0: a camp loaded with a mount had no rideY yet, and undefined + n left the mount at NaN, unseen)
  player.rideY = (player.rideY || 0) + (up - (player.rideY || 0)) * Math.min(1, dt*(M.fly ? 1.3 : 4));
  // what you ride under you stays put; things you wear or sit in (jetpack, plane, dragon) rise with you
  if (mountG) mountG.position.y = W.mount === 5 || M.fly ? -M.y : -player.rideY;
  if (mountG && M.fly) {
    // bank into turns and lift the nose on the climb; the dragon beats its wings, faster as it climbs
    const yawRate = mountG.lastYaw == null ? 0 : Math.atan2(Math.sin(player.yaw - mountG.lastYaw), Math.cos(player.yaw - mountG.lastYaw)) / Math.max(dt, 1e-3);
    mountG.lastYaw = player.yaw;
    mountG.rotation.z += (clamp(-yawRate*.25, -.6, .6) - mountG.rotation.z) * Math.min(1, dt*3);
    mountG.rotation.x += (clamp(-(up - player.rideY)*.08, -.35, .35) - mountG.rotation.x) * Math.min(1, dt*3);
    if (mountG.dragon) flapDragon(mountG.dragon, time, player.rideY > 1 ? (up > player.rideY + .5 ? 9 : 5) : 2);
    if (mountG.plane && moving && R() < dt*12) particle(0xf4fbff, player.pos.clone().setY(player.rideY + .4), new THREE.Vector3(-player.vel.x*.2, .1, -player.vel.z*.2), .9, .12, {grow:.6, op:.5});
  }
  if (mountG && mountG.horse) {
    // the gait follows your speed: a walk when you start or slow, a gallop at full pace; standing, it idles, drops its head or grazes
    const H = mountG.horse, sp = Math.hypot(player.vel.x, player.vel.z);
    if (sp <= .3 && (H.idleT -= dt) <= 0) { H.idleT = 5 + R()*6; H.idle = HORSE.IDLES[R()*HORSE.IDLES.length|0]; }
    const want = sp > 3.2 ? 'Gallop' : sp > .3 ? 'Walk' : H.idle;
    if (want !== H.cur && H.acts[want]) { const a = H.acts[want]; a.reset().setEffectiveWeight(1).fadeIn(.25).play(); if (H.cur) H.acts[H.cur].fadeOut(.25); H.cur = want; }
    if (H.acts.Walk) H.acts.Walk.timeScale = clamp(sp/HORSE.walk, .6, 2.2);
    if (H.acts.Gallop) H.acts.Gallop.timeScale = clamp(sp/HORSE.gallop, .8, 1.7);
    H.mx.update(dt);
  }
  if (mountG && mountG.legs) mountG.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(time*12 + i*1.6)*.6 : 0; });
  if (mountG && mountG.wheels && moving) mountG.wheels.forEach(w => { w.rotation.x += dt*14; });
  if (jetFlame) { jetFlame.visible = moving; jetFlame.scale.y = .8 + Math.sin(time*30)*.2; if (moving && R() < dt*20) particle(0xd8f0ff, player.pos.clone().setY(player.rideY + .3), new THREE.Vector3((R() - .5), -1.5, (R() - .5)), .5, .1, {grow:.5, op:.5}); }
  // riding: legs out on the horse, bike and scooter; tucked away in the car
  if (mountG && mountG.horse) { player.char.legL.rotation.x = player.char.legR.rotation.x = -.35; player.char.legL.rotation.z = .45; player.char.legR.rotation.z = -.45; }   // astride
  else if (W.mount <= 3 || W.mount >= 6) { player.char.legL.rotation.x = player.char.legR.rotation.x = -1.2; player.char.legL.rotation.z = .3; player.char.legR.rotation.z = -.3; }
  else { player.char.legL.rotation.z = player.char.legR.rotation.z = 0; }
}

// switching rides: every ride you own, and walking, in turn (the 🐎 button or M)
const ownedMounts = () => [1, 2, 3, 4, 5, 6, 7, 8].filter(n => W.unlocked.has('mount' + n));
function dismount() { if (mountG) player.char.g.remove(mountG); mountG = null; jetFlame = null; W.mount = 0; W.flags.mountSel = 0; player.rideY = 0; player.char.ride = null; updMountBtn(); }
function cycleMount() {
  const list = [0, ...ownedMounts()]; if (list.length < 2) return;
  const next = list[(list.indexOf(W.mount || 0) + 1) % list.length];
  if (next) mountStage(next, false); else dismount();
  puff(player.pos.x, player.pos.z); note(next ? `${MOUNTS[next].icon} ${MOUNTS[next].n}` : '🚶 On foot', 'Switch rides with 🐎 or M.');
  updMountBtn();
}
function updMountBtn() { const b = $('bMount'); if (!b) return; b.hidden = ownedMounts().length === 0; b.textContent = W.mount ? MOUNTS[W.mount].icon : '🚶'; }
