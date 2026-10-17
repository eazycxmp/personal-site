// ------------------------------------------------------------------ the space age
let rocket = null;
function launchPadFx(anim) {
  const g = new THREE.Group(); g.position.set(-36, 0, 8); scene.add(g);
  mesh(G.box, 0xb8bcc2, [4, .3, 4], [0, .15, 0], g);
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3]]) mesh(G.box, 0xd9443a, [.25, 7, .25], [x, 3.5, z], g, {metalness:.4});
  for (let y = 1; y < 7; y += 1.2) mesh(G.box, 0xd9443a, [2.6, .1, .1], [0, y, -1.3], g, {metalness:.4});
  const mc = new THREE.Group(); mc.position.set(-33.5, 0, 12); scene.add(mc);
  mesh(G.box, 0xeef1f4, [2.4, 1.4, 1.6], [0, .7, 0], mc); mesh(G.box, 0x8fc6e8, [2.42, .4, 1.62], [0, .9, 0], mc, {metalness:.5, roughness:.12});
  mesh(G.cyl, 0x9aa0a8, [.04, 1.2, .04], [.8, 2, 0], mc); mesh(G.sph, 0xeef0f4, [.4, .14, .4], [.8, 2.6, 0], mc).rotation.x = -.6;
  boxes.push({x0:-38, x1:-34, z0:6, z1:10}, {x0:-34.7, x1:-32.3, z0:11.2, z1:12.8});
  if (anim) { popIn(g); popIn(mc); }
  makeRocket();
}
function makeRocket() {
  const g = new THREE.Group(); g.position.set(-36, .3, 8); scene.add(g);
  mesh(G.cyl, 0xf4f6f8, [.5, 4.4, .5], [0, 2.5, 0], g, {metalness:.3, roughness:.3});
  mesh(G.cone, 0xf4f6f8, [.5, 1.2, .5], [0, 5.3, 0], g, {metalness:.3, roughness:.3});
  mesh(G.cyl, 0x1f5fb8, [.51, .4, .51], [0, 3.6, 0], g); mesh(G.cyl, 0x2a2a2e, [.38, .5, .38], [0, .1, 0], g, {metalness:.6});
  for (let i = 0; i < 4; i++) { const a = i*Math.PI/2, f = mesh(G.box, 0xd9443a, [.06, .9, .5], [Math.cos(a)*.55, .7, Math.sin(a)*.55], g); f.rotation.y = -a; }
  const flame = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0xffb040, toneMapped:false})); flame.scale.set(.4, 1.6, .4); flame.rotation.x = Math.PI; flame.position.y = -.9; flame.visible = false; g.add(flame);
  rocket = {g, flame, t:-1};
}
function launch(mission) {
  if (!rocket) makeRocket();
  rocket.t = 0; rocket.mission = mission;
  banner(mission === 'moon' ? '🚀 Liftoff! Next stop: the Moon' : mission === 'mars' ? '🚀 Liftoff! Next stop: Mars' : '🚀 Liftoff!', mission === 'sat' ? 'A satellite heads for orbit.' : 'Watch it go.');
  snd(80, 2.4, 'sawtooth', .06, .4);
}
function updSpace(dt) {
  // cutscenes and short tours run with the game clock, then bring you home
  if (SPACE.cut) updCut(dt);
  else if (SPACE.tour > 0 && (SPACE.tour -= dt) <= 0) { SPACE.view = null; stage.classList.remove('space'); }
  if (W.unlocked.has('satellite') && (EV.satT = (EV.satT ?? 20) - dt) <= 0) { EV.satT = 20; addCash(CASH.space || cash, 1500 + (W.unlocked.has('moonBase') ? 6000 : 0) + (W.flags.mars ? 15000 : 0), {x:-36, z:4}); }
  $('bSpace').hidden = !W.flags.moon;
  if (!rocket || rocket.t < 0) return;
  const r = rocket; r.t += dt;
  const t = Math.max(0, r.t - 1.2);
  r.flame.visible = true; r.flame.scale.y = 1.4 + Math.sin(time*40)*.3;
  r.g.position.y = .3 + t*t*2.2;
  if (R() < dt*30) particle(0xdcdcdc, new THREE.Vector3(-31 + (R() - .5), Math.max(.3, r.g.position.y - 1), 8 + (R() - .5)), new THREE.Vector3((R() - .5)*3, -1 + R(), (R() - .5)*3), 2.5, .5, {grow:.9, op:.6});
  if (r.t < 3) shakeCam(.08);
  if (r.g.position.y > 70) {
    scene.remove(r.g); rocket = null;
    if (r.mission === 'moon') { setEra(11, true); W.flags.moon = true; save(); startCut('moon'); }
    if (r.mission === 'mars') { setEra(12, true); W.flags.mars = true; save(); startCut('mars'); }
    setTimeout(makeRocket, 4000);
  }
}

