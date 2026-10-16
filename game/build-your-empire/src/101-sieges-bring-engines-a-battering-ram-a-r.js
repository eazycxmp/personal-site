// ------------------------------------------------------------------ sieges bring engines: a battering ram, a rolling siege tower and a catapult
function siegeKit(cb) {
  SIEGE.kit = [];
  if (!cb) return;
  const add = (k, size, axis, x, z, ry) => { const m = model(k, size, axis); if (!m) return null; m.position.set(x, 0, z); m.rotation.y = ry; scene.add(m); SIEGE.kit.push(m); return m; };
  SIEGE.ramM = add('ram', 2.2, 'x', cb.x1 + 4, 94, 0);
  SIEGE.towerM = add('siegeTower', 3.2, 'y', (cb.x0 + cb.x1)/2, 104, Math.PI/2);
  SIEGE.catM = add('catapult', 2.1, 'x', 2.5, 104.5, Math.PI/2);
  SIEGE.rockT = 2;
}
function updSiegeKit(dt, e, cb) {
  if (!cb || !SIEGE.kit) return;
  const ease = u => u < 0 ? 0 : u > 1 ? 1 : u*u*(3 - 2*u);
  if (SIEGE.ramM) { const u = ease(e/12), x = cb.x1 + 4 + (cb.x1 + 1.3 - cb.x1 - 4)*u, z = 94 + (87.85 - 94)*u; SIEGE.ramM.position.set(x + (e > 12 && SIEGE.gateHp > 0 ? Math.max(0, Math.sin(time*5))*.35 : 0), 0, z); }
  if (SIEGE.towerM) { const u = ease((e - 2)/16); SIEGE.towerM.position.z = 104 + (cb.z1 + 1 - 104)*u; }
  if (SIEGE.catM && e > 6 && e < 40 && (SIEGE.rockT -= dt) <= 0) {
    SIEGE.rockT = 3.2;
    const from = SIEGE.catM.position.clone().setY(1.6), to = new THREE.Vector3(cb.x0 + R()*(cb.x1 - cb.x0), 1.4, cb.z0 + R()*(cb.z1 - cb.z0));
    const rock = new THREE.Mesh(G.ico, mat(0x7a756c, {flatShading:true})); rock.scale.setScalar(.2); rock.position.copy(from); scene.add(rock);
    flyers.push({m:rock, from, to, t:0, dur:1.4, arc:6, done:() => { for (let i = 0; i < 10; i++) particle(i % 2 ? 0x8a8478 : 0xff7a2a, to, new THREE.Vector3((R() - .5)*4, 2 + R()*3, (R() - .5)*4), .8, .18, {grav:1}); if (player.pos.distanceTo(to) < 14) shakeCam(.2); snd(60, .3, 'sawtooth', .05, .5); }});
  }
}

