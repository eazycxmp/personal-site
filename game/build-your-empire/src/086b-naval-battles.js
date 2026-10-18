// ------------------------------------------------------------------ naval battles against rivals with a coast: your fleet sails to their own waters
// Down the river and out to sea, across to their coast; their navy comes out to meet you (galleons, then ironclads,
// dreadnoughts and carriers as they grow), the two fleets trade broadsides, and once their ships are sunk your guns turn
// on their harbour. Lose, and their ships stay afloat while yours limp home smoking.
const NAVAL = {foes:[], fireT:0};
// open water: the sea, but not a rival's city (Port Azul is built out over the water)
const seaOK = (x, z) => isWater(x, z) && !Object.values(CITY_LAND).some(L => x > L.x0 - 2 && x < L.x1 + 2 && z > L.z0 - 2 && z < L.z1 + 2);
const segOK = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5); for (let k = 0; k <= n; k++) if (!seaOK(a[0] + (b[0] - a[0])*k/n, a[1] + (b[1] - a[1])*k/n)) return false; return true; };
function navalRoute(r) {
  const east = r.at[0] > 0, sx = east ? 1 : -1;
  const pts = [[-15.2, -6], [-15.2, -48], [-15.2, -82.6]];
  // along our own coast to a near rival, or out round the world's edge to a far one
  if (r.coast) pts.push([r.at[0]*.5, -82.6]);
  else pts.push([sx*160, -82.6], [sx*200, -104], [sx*345, -104], [sx*362, -20]);   // hugging the coast past Port Azul's harbour
  // anchor in the nearest open water to their city that a ship can reach in a straight line from the last turn
  const last = pts[pts.length - 1]; let best = null, bd = 1e9;
  for (let rad = 8; rad <= 60 && !best; rad += 2) for (let k = 0; k < 64; k++) {
    const a = k/64*Math.PI*2, x = r.at[0] + Math.cos(a)*rad, z = r.at[1] + Math.sin(a)*rad;
    if (!seaOK(x, z) || ![[4, 0], [-4, 0], [0, 4], [0, -4]].every(([dx, dz]) => seaOK(x + dx, z + dz)) || !segOK(last, [x, z])) continue;
    const d = Math.hypot(x - last[0], z - last[1]); if (d < bd) { bd = d; best = [x, z]; }
  }
  pts.push(best || last);
  return pts;
}
// their warships: a red ensign on each, and a look for how strong they are
function rivalShip(tier) {
  const g = new THREE.Group(); scene.add(g);
  if (tier <= 1) galleon(g, SHIPS.pirate()); else warshipLook(g, tier);
  mesh(G.cyl, 0x3a3a3e, [.03, 1.6, .03], [0, 2.2, -1.2], g); mesh(G.box, 0xb8322a, [.6, .36, .03], [.31, 2.8, -1.2], g);
  return {g, sink:0, hp:1};
}
function startNaval(C, r) {
  const s = es(r), pts = navalRoute(r), len = pathLen(pts);
  C.naval = {pts, anchor:pts[pts.length - 1], city:r.at, sail:Math.min(40, Math.max(14, len/12)), fight:20};
  C.t = C.dur = C.naval.sail + C.naval.fight + 4;
  // your fleet: the warship and two escorts
  const war = boats.find(b => b.kind === 'war');
  if (war) { war.inFleet = true; addCrew(war); }
  for (let k = 0; k < 2; k++) { const b = escortBoat(); b.inFleet = true; b.temp = true; addCrew(b); }
  fleet().forEach((b, k) => { b.slot = k; b.yawS = undefined; });
  // their fleet waits between you and their harbour
  const [ax, az] = C.naval.anchor, dx = r.at[0] - ax, dz = r.at[1] - az, d = Math.hypot(dx, dz) || 1, ux = dx/d, uz = dz/d;
  const n = Math.min(4, 2 + Math.floor(s.pow/40)), tier = clamp(1 + Math.floor(s.pow/45), 1, 4);
  // their line at the anchorage (stepped out to sea where the coast bends), yours 10 further out, ships 7 apart
  NAVAL.foes = [...Array(n)].map((_, k) => { const f = rivalShip(tier), side = (k - (n - 1)/2)*7; let x = ax - uz*side, z = az + ux*side; for (let j = 0; j < 20 && !seaOK(x, z); j++) { x -= ux*1.5; z -= uz*1.5; } f.x = x; f.z = z; f.yaw = Math.atan2(-uz, ux); return f; });
  NAVAL.dir = [ux, uz];
  // the voyage ends where your line forms, 10 out from theirs
  const route = [...pts.slice(0, -1), [ax - ux*10, az - uz*10]];
  // straight legs between the checked turning points (a smooth curve would cut the corners across land); ships ease round the turns
  NAVAL.route = route; NAVAL.len = pathLen(route);
}
function updNaval(dt) {
  const C = W.camp, N = C.naval, e = C.dur - C.t, win = C.win !== false, [ux, uz] = NAVAL.dir;
  const u = clamp(e / N.sail, 0, 1), ease = u*u*(3 - 2*u), fl = fleet();
  fl.forEach((b, k) => {
    let x, z, yaw;
    if (u < 1) {
      // in line astern along the route, a ship's length apart (those still in the river wait their turn behind)
      const d = ease*NAVAL.len - k*8.5;
      if (d < 0) { x = NAVAL.route[0][0]; z = NAVAL.route[0][1] - d; yaw = Math.PI; }
      else { [x, z, yaw] = routeAt(NAVAL.route, d); }
      let dy = yaw - (b.yawS ?? yaw); dy = Math.atan2(Math.sin(dy), Math.cos(dy)); b.yawS = (b.yawS ?? yaw) + dy*Math.min(1, dt*2.5); yaw = b.yawS;
    } else {
      // line abreast off their coast, broadside on to their fleet
      const side = (k - (fl.length - 1)/2)*7, [ax, az] = N.anchor;
      x = ax - ux*10 - uz*side; z = az - uz*10 + ux*side; yaw = Math.atan2(-uz, ux);
    }
    b.x = x; b.z = z;
    b.g.position.set(x, Math.sin(time*2 + x)*.06 - .26, z); b.g.rotation.y = yaw; b.g.rotation.z = Math.sin(time*1.6 + z*.1)*.05;
    if (!win && e > N.sail + 6 && R() < dt*4) particle(0x4a4a4a, new THREE.Vector3(x, 1.4, z), new THREE.Vector3(0, 2, 0), 1.6, .4, {grow:.8, op:.6});
  });
  const fe = e - N.sail;
  NAVAL.foes.forEach((f, i) => {
    // they come out to meet you; if you are winning they go down one by one
    if (win && fe > 4 + i*3.5) f.sink = Math.min(1.6, f.sink + dt*.45);
    f.g.position.set(f.x, -.26 - f.sink*2.4 + Math.sin(time*2 + i)*.06, f.z); f.g.rotation.y = f.yaw + Math.sin(time*.9 + i)*.05; f.g.rotation.z = f.sink*.8;
    if (f.sink > 0 && f.sink < 1.5 && R() < dt*14) particle(R() < .5 ? 0xff7a2a : 0x4a4a4a, new THREE.Vector3(f.x + (R() - .5)*2, 1.2 - f.sink, f.z + (R() - .5)), new THREE.Vector3(0, 2.5, 0), .9, .25, {grow:.5, op:.75});
  });
  if (fe < 0 || fe > N.fight || !fl.length || (NAVAL.fireT -= dt) > 0) return;
  NAVAL.fireT = .26;
  const afloat = NAVAL.foes.filter(f => f.sink < .4), b = fl[R()*fl.length|0], roll = R();
  if (afloat.length && roll < .55) { const f = afloat[R()*afloat.length|0]; navyShot(b.g.position, f.g.position.clone().setY(.6), R() < (win ? .7 : .35)); }
  else if (afloat.length) { const f = afloat[R()*afloat.length|0]; broadside(f.g.position, b.g.position.clone().setY(.6), R() < (win ? .25 : .55)); }
  else {
    // their fleet is gone: shell the harbour, and fires break out in the city
    const [cx, cz] = N.city, tp = new THREE.Vector3(cx + (R() - .5)*12, .8, cz + (R() - .5)*12);
    navyShot(b.g.position, tp, true, () => { for (let k = 0; k < 6; k++) particle(R() < .5 ? 0xff7a2a : 0x555555, tp, new THREE.Vector3((R() - .5)*3, 2 + R()*2, (R() - .5)*3), 1.2, .35, {grow:.6, op:.75}); });
  }
  if (watchingWar() && R() < .3) shakeCam(.05);
}
// a point a given distance along a polyline, and the heading of that leg
function routeAt(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az);
    if (d <= L || i === pts.length - 1) { const u = L ? Math.min(1, d/L) : 1; return [ax + (bx - ax)*u, az + (bz - az)*u, Math.atan2(bx - ax, bz - az)]; }
    d -= L;
  }
  return [pts[0][0], pts[0][1], 0];
}
function endNaval() { for (const f of NAVAL.foes) scene.remove(f.g); NAVAL.foes = []; }
