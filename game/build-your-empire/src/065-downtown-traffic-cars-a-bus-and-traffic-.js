// ------------------------------------------------------------------ downtown traffic: cars, a bus and traffic lights
const TRAFFIC = {cars:[], lights:[], bus:null};
const LOOP = [[34.9, -31.6], [49.9, -31.6], [49.9, -46.9], [34.9, -46.9]];
function trafficFx() {
  // asphalt with lane markings and kerbs, round the block and across the middle
  for (let i = 0; i < 4; i++) {
    const [ax, az] = LOOP[i], [bx, bz] = LOOP[(i + 1) % 4], alongX = az === bz, len = Math.hypot(bx - ax, bz - az) + 1.5;
    slab(0x3a3d42, alongX ? len : 1.5, alongX ? 1.5 : len, (ax + bx)/2, (az + bz)/2, .012);
    for (let t = -len/2 + .6; t < len/2 - .4; t += 1.1) slab(0xf2f2f2, alongX ? .55 : .07, alongX ? .07 : .55, (ax + bx)/2 + (alongX ? t : 0), (az + bz)/2 + (alongX ? 0 : t), .016);
    for (const k of [-1, 1]) slab(0xbdb8ae, alongX ? len : .12, alongX ? .12 : len, (ax + bx)/2 + (alongX ? 0 : k*.81), (az + bz)/2 + (alongX ? k*.81 : 0), .03);
  }
  for (const [x, z] of LOOP) for (let k = -2; k <= 2; k++) slab(0xf4f4f4, .7, .14, x + (x < 40 ? 1.4 : -1.4), z + k*.28, .017);
  const cols = [0xd9443a, 0x3f7cc0, 0xf2c200, 0xf4f4f4, 0x1e1e22, 0x3f9a6a];
  const per = LOOP.reduce((a, p, i) => a + Math.hypot(LOOP[(i + 1) % 4][0] - p[0], LOOP[(i + 1) % 4][1] - p[1]), 0);
  // traffic lights at each corner
  for (const [x, z] of LOOP) {
    const g = new THREE.Group(); g.position.set(x + (x < 40 ? -.7 : .7), 0, z + (z > -38 ? .7 : -.7)); scene.add(g);
    mesh(G.cyl, 0x2a2e36, [.04, 1.8, .04], [0, .9, 0], g, {metalness:.5}); mesh(G.box, 0x1a1a1e, [.18, .5, .14], [0, 1.85, 0], g);
    const l = [bulb(g, 0, 2.02, .08, 0xff3030, .05), bulb(g, 0, 1.86, .08, 0xffc030, .05), bulb(g, 0, 1.7, .08, 0x30ff60, .05)];
    TRAFFIC.lights.push({l, x, z});
  }
  // a bus shelter
  const sh = new THREE.Group(); sh.position.set(42, 0, -47.6); scene.add(sh);
  mesh(G.box, 0x8fc6e8, [1.6, 1.2, .05], [0, .8, -.3], sh, {metalness:.4, roughness:.1, transparent:true, opacity:.6}); mesh(G.box, 0x3a3e44, [1.8, .08, .7], [0, 1.45, 0], sh);
}
function loopAt(s) {
  let r = ((s % TRAFFIC.cars[0].per) + TRAFFIC.cars[0].per) % TRAFFIC.cars[0].per;
  for (let i = 0; i < 4; i++) {
    const [ax, az] = LOOP[i], [bx, bz] = LOOP[(i + 1) % 4], l = Math.hypot(bx - ax, bz - az);
    if (r <= l) { const t = r / l; return [ax + (bx - ax)*t, az + (bz - az)*t, Math.atan2(bx - ax, bz - az), i]; }
    r -= l;
  }
  return [...LOOP[0], 0, 0];
}
function updTraffic(dt) {
  if (!TRAFFIC.lights.length) return;
  const phase = Math.floor(time / 7) % 2;   // corners 0 and 2 go together, then 1 and 3
  TRAFFIC.lights.forEach((t, i) => { const green = (i % 2) === phase, amber = (time % 7) > 5.8; t.l[0].visible = !green; t.l[1].visible = green && amber; t.l[2].visible = green && !amber; });
  for (const v of TRAFFIC.cars) {
    if (v.wait > 0) { v.wait -= dt; continue; }
    const [x, z, a, seg] = loopAt(v.s), next = (seg + 1) % 4, [nx, nz] = LOOP[next], toCorner = Math.hypot(nx - x, nz - z);
    const red = (next % 2) !== phase || (time % 7) > 5.8;
    const ahead = TRAFFIC.cars.some(o => o !== v && ((o.s - v.s + v.per) % v.per) > 0 && ((o.s - v.s + v.per) % v.per) < 1.6);
    if (!(red && toCorner < 1.4 && toCorner > .4) && !ahead) v.s += v.speed*dt;
    v.g.position.set(x, 0, z); v.g.rotation.y = a;
    if (v.bus && Math.abs(x - 42) < .1 && seg === 2 && !v.stopped) { v.wait = 3; v.stopped = true; for (let i = 0; i < 2 && movers.length < MAX_MOVERS; i++) spawnMover([[42 + i*.4, -47.8], [42, -47.2]], null, false); }
    if (v.bus && seg !== 2) v.stopped = false;
  }
}

