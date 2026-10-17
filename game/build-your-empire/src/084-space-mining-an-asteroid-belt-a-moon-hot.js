// ------------------------------------------------------------------ space mining: an asteroid belt, a Moon hotel and a space elevator
function spaceElevatorFx(anim) {
  const g = new THREE.Group(); scene.add(g); SPACE.elev = g;
  mesh(G.cyl, 0xdfe4ea, [.12, 220, .12], [-36, 110, 8], g, {metalness:.6});
  mesh(G.cyl, 0x8a8f96, [1.4, .6, 1.4], [-36, 7.6, 8], g, {metalness:.5});
  const car = new THREE.Group(); g.add(car); SPACE.climber = car;
  mesh(G.cyl, 0xf4f6f8, [.5, .8, .5], [0, 0, 0], car, {metalness:.4}); mesh(G.cyl, 0x8fc6e8, [.52, .3, .52], [0, .1, 0], car, {metalness:.5, roughness:.1}); bulb(car, 0, .5, 0, 0x5af0ff, .08);
  if (anim) popIn(g);
}
function updSpaceMining(dt) {
  if (SPACE.climber) { const u = (Math.sin(time*.15) + 1) / 2; SPACE.climber.position.set(-36, 8 + u*60, 8); }
  if (!started) return;
  if ((SPACE.mineT = (SPACE.mineT ?? 20) - dt) <= 0) {
    SPACE.mineT = 20;
    const pay = (W.unlocked.has('asteroid') ? 30000 : 0) + (W.unlocked.has('moonHotel') ? 20000 : 0) + (W.unlocked.has('spaceElevator') ? 45000 : 0);
    if (pay) { W.coins += pay; W.earned += pay; popText(`☄️ +${pay} from space`, new THREE.Vector3(-36, 5, 6), '#ffe06b'); }
  }
}
// the belt and the hotel, seen from space
function beltScene() {
  if (SPACE.scenes.belt) return SPACE.scenes.belt;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x02030a);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(30, 40, 20); sc.add(sun, new THREE.HemisphereLight(0x8090b0, 0x101010, .5));
  const n = 1200, pos = new Float32Array(n*3); for (let i = 0; i < n; i++) { const u = R()*2 - 1, a = R()*Math.PI*2, s = Math.sqrt(1 - u*u); pos.set([Math.cos(a)*s*160, u*160, Math.sin(a)*s*160], i*3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sc.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff, size:1.5, sizeAttenuation:false})));
  const rocks = [];
  for (let i = 0; i < 60; i++) { const r = new THREE.Mesh(G.ico, mat([0x8a8478, 0x6a645a, 0xa89a80][i % 3], {flatShading:true})); const a = R()*Math.PI*2, d = 10 + R()*24; r.position.set(Math.cos(a)*d, (R() - .5)*6, Math.sin(a)*d); r.scale.setScalar(.4 + R()*1.6); sc.add(r); rocks.push({r, a, d, sp:.02 + R()*.04}); }
  const ships = [];
  for (let i = 0; i < 4; i++) { const s = new THREE.Group(); sc.add(s); mesh(G.box, 0xf2a21a, [.8, .5, 1.8], [0, 0, 0], s, {metalness:.5}); mesh(G.box, 0x3a3e44, [.4, .4, .6], [0, .3, -.6], s); const fl = new THREE.Mesh(G.cone, new THREE.MeshBasicMaterial({color:0x5af0ff, toneMapped:false})); fl.scale.set(.2, .5, .2); fl.rotation.x = -Math.PI/2; fl.position.z = -1.1; s.add(fl); ships.push({s, ph:i*1.6}); }
  const cam = new THREE.PerspectiveCamera(45, 1, .1, 500);
  return SPACE.scenes.belt = {sc, cam, rocks, ships, H:() => 0, base:new THREE.Group(), built:9, belt:true};
}

