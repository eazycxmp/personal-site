// ------------------------------------------------------------------ the speed boat
const BOAT = {on:false, g:null, pos:new THREE.Vector3(), yaw:0, speed:0, wake:0, near:null};
const boatIn = new THREE.Vector2();
// every dock: where you stand to board (land) and where the boat waits (water)
const DOCKS = [
  {n:'the harbour', land:[-9.2, -2.6], water:[-13.6, -2.6], off:[-8.2, -1.3]},
  {n:'the coast', land:[-5.6, -89.6], water:[-5.6, -95], off:[-5.6, -88.4]},
  {n:'the east coast', land:[318, 1.9], water:[338, 1.9], off:[315.6, 1.9]},
  {n:'the west coast', land:[-318, 12.1], water:[-338, 12.1], off:[-315.6, 12.1]},
  {n:'the east island', land:[410 - 19, 50], water:[410 - 40, 50], off:[410 - 16.5, 50]},
  {n:'the west island', land:[-410 + 19, 50], water:[-410 + 40, 50], off:[-410 + 16.5, 50]}];
function isWater(x, z) {
  const wx = wrapX(x);
  if (onIsland(wx, z, 3.6)) return false;
  if (z < -314 || z > 274) return false;                                                                    // the edge of the known world
  if (wx < WORLD.cx0 - .8 || wx > WORLD.cx1 + .8 || z < WORLD.cz0 - 1 || z > WORLD.cz1 + .8) return true;   // the open ocean
  return wx > -19.1 && wx < -11.1;                                                                           // the river
}
function boatDocks() {
  if (BOAT.docked) return; BOAT.docked = true;
  for (const d of DOCKS) {
    d.zone = addZone({kind:'dock', dock:d, x:d.land[0], z:d.land[1], icon:'⚓', tile:{alpha:1, size:84, label:'Speed boat', fill:'rgba(20,60,110,.7)'}});
    // a little jetty out to where the boat ties up
    const [lx, lz] = d.land, [wx, wz] = d.water, len = Math.hypot(wx - lx, wz - lz) - 1, a = Math.atan2(wx - lx, wz - lz);
    const j = new THREE.Group(); j.position.set((lx + wx)/2, 0, (lz + wz)/2); j.rotation.y = a; scene.add(j);
    mesh(G.box, 0x8a6a46, [1.3, .1, len], [0, .02, 0], j); for (let k = -len/2 + .6; k < len/2; k += 2.2) for (const sx of [-.6, .6]) mesh(G.cyl, 0x5e4630, [.08, .9, .08], [sx, -.3, k], j);
  }
  if (!BOAT.g) { BOAT.g = boatMesh(); BOAT.pos.set(DOCKS[0].water[0], 0, DOCKS[0].water[1]); BOAT.g.position.copy(BOAT.pos); BOAT.g.rotation.y = Math.PI; }
}
function boatMesh() {
  const g = new THREE.Group(), src = MODELS.speedboat && MODELS.speedboat.getObjectByName('speedboat');
  if (src) { const m = src.clone(true); const bb = new THREE.Box3().setFromObject(m); const k = 3.4 / (bb.max.z - bb.min.z || 1); m.scale.setScalar(k); m.rotation.y = Math.PI; /* the model's bow faces -z; ours sails +z */ m.position.y = .1; m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (/glass/.test(o.name)) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .4; } } }); g.add(m); }
  else { mesh(G.box, 0xf4f4f4, [1.3, .5, 3.4], [0, .2, 0], g); mesh(G.box, 0x1f3f7a, [1.32, .1, 3.42], [0, .35, 0], g); mesh(G.box, 0x111111, [.4, .5, .4], [0, .5, -1.8], g); }
  scene.add(g); return g;
}
function boatOn(d) {
  if (!BOAT.g) boatDocks();
  BOAT.on = true; BOAT.speed = 0; BOAT.pos.set(d.water[0], 0, d.water[1]); BOAT.yaw = Math.atan2(d.water[0] - d.land[0], d.water[1] - d.land[1]);
  player.char.g.visible = false; player.stack.items.forEach(it => { it.mesh.visible = false; });
  note('🛥️ At the helm', 'Steer anywhere there is water. Pull in at a ⚓ dock and tap "Step ashore" (or Q).');
  snd(150, .4, 'sawtooth', .03, .5);
}
function boatOff(d) {
  BOAT.on = false; BOAT.speed = 0; BOAT.pos.set(d.water[0], 0, d.water[1]); BOAT.g.position.copy(BOAT.pos);
  player.char.g.visible = true; player.stack.items.forEach(it => { it.mesh.visible = true; });
  player.pos.set(d.off[0], 0, d.off[1]); player.zoneT = -2; $('bBoat').hidden = true;
  banner(`⚓ Ashore at ${d.n}`, 'The boat waits here. Step on any ⚓ dock to sail again.');
}
function boatStep(dt) {
  const B = BOAT, want = Math.min(1, boatIn.length());
  if (want > .1) { const yt = Math.atan2(boatIn.x, boatIn.y); let d = yt - B.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); B.yaw += clamp(d, -2.4*dt, 2.4*dt); }
  B.speed += ((want > .1 ? 26*want : 0) - B.speed) * Math.min(1, dt*(want > .1 ? .7 : 1.4));
  const vx = Math.sin(B.yaw)*B.speed*dt, vz = Math.cos(B.yaw)*B.speed*dt;
  if (isWater(B.pos.x + vx, B.pos.z + vz)) { B.pos.x += vx; B.pos.z += vz; }
  else if (isWater(B.pos.x + vx, B.pos.z)) { B.pos.x += vx; B.speed *= .97; }
  else if (isWater(B.pos.x, B.pos.z + vz)) { B.pos.z += vz; B.speed *= .97; }
  else B.speed *= .3;
  // across the date line: wrap, and count the lap
  if (Math.abs(B.pos.x) > WORLD.w/2) { const d = B.pos.x > 0 ? -WORLD.w : WORLD.w; B.pos.x += d; camera.position.x += d; W.flags.lap = (W.flags.lap || 0) - Math.sign(d); }
  const prevX = player.pos.x;
  B.g.position.set(B.pos.x, Math.sin(time*2.3)*.05 - .02, B.pos.z); B.g.rotation.set(-Math.min(.12, B.speed*.005), B.yaw, Math.sin(time*1.7)*.03, 'YXZ');
  player.pos.set(B.pos.x, 0, B.pos.z);
  // round the world: one full lap, back past home longitude
  if (Math.abs(W.flags.lap || 0) >= 1 && Math.sign(prevX) !== Math.sign(B.pos.x) && Math.abs(B.pos.x) < 60) {
    W.flags.lap = 0; W.flags.circumnav = (W.flags.circumnav || 0) + 1; const pay = 25000 + 5000*W.era;
    addCash(CASH.spoils || cash, pay, {x:12.3, z:84.8});
    banner('🌍 You sailed around the world!', `The whole empire cheers. ${pay} 💵 in prize money${W.flags.circumnav > 1 ? ` (lap ${W.flags.circumnav})` : ''}.`);
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*110)); save();
  }
  // spray off the bow and a wake behind, more the faster you go
  if ((B.wake -= dt) <= 0 && B.speed > 2) {
    B.wake = .04;
    const bx = Math.sin(B.yaw), bz = Math.cos(B.yaw);
    for (const sd of [-1, 1]) particle(0xf4fbff, new THREE.Vector3(B.pos.x - bx*1.7 + bz*sd*.5, .05, B.pos.z - bz*1.7 - bx*sd*.5), new THREE.Vector3(bz*sd*.8, .3 + B.speed*.02, -bx*sd*.8), .7, .06, {grow:.3, op:.6});
  }
  B.near = DOCKS.find(d => Math.hypot(wrapX(d.water[0] - B.pos.x), d.water[1] - B.pos.z) < 7) || null;
  $('bBoat').hidden = !B.near;
  if (B.near && keys.q) boatOff(B.near);
}
function takeFerry(zn) {
  const down = [[-12.3, -.26, .9], [-13.6, -.26, -6], [-13.4, -.26, -40], [-13.7, -.26, -75], [-13.2, -.26, -93], [-10.5, -.26, -95.2], [-8.6, -.26, -94.4]];
  if (startTrip('boat', zn.back ? [...down].reverse() : down, zn.back ? {at:[-8.86, 2.2], title:'⛵ Back at the harbour', sub:'Welcome home.'} : {at:[-9, -90.4], title:'⛵ Ashore on the coast', sub:'Walk along the beach to your coastal provinces.'}, zn.back ? '⛵ Sailing home up the river' : '⛵ Sailing down the river to the coast')) return;
  const to = zn.back ? [-8.86, 2.2] : [-9, -90.4];
  for (let i = 0; i < 16; i++) particle(0xe8f8ff, player.pos.clone().setY(.2), new THREE.Vector3((R() - .5)*3, 1 + R()*2, (R() - .5)*3), .6, .15, {grav:1});
  player.pos.set(to[0], 0, to[1]); camera.position.set(to[0] + 11.8, 19, to[1] + 11.8);
  banner(zn.back ? '⛵ Back at the harbour' : '⛵ Down the river to the coast', zn.back ? 'Welcome home.' : 'Walk along the beach to your coastal provinces.');
}

