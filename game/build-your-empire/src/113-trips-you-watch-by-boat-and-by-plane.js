// ------------------------------------------------------------------ trips you watch: by boat and by plane
const TRIP = {on:false};
function tripVehicle(kind) {
  const g = new THREE.Group();
  if (kind === 'boat') {
    // a passenger steamer in the modern age, a sailing packet before it
    const inner = new THREE.Group(); g.add(inner);
    if (W.era >= 5 && typeof modernShip === 'function') modernShip(inner, 'cruise'); else galleon(inner, SHIPS.trade());
    return g;
  }
  const am = model('airliner2', 4.9, 'z'); if (!am) return null;
  am.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); g.add(am);
  if (kind === 'sea') for (const sx of [-.75, .75]) {   // floats for landing on water
    mesh(G.cyl, 0xe8e8ea, [.16, 2.6, .16], [sx, -.55, .3], g, {metalness:.3}).rotation.x = Math.PI/2;
    mesh(G.box, 0x8a8f96, [.05, .5, .05], [sx, -.3, .9], g); mesh(G.box, 0x8a8f96, [.05, .5, .05], [sx, -.3, -.3], g);
  }
  return g;
}
function startTrip(kind, pts, end, title) {
  if (TRIP.on) return true;
  const g = tripVehicle(kind); if (!g) return false;
  g.rotation.order = 'YXZ'; scene.add(g);
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'), len = curve.getLength();
  Object.assign(TRIP, {on:true, kind, g, curve, t:0, dur:clamp(len / (kind === 'boat' ? 10 : 15), 6, kind === 'boat' ? 12 : 16), end, yaw:null, bank:0, wake:0});
  player.char.g.visible = false; player.stack.items.forEach(it => { it.mesh.visible = false; });
  $('tripSkip').hidden = false; note(title, 'Sit back and watch. ⏩ skips ahead.');
  tripStep(0);
  return true;
}
function tripStep(dt) {
  const T = TRIP; T.t = Math.min(T.dur, T.t + dt);
  const u = T.t / T.dur, e = u*u*(3 - 2*u);           // ease in and out: the take-off roll and the landing are slow
  const p = T.curve.getPointAt(e), q = T.curve.getPointAt(Math.min(1, e + .004)), r = e > .996 ? T.curve.getPointAt(e - .004) : null;
  const dx = r ? p.x - r.x : q.x - p.x, dy = r ? p.y - r.y : q.y - p.y, dz = r ? p.z - r.z : q.z - p.z, h = Math.hypot(dx, dz);
  const yaw = h > 1e-5 ? Math.atan2(dx, dz) : (T.yaw || 0);
  if (T.yaw != null && dt > 0) { let dyaw = yaw - T.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw)); T.bank += (clamp(-dyaw/dt*.35, -.6, .6) - T.bank) * Math.min(1, dt*3); }
  T.yaw = yaw; T.g.position.copy(p); T.g.rotation.y = yaw;
  if (T.kind === 'boat') { T.g.position.y = -.26 + Math.sin(time*1.8)*.04; T.g.rotation.z = Math.sin(time*1.3)*.035; T.g.rotation.x = Math.sin(time*1.7)*.02; }
  else { if (p.y < 0) T.g.position.y = 0; T.g.rotation.x = p.y > .3 ? -Math.atan2(dy, h || 1e-5) : 0; T.g.rotation.z = p.y > .5 ? T.bank : 0; }
  // spray behind boats and seaplanes on the water
  if (dt > 0 && (T.wake -= dt) <= 0) {
    T.wake = .05;
    const back = new THREE.Vector3(-Math.sin(yaw)*2, 0, -Math.cos(yaw)*2).add(p);
    if (p.y < .4 && (T.kind !== 'plane' || p.z < -92)) for (const sd of [-1, 1]) particle(0xf4fbff, back.clone().add(new THREE.Vector3(Math.cos(yaw)*sd*.5, .05, -Math.sin(yaw)*sd*.5)), new THREE.Vector3(Math.cos(yaw)*sd*.6, .35, -Math.sin(yaw)*sd*.6), .6, .06, {grow:.25, op:.55});
  }
  player.pos.set(p.x, 0, p.z);
  if (u >= 1) endTrip();
}
function endTrip() {
  const T = TRIP; if (!T.on) return;
  scene.remove(T.g); T.on = false; $('tripSkip').hidden = true;
  player.char.g.visible = true; player.stack.items.forEach(it => { it.mesh.visible = true; });
  player.pos.set(T.end.at[0], 0, T.end.at[1]); player.zoneT = 0;
  for (let i = 0; i < 10; i++) particle(0xe8f8ff, player.pos.clone().setY(.3), new THREE.Vector3((R() - .5)*2, 1 + R(), (R() - .5)*2), .5, .12, {grav:1});
  banner(T.end.title, T.end.sub);
}
// airstrips: home is the big runway; every province you hold gets a strip just outside town, or a seaplane dock on the coast
const AIRSTRIPS = {};
const HOME_AIR = {n:'🛫 Home airport', tile:[-85.8, -2.2], off:[-85.8, .2], arrive:[[-87, 16, -78], [-87, 6, -44], [-87, .2, -16], [-87, 0, 2], [-87, 0, 7]]};
function stripFor(style) {
  const S = STYLE_SPOTS[style];
  if (S.site) {
    // coastal: touch down on the sea heading for the beach, taxi in to the shallows
    const sx = COAST.sites[S.site].x + 6;
    return {n:`${S.flag} ${S.n}`, tile:[sx, -90.2], off:[sx, -88.3], sea:true, arrive:[[sx, 16, -170], [sx, 5, -135], [sx, .1, -114], [sx, 0, -99], [sx, 0, -94.6]]};
  }
  const r = S.rect, zs = r.z1 + 3.2, xe = r.x1 - 2.5;
  return {n:`${S.flag} ${S.n}`, tile:[xe, r.z1 - 1.1], off:[xe - 2.2, r.z1 - 1.3], strip:{x0:xe - 30, x1:xe + 3, z:zs}, arrive:[[xe - 80, 16, zs + 20], [xe - 46, 6, zs], [xe - 24, .2, zs], [xe - 6, 0, zs], [xe, 0, zs]]};
}
function updAirstrips() {
  if (!W.unlocked.has('airport')) return;
  if (!AIRSTRIPS.home) AIRSTRIPS.home = {...HOME_AIR, zone:addZone({kind:'fly', x:HOME_AIR.tile[0], z:HOME_AIR.tile[1], icon:'✈️', tile:{alpha:1, size:84, label:'Fly', fill:'rgba(30,60,120,.7)'}})};
  for (const style of Object.keys(DISTRICT.built)) {
    if (AIRSTRIPS[style]) continue;
    const A = AIRSTRIPS[style] = stripFor(style);
    A.zone = addZone({kind:'fly', x:A.tile[0], z:A.tile[1], icon:A.sea ? '🛬' : '✈️', tile:{alpha:1, size:84, label:A.sea ? 'Seaplane' : 'Airstrip', fill:'rgba(30,60,120,.7)'}});
    if (A.strip) {
      // an asphalt strip with a centre line, edge lights and a windsock
      const st = A.strip, w = st.x1 - st.x0; clearForest({x0:st.x0 - 2, x1:st.x1 + 2, z0:st.z - 4, z1:st.z + 4});
      slab(0x3a3d42, w, 3.2, (st.x0 + st.x1)/2, st.z, .012);
      for (let x = st.x0 + 1.5; x < st.x1 - 1; x += 3) slab(0xeeeeee, 1.4, .14, x, st.z, .016);
      for (let x = st.x0; x <= st.x1; x += 5) for (const sz of [-1.75, 1.75]) { const b = bulb(scene, x, .18, st.z + sz, 0xfff0b0, .07); lampMats.push(b.material); }
      const pole = mesh(G.cyl, 0xd8d8d8, [.05, 2.2, .05], [st.x0 + 4, 1.1, st.z + 3], scene);
      const sock = mesh(G.cone, 0xff6a1a, [.22, .9, .22], [st.x0 + 4.45, 2.05, st.z + 3], scene); sock.rotation.z = Math.PI/2;
    } else {
      // a little jetty for the seaplane
      const [x, z] = A.tile; mesh(G.box, 0x8a6a46, [1.2, .12, 4], [x, -.05, -92.4], scene); for (const dz of [-1.8, 0, 1.8]) for (const sx of [-.5, .5]) mesh(G.cyl, 0x5e4630, [.07, .6, .07], [x + sx, -.25, -92.4 + dz], scene);
    }
  }
}
function airAt(zn) { return Object.values(AIRSTRIPS).find(A => A.zone === zn); }
function openFlights(zn) {
  const from = airAt(zn); if (!from) return;
  const dests = Object.values(AIRSTRIPS).filter(A => A !== from);
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'fly';
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">✈️ Where to?</h1><p>Planes land wherever you have an airstrip. Every province you hold gets one.</p>
    <div class="trades">${dests.map((A, i) => `<div><b style="width:auto;flex:1">${A.n}</b><button data-i="${i}">Fly</button></div>`).join('') || '<p>Take a province to open a route.</p>'}</div>
    <button class="ghost" id="flyClose">Stay here</button></div>`;
  m.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { m.hidden = true; flightTo(from, dests[+b.dataset.i]); });
  $('flyClose').onclick = () => { m.hidden = true; };
}
function flightTo(from, to) {
  // take off the way this field's planes land, but in reverse; cruise high between; land at the far field
  const dep = [...from.arrive].reverse(), arr = to.arrive, a = dep[dep.length - 1], b = arr[0];
  const mid = [(a[0] + b[0])/2, 22, (a[2] + b[2])/2];
  const pts = [...dep, mid, ...arr];
  return startTrip(to.sea || from.sea ? 'sea' : 'plane', pts, {at:to.off, title:`🛬 Landed: ${to.n}`, sub:'Step off and look around.'}, `✈️ Flying to ${to.n.replace(/^\S+ /, '')}`);
}
