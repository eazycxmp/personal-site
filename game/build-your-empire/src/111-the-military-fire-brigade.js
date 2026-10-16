// ------------------------------------------------------------------ the military fire brigade
const MILFIRE = {built:false, trucks:[]};
function milFireFx() {
  MILFIRE.built = true;
  const g = new THREE.Group(); scene.add(g);
  // a red-brick fire house with two bays, beside the hangars
  mesh(G.box, 0xa83a2a, [5.6, 2.6, 3], [26.2, 1.3, 108.6], g); mesh(G.box, 0x6a2418, [6, .3, 3.4], [26.2, 2.75, 108.6], g);
  for (const x of [24.9, 27.5]) mesh(G.box, 0xe8e4dc, [2, 1.9, .06], [x, .95, 107.08], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('BASE FIRE', '#a83a2a', '#ffffff'), toneMapped:false})); sign.scale.set(2.4, .5, 1); sign.position.set(26.2, 2.2, 107.05); sign.rotation.y = Math.PI; g.add(sign);
  boxes.push({x0:23.4, x1:29, z0:107.2, z1:110.1});
  for (const x of [24.9, 27.5]) { const v = vehicle(0xc8221a, x, 105.4, 'fire'); v.g.rotation.y = Math.PI; MILFIRE.trucks.push(v); }
}
function updMilFire(dt) {
  if (!MILFIRE.built) { if (started && AIRBASE.built && W.unlocked.has('fireStation')) milFireFx(); else return; }
  const all = [CIVIC.truck, ...MILFIRE.trucks].filter(Boolean);
  for (const T of MILFIRE.trucks) {
    updVehicle(T, dt);
    if (T.busy) continue;
    // a burning building no truck is heading to, nearest first
    const st = Object.values(ST).filter(q => q.broken && !q.ruin && !q.truckOn && q.inZ).sort((a, b) => Math.hypot(a.inZ[0] - T.g.position.x, a.inZ[1] - T.g.position.z) - Math.hypot(b.inZ[0] - T.g.position.x, b.inZ[1] - T.g.position.z))[0];
    // only go if this truck is the closest free one (the town's truck takes the town)
    const free = all.filter(v => !v.busy), near = st && free.sort((a, b) => Math.hypot(a.g.position.x - st.inZ[0], a.g.position.z - st.inZ[1]) - Math.hypot(b.g.position.x - st.inZ[0], b.g.position.z - st.inZ[1]))[0];
    if (st && near === T) {
      st.truckOn = true; const [x, z] = st.inZ;
      driveTo(T, [[x + 1.2, z + 1.4]], () => { T.wait = 3; T.job = st; });
      continue;
    }
    // otherwise, a war fire burning near the base or the battlefield
    const F = WARFIRE.list.find(f => f.t < 1e8 && f.t > 1 && !f.truck && Math.hypot(f.x - 8, f.z - 90) < 40);
    if (F) { F.truck = T; driveTo(T, [[F.x + 1.4, F.z + 1.4]], () => { T.wait = 2.5; F.t = Math.min(F.t, 2); for (let i = 0; i < 20; i++) particle(0xcfefff, T.g.position.clone().setY(1.3), new THREE.Vector3((F.x - T.g.position.x)*.9 + (R() - .5), 2, (F.z - T.g.position.z)*.9 + (R() - .5)), .6, .09, {grav:1}); T.job = 'home'; }); }
  }
  // done at the job (the hose itself is the shared one in the war code): head home
  for (const T of MILFIRE.trucks) {
    if (T.wait > 0 || !T.job) continue;
    if (T.job !== 'home' && T.job.broken && T.job.warFire != null) continue;   // still burning: keep hosing
    if (T.job !== 'home' && T.job.broken) { T.job.broken = false; if (T.job.repairZone) { removeZone(T.job.repairZone); T.job.repairZone = null; } popText(`🚒 Base fire crew put out the ${T.job.name}`, new THREE.Vector3(T.job.inZ[0], 2.8, T.job.inZ[1]), '#b8f0a0'); }
    if (T.job !== 'home') T.job.truckOn = false;
    T.job = null; driveTo(T, [T.home], () => { T.busy = false; T.g.rotation.y = Math.PI; });
  }
}
const GREENPAD = {m:null};
function updGreenPad() {
  if (!GREENPAD.m) {
    const tc = tileCanvas(g => { g.clearRect(0, 0, 256, 256); roundRect(g, 16, 16, 224, 224, 34); g.fillStyle = 'rgba(96,232,96,.88)'; g.fill(); g.setLineDash([30, 18]); g.lineWidth = 10; roundRect(g, 18, 18, 220, 220, 32); g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke(); });
    GREENPAD.m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:tc.t, transparent:true, depthWrite:false, toneMapped:false})); GREENPAD.m.rotation.x = -Math.PI/2; GREENPAD.m.renderOrder = 0; scene.add(GREENPAD.m);
  }
  const z = player.zone; GREENPAD.m.visible = !!z && z.mesh && z.mesh.visible !== false;
  if (z) { GREENPAD.m.position.set(z.x, .035, z.z); GREENPAD.m.scale.set(z.w*1.04, z.d*1.04, 1); }
}
