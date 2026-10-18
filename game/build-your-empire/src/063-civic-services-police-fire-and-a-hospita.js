// ------------------------------------------------------------------ civic services: police, fire and a hospital, east of the railway
const CIVIC = {fire:null, truck:null, amb:null, patrol:null};
function civicBlock(kind, anim) {
  clearForest({x0:55.5, x1:66, z0:-.5, z1:10.5});
  if (!civicBlock.road) { civicBlock.road = true; slab(0x6a6e76, 10, 1.4, 61, 1.6, .007); AREAS.push({x0:56.4, x1:66.4, z0:.35, z1:9.8}); }
  boxes.push({police:{x0:56.9, x1:59.5, z0:3.5, z1:6.1}, fire:{x0:60, x1:62.8, z0:3.5, z1:6.1}, hospital:{x0:63.1, x1:66.1, z0:4, z1:6.8}}[kind]);
  const at = {police:[58.2, 4.8], fire:[61.4, 4.8], hospital:[64.6, 5.4]}[kind], g = new THREE.Group(); g.position.set(at[0], 0, at[1]); scene.add(g);
  const sign = (t, bg, fg, y) => { const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(t, bg, fg), toneMapped:false})); s.scale.set(1.7, .5, 1); s.position.set(0, y, 1.33); g.add(s); };
  if (kind === 'police') {
    mesh(G.box, 0xeef1f4, [2.6, 1.8, 2.6], [0, .9, 0], g); mesh(G.box, 0x1f3a7a, [2.62, .35, 2.62], [0, 1.6, 0], g);
    for (const x of [-.7, .7]) mesh(G.box, WIN, [.5, .5, .05], [x, .85, 1.31], g);
    mesh(G.box, 0x1f3a7a, [.6, .9, .05], [0, .45, 1.31], g); sign('POLICE', '#1f3a7a', '#ffffff', 2.05);
    A_SIREN.push(bulb(g, -.3, 1.95, 0, 0xff3030, .1), bulb(g, .3, 1.95, 0, 0x3060ff, .1));
  } else if (kind === 'fire') {
    mesh(G.box, 0xb8322a, [2.8, 2, 2.6], [0, 1, 0], g); mesh(G.box, 0x8a2a22, [2.82, .2, 2.62], [0, 2.05, 0], g);
    for (const x of [-.65, .65]) mesh(G.box, 0xdfe4ea, [1, 1.2, .05], [x, .6, 1.31], g);
    mesh(G.box, 0xb8322a, [.6, 2.8, .6], [1.1, 1.4, -.9], g); sign('FIRE', '#8a1a14', '#ffffff', 1.55);
  } else {
    mesh(G.box, 0xf4f6f8, [3, 2.6, 2.8], [0, 1.3, 0], g); for (let f = 0; f < 2; f++) for (const x of [-1, -.35, .35, 1]) mesh(G.box, WIN, [.4, .4, .05], [x, .7 + f*1, 1.41], g);
    mesh(G.box, 0xd9443a, [.6, .18, .05], [0, 2.25, 1.42], g); mesh(G.box, 0xd9443a, [.18, .6, .05], [0, 2.25, 1.42], g);
    mesh(G.cyl, 0x5a5e66, [.9, .04, .9], [0, 2.63, 0], g); mesh(G.box, 0xf4f4f4, [.12, .01, .6], [-.2, 2.66, 0], g); mesh(G.box, 0xf4f4f4, [.12, .01, .6], [.2, 2.66, 0], g); mesh(G.box, 0xf4f4f4, [.4, .01, .12], [0, 2.66, 0], g);
  }
  fader(g, 3, 2.6);
  if (anim) popIn(g);
  if (kind === 'fire') CIVIC.truck = vehicle(0xd9443a, 61.4, 6.7, 'fire');
  if (kind === 'hospital') CIVIC.amb = vehicle(0xf4f6f8, 64.6, 7.4, 'amb');
  if (kind === 'police') CIVIC.patrol = vehicle(0xf4f6f8, 58.2, 6.7, 'police');
}
const A_SIREN = [];
function vehicle(col, x, z, kind) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const long = kind === 'fire' || kind === 'bus';
  mesh(G.box, col, [.9, .6, long ? 2.4 : 1.6], [0, .5, 0], g); mesh(G.box, kind === 'police' ? 0x1f3a7a : col, [.86, .4, long ? 1.2 : .8], [0, .95, long ? .5 : -.1], g);
  mesh(G.box, 0x8fc6e8, [.8, .26, .04], [0, .98, long ? 1.12 : .32], g, {metalness:.5, roughness:.1});
  for (const [wx, wz] of [[-.46, .55], [.46, .55], [-.46, -.55], [.46, -.55]]) mesh(G.cyl, 0x1a1a1a, [.18, .12, .18], [wx, .18, wz*(long ? 1.5 : 1)], g).rotation.z = Math.PI/2;
  if (kind === 'amb') { mesh(G.box, 0xd9443a, [.92, .12, 1.62], [0, .55, 0], g); }
  if (kind === 'fire') { mesh(G.box, 0xdfe4ea, [.15, .12, 2], [.25, 1.25, -.3], g, {metalness:.6}); }
  const lights = kind === 'fire' || kind === 'amb' || kind === 'police' ? [bulb(g, -.2, 1.2, 0, 0xff3030, .07), bulb(g, .2, 1.2, 0, 0x3060ff, .07)] : [];
  for (const sx of [-.3, .3]) bulb(g, sx, .55, long ? 1.22 : .82, 0xfff2c8, .05);
  return {g, x, z, home:[x, z], path:[], lights, busy:false, speed:kind === 'bus' ? 3.5 : 7, wait:0};
}
function driveTo(v, pts, onArrive) { v.path = pts.slice(); v.onArrive = onArrive; v.busy = true; }
function updVehicle(v, dt) {
  if (!v) return;
  if (v.wait > 0) { v.wait -= dt; return; }
  if (v.path.length) {
    const [tx, tz] = v.path[0], dx = tx - v.g.position.x, dz = tz - v.g.position.z, d = Math.hypot(dx, dz);
    if (d < .2) { v.path.shift(); if (!v.path.length && v.onArrive) { const f = v.onArrive; v.onArrive = null; f(); } }
    else { const s = Math.min(d, v.speed*dt); v.g.position.x += dx/d*s; v.g.position.z += dz/d*s; v.g.rotation.y = Math.atan2(dx, dz); }
  }
  const on = v.busy && v.lights.length;
  v.lights.forEach((l, i) => { l.visible = on ? Math.sin(time*12 + i*Math.PI) > 0 : false; });
}
// the road in from the east, then straight to the job
const TOWN_ROUTE = (x, z) => [[58, 1.6], [14, 1.6], [12.6, 1.6], [x, z]];
function updCivic(dt) {
  if (!started) return;
  // fire trucks put out fires so you don't have to
  const T = CIVIC.truck;
  if (T && !T.busy) {
    const st = Object.values(ST).find(s => s.broken && !s.ruin && !s.truckOn && !(MILFIRE.trucks.some(v => !v.busy) && s.inZ && Math.hypot(s.inZ[0] - 3, s.inZ[1] - 80) < Math.hypot(s.inZ[0] - 68, s.inZ[1] - 1.6)));
    if (st) {
      st.truckOn = true; const [x, z] = st.inZ || [st.body.position.x, st.body.position.z];
      banner('🚒 The fire brigade is on its way!', `Heading to the ${st.name}.`);
      // already out on a call: straight on to the next fire by the main road, without going back to the station first
      driveTo(T, T.away ? [[12.6, 1.6], [x + 1.2, z + 1.2]] : TOWN_ROUTE(x + 1.2, z + 1.2), () => {
        T.wait = 3;
        for (let i = 0; i < 30; i++) setTimeout(() => particle(0xcfefff, T.g.position.clone().setY(1.3), new THREE.Vector3((x - T.g.position.x)*.8 + (R() - .5), 2, (z - T.g.position.z)*.8 + (R() - .5)), .6, .08, {grav:1}), i*90);
        setTimeout(() => {
          if (st.broken) { st.broken = false; if (st.repairZone) removeZone(st.repairZone); st.repairZone = null; puff(x, z); popText(`🚒 Fire out at the ${st.name}`, new THREE.Vector3(x, 2.8, z), '#b8f0a0'); }
          st.truckOn = false; T.away = true; driveTo(T, [[12.6, 1.6], [14, 1.6], [58, 1.6], T.home], () => { T.away = false; T.busy = false; }); T.busy = false;   // free for the next call on the way home
        }, 3000);
      });
    }
  }
  updVehicle(T, dt);
  // the ambulance goes out to the battlefield after every land battle
  const Am = CIVIC.amb;
  if (Am && !Am.busy && W.camp && W.camp.type === 'land' && !W.camp.away && W.camp.t < 9 && W.camp.t > 8) driveTo(Am, [[58, 1.6], [51, 1.6], [51, 79.5], [BF.x + 2, 93]], () => { Am.wait = 4; driveTo(Am, [[51, 79.5], [51, 1.6], [58, 1.6], Am.home], () => { Am.busy = false; }); });
  updVehicle(Am, dt);
  // a patrol car loops through town
  const Pc = CIVIC.patrol;
  updVehicle(Pc, dt);
  A_SIREN.forEach((b, i) => { b.visible = Math.sin(time*6 + i*Math.PI) > 0; });
}

