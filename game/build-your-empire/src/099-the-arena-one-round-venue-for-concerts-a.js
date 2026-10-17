// ------------------------------------------------------------------ the arena: one round venue for concerts and matches, from an open-air amphitheater to a domed stadium
const ARENA = {lv:0, g:null, boxes:[], parts:{}, go:'', t:25, crowd:null, seats:[], dancers:null, dance:[], halo:null, screens:[], lasers:[], pyroT:0, screenT:0};
const ARX = 3.95, ARY = 5.15;
// a point on the oval, `off` beyond the pitch edge, in arena-local coordinates
const arenaPt = (off, t) => [(ARX + off)*Math.cos(t), -(ARY + off)*Math.sin(t)];
// one simple figure, merged so a whole crowd is a single draw call
const CROWD_GEO = (() => {
  const body = new THREE.CapsuleGeometry(.13, .32, 2, 6); body.translate(0, .3, 0);
  const head = new THREE.SphereGeometry(.11, 8, 6); head.translate(0, .64, 0);
  return mergeGeometries([body, head]);
})();
function crowdMesh(n) {
  const m = new THREE.InstancedMesh(CROWD_GEO, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.8}), n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) m.setColorAt(i, c.setHSL(R(), .55 + R()*.3, .35 + R()*.3));
  m.castShadow = false; m.receiveShadow = false; return m;
}
function arenaBoxes(lv) {
  const [cx, cz] = RUGBY.at;
  for (const b of ARENA.boxes) { const i = boxes.indexOf(b); if (i >= 0) boxes.splice(i, 1); }
  const o = lv >= 2 ? 2.55 : 1.9, X = ARX + o, Y = ARY + o;
  ARENA.boxes = [
    {x0:cx - X, x1:cx - ARX + .1, z0:cz - Y + 1, z1:cz + Y - 1},
    {x0:cx + ARX - .1, x1:cx + X, z0:cz - Y + 1, z1:cz + Y - 1},
    {x0:cx - ARX, x1:cx - 1, z0:cz + ARY - .1, z1:cz + Y},
    {x0:cx + 1, x1:cx + ARX, z0:cz + ARY - .1, z1:cz + Y}];
  if (lv >= 2) ARENA.boxes.push({x0:cx - ARX, x1:cx + ARX, z0:cz - Y, z1:cz - ARY + .1});
  boxes.push(...ARENA.boxes);
}
function arenaStage(n, anim) {
  ARENA.lv = Math.max(ARENA.lv, n);
  const [cx, cz] = RUGBY.at, P = ARENA.parts;
  if (!ARENA.g) {
    clearForest({x0:54, x1:69, z0:61.5, z1:79});
    slab(0x8a8478, 13.4, 16, cx, cz, .004);
    AREAS.push({x0:50.4, x1:56.6, z0:77, z1:78.2}, {x0:55, x1:68, z0:62.6, z1:78.2});
    // a path round the west side of the bowl joins the stadium to the zoo strip (the civic block fills the strip further south)
    clearForest({x0:53.2, x1:55.5, z0:61.4, z1:78.4});
    AREAS.push({x0:53.4, x1:55.3, z0:61.6, z1:78.2}, {x0:53.4, x1:57.2, z0:61.6, z1:62.8});
    slab(0xb98f5c, 1.9, 16.6, 54.35, 69.9, .012); slab(0xb98f5c, 3.8, 1.2, 55.3, 62.2, .012);
    ARENA.g = new THREE.Group(); ARENA.g.position.set(cx, 0, cz); scene.add(ARENA.g);
    // the floor: a lawn for the amphitheater, a striped pitch later
    const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat(0x5aa83c, {roughness:.95})); lawn.rotation.x = -Math.PI/2; lawn.scale.set(ARX, ARY, 1); lawn.position.y = .012; lawn.receiveShadow = true; ARENA.g.add(lawn); P.lawn = lawn;
    arenaStageSet();
  }
  if (ARENA.lv === 1 && !P.amph) {
    P.amph = model('amph', 12.1, 'x') || new THREE.Group(); ARENA.g.add(P.amph);
    arenaSeats(4, k => [.45*(k + .5), .2 + .3*k + .02], Math.PI*.64, Math.PI*2.36, .55);
  }
  if (ARENA.lv >= 2 && !P.bowl) {
    if (P.amph) { ARENA.g.remove(P.amph); P.amph = null; }
    P.bowl = model('bowl', 13.16, 'x') || new THREE.Group(); ARENA.g.add(P.bowl);
    // the pitch with stripes, lines and posts
    const pitch = new THREE.Group(); ARENA.g.add(pitch); P.pitch = pitch;
    for (let i = 0; i < 8; i++) mesh(G.box, i % 2 ? 0x3f9a3a : 0x4aa844, [7.2, .02, 1.2], [0, .03, -4.2 + i*1.2], pitch);
    for (const z of [-4.6, 0, 4.6]) mesh(G.box, 0xf4f4f4, [7.2, .03, .05], [0, .045, z], pitch);
    for (const x of [-3.6, 3.6]) mesh(G.box, 0xf4f4f4, [.05, .03, 9.6], [x, .045, 0], pitch);
    for (const z of [-4.8, 4.8]) { for (const x of [-.45, .45]) mesh(G.cyl, 0xf4f4f4, [.04, 2.6, .04], [x, 1.3, z], pitch); mesh(G.box, 0xf4f4f4, [.9, .05, .05], [0, .9, z], pitch); }
    P.lawn.visible = false;
    // floodlights on the rim
    for (let i = 0; i < 6; i++) { const [x, z] = arenaPt(2.15, Math.PI/6 + i*Math.PI/3); bulb(ARENA.g, x*.97, 4.4, z*.97, 0xffffff, .22); }
    if (ARENA.crowd) { ARENA.g.remove(ARENA.crowd); ARENA.seats = []; }
    const lower = k => [.25*(k + 1) - .125, .35 + .3*k + .02], upper = k => [1.12 + .24*(k + 1) - .12, 1.73 + .34*k + .02];
    arenaSeats(4, lower, 0, Math.PI*2, .62, upper);
    // the scoreboard hangs over the south end
    const sc = document.createElement('canvas'); sc.width = 256; sc.height = 96; RUGBY.board = {c:sc, t:new THREE.CanvasTexture(sc)};
    const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:RUGBY.board.t, toneMapped:false, side:THREE.DoubleSide})); s.scale.set(2.6, .95, 1); s.position.set(0, 4.3, ARY + 1.7); ARENA.g.add(s);
    drawBoard();
    RUGBY.g = ARENA.g;
  }
  if (ARENA.lv >= 3 && !P.roof) {
    P.roof = model('roof', 13, 'x') || new THREE.Group(); ARENA.g.add(P.roof);
    // a ring screen hangs over the middle, like the newest stadiums
    const c = document.createElement('canvas'); c.width = 1024; c.height = 96; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, .85, 48, 1, true), new THREE.MeshBasicMaterial({map:t, side:THREE.DoubleSide, toneMapped:false}));
    halo.position.y = 4.9; ARENA.g.add(halo); ARENA.halo = halo; ARENA.screens.push({c, t, wide:true});
    for (const y of [5.33, 4.47]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(2.42, .05, 6, 48), mat(0x2a2e36, {metalness:.6})); rim.rotation.x = Math.PI/2; rim.position.y = y; ARENA.g.add(rim); }
    for (const a of [0, 2.1, 4.2]) mesh(G.cyl, 0x8a8f96, [.02, 1.6, .02], [Math.cos(a)*2.3, 6.1, Math.sin(a)*2.3], ARENA.g);
  }
  arenaBoxes(ARENA.lv);
  if (anim) { popIn(ARENA.g); banner(['', '🎸 Amphitheater!', '🏟️ Stadium!', '🌐 Domed stadium!'][ARENA.lv], ['', 'An open-air stage with a dance floor: the band plays every few minutes.', 'A full bowl: rugby on matchdays, concerts in between, and a full house paying at the gate.', 'A glass canopy and a ring screen: lasers, pyro and the biggest shows in the world.'][ARENA.lv]); }
}
// seats on each tier, filled with fans
function arenaSeats(tiers, at, a0, a1, step, at2) {
  const seats = [];
  for (const f of [at, at2]) if (f) for (let k = 0; k < tiers; k++) {
    const [off, y] = f(k), per = Math.round((a1 - a0) * (ARX + ARY)/2 / step);
    for (let i = 0; i < per; i++) { const t = a0 + (a1 - a0)*(i + (k % 2)*.5)/per, [x, z] = arenaPt(off, t); seats.push([x, y, z, Math.atan2(-x, -z)]); }
  }
  const m = ARENA.crowd = crowdMesh(seats.length); ARENA.seats = seats; ARENA.g.add(m); arenaCrowd(0);
}
function arenaCrowd(full, jump = 0) {
  const m = ARENA.crowd; if (!m) return;
  const o = arenaCrowd.o ||= new THREE.Object3D();
  ARENA.seats.forEach(([x, y, z, ry], i) => {
    const on = ((i * 7919) % 100) / 100 < full;
    o.position.set(x, y + (on ? Math.max(0, Math.sin(time*9 + i))*jump : 0), z); o.rotation.set(0, ry, 0); o.scale.setScalar(on ? 1 : 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
}
// the stage at the north end: deck, LED wall, truss, speakers, the band and the lights
function arenaStageSet() {
  const g = new THREE.Group(); g.position.set(0, 0, -ARY + 1.2); ARENA.g.add(g); GIG.g = g; ARENA.stage = g;
  GIG.at = [RUGBY.at[0], RUGBY.at[1] - ARY + 1.2];
  mesh(G.box, 0x1e1e24, [5.6, .7, 2.2], [0, .35, 0], g); mesh(G.box, 0x3a3a42, [5.8, .06, 2.3], [0, .72, 0], g);
  mesh(G.box, 0x1e1e24, [1, .5, 1.4], [0, .45, 1.6], g);
  const c = document.createElement('canvas'); c.width = 512; c.height = 192; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:t, toneMapped:false})); wall.scale.set(5, 1.9, 1); wall.position.set(0, 1.85, -.95); g.add(wall);
  ARENA.screens.push({c, t});
  for (const x of [-2.75, 2.75]) { mesh(G.box, 0x3a3e44, [.14, 3.6, .14], [x, 1.8, -.9], g, {metalness:.6}); mesh(G.box, 0x111114, [.7, 1.5, .6], [x*1.12, 1.45, .4], g); mesh(G.cyl, 0x3a3a42, [.22, .05, .22], [x*1.12, 1.7, .71], g).rotation.x = Math.PI/2; }
  mesh(G.box, 0x3a3e44, [5.8, .16, .16], [0, 3.6, -.9], g, {metalness:.6}); mesh(G.box, 0x3a3e44, [5.8, .16, .16], [0, 3.6, .7], g, {metalness:.6});
  for (let i = 0; i < 6; i++) bulb(g, -2.3 + i*.92, 3.45, .7, [0xff4fb0, 0x5af0ff, 0xffd36b][i % 3], .08);
  const looks = [{civ:3}, {civ:11}, {civ:17}, {civ:23}];
  [[0, .9], [-1.6, .5], [1.6, .5], [0, -.4]].forEach(([x, z], i) => {
    const ch = makeChar(looks[i]); scene.remove(ch.g); ch.g.position.set(x, .74, z); g.add(ch.g);
    if (i === 0) { mesh(G.cyl, 0x2a2a2e, [.02, 1.3, .02], [0, .65, .45], ch.g, {metalness:.6}); mesh(G.sph, 0x2a2a2e, [.06, .08, .06], [0, 1.35, .45], ch.g); }
    if (i === 1 || i === 2) { const gt = new THREE.Group(); gt.position.set(0, .95, .3); gt.rotation.z = .7; ch.g.add(gt); mesh(G.box, i === 1 ? 0xd9443a : 0x1f5fb8, [.34, .42, .08], [0, -.1, 0], gt); mesh(G.box, 0x5e3f22, [.06, .55, .05], [0, .35, 0], gt); }
    if (i === 3) { mesh(G.cyl, 0xd9d9d9, [.32, .3, .32], [0, .45, .55], ch.g); for (const x2 of [-.45, .45]) mesh(G.cyl, 0xf2c200, [.22, .03, .22], [x2, .9, .45], ch.g, {metalness:.8}); }
    GIG.band.push(ch);
  });
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(.6, 6, 16, 1, true), new THREE.MeshBasicMaterial({color:[0xff4fb0, 0x5af0ff, 0xffd36b, 0xb78cff][i], transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide}));
    s.position.set(-2.4 + i*1.6, 3.3, .7); s.rotation.x = -.9; g.add(s); GIG.lights.push(s);
  }
  // lasers for the bigger venues
  for (let i = 0; i < 6; i++) {
    const l = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:i % 2 ? 0x3aff6a : 0xb04fff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
    l.scale.set(.025, 12, .025); const pv = new THREE.Group(); pv.position.set(-2 + i*.8, 3.5, -.6); g.add(pv); l.position.y = 6; pv.add(l); ARENA.lasers.push(pv);
  }
  // the dance floor in front of the stage
  const spots = [];
  for (let i = 0; i < 70; i++) spots.push([(R() - .5)*6.2, 2 + Math.pow(R(), .7)*5.2]);
  ARENA.dance = spots; const d = ARENA.dancers = crowdMesh(spots.length); g.add(d); d.visible = false;
}
function drawScreen(sc, mode) {
  const g = sc.c.getContext('2d'), W = sc.c.width, H = sc.c.height;
  if (mode === 'game') {
    g.fillStyle = '#0a1a3a'; g.fillRect(0, 0, W, H);
    g.font = `900 ${H*.5}px ui-rounded,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < (sc.wide ? 4 : 1); k++) { const x = (k + .5) * W / (sc.wide ? 4 : 1); g.fillStyle = '#ff6a5a'; g.fillText(RUGBY.score[0], x - H*.6, H/2); g.fillStyle = '#fff'; g.fillText('🏉', x, H/2); g.fillStyle = '#6ab0ff'; g.fillText(RUGBY.score[1], x + H*.6, H/2); }
  } else {
    const h = (time*40) % 360, gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, `hsl(${h},90%,45%)`); gr.addColorStop(.5, `hsl(${(h + 90) % 360},90%,55%)`); gr.addColorStop(1, `hsl(${(h + 180) % 360},90%,45%)`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // dancing silhouettes
    g.fillStyle = 'rgba(0,0,0,.55)';
    const n = sc.wide ? 18 : 7;
    for (let k = 0; k < n; k++) { const x = (k + .5)*W/n, y = H*.62 + Math.sin(time*8 + k)*H*.06, s = H*.16; g.beginPath(); g.arc(x, y - s*1.4, s*.45, 0, 7); g.fill(); g.fillRect(x - s*.35, y - s, s*.7, s*1.3); g.save(); g.translate(x, y - s*.8); g.rotate(Math.sin(time*9 + k)*.8 - 1.2); g.fillRect(0, -s*.1, s*1.1, s*.2); g.restore(); }
    g.font = `900 ${H*.28}px ui-rounded,sans-serif`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(mode === 'live' ? 'LIVE' : 'TONIGHT', W/2, H*.24);
  }
  sc.t.needsUpdate = true;
}
function updArena(dt) {
  if (!ARENA.g || !started) return;
  const concert = GIG.on > 0, game = RUGBY.on > 0;
  if (!concert && !game && (ARENA.t -= dt) <= 0) {
    ARENA.t = 70 + R()*50;
    ARENA.go = ARENA.lv >= 2 && ARENA.last === 'concert' ? 'game' : 'concert'; ARENA.last = ARENA.go;
  }
  if (ARENA.stage) ARENA.stage.visible = !game;
  if (P_PITCH()) P_PITCH().visible = true;
  // the stands fill up for events and roar for tries and encores
  if ((ARENA.crowdT = (ARENA.crowdT || 0) - dt) <= 0) { ARENA.crowdT = concert || game ? .05 : 1; arenaCrowd(concert || game ? .95 : .25, concert ? .12 : (RUGBY.cheer > 0 ? .2 : .04)); }
  // dancers in front of the stage
  const d = ARENA.dancers;
  if (d) {
    d.visible = concert;
    if (concert) {
      const o = updArena.o ||= new THREE.Object3D();
      ARENA.dance.forEach(([x, z], i) => { o.position.set(x + Math.sin(time*2 + i)*.08, .74*0 + Math.max(0, Math.sin(time*9 + i*1.7))*.22, z); o.rotation.set(0, Math.PI + Math.sin(time*3 + i)*.5, Math.sin(time*6 + i)*.15); o.scale.setScalar(1); o.updateMatrix(); d.setMatrixAt(i, o.matrix); });
      d.instanceMatrix.needsUpdate = true;
    }
  }
  // lasers in the stadium and the dome, pyro from the stadium on
  ARENA.lasers.forEach((p, i) => { const on = concert && ARENA.lv >= 2; p.children[0].material.opacity += ((on ? .5 : 0) - p.children[0].material.opacity) * Math.min(1, dt*4); p.rotation.set(-.9 + Math.sin(time*1.7 + i)*.4, 0, Math.sin(time*1.3 + i*1.1)*.9); });
  if (concert && ARENA.lv >= 2 && (ARENA.pyroT -= dt) <= 0) {
    ARENA.pyroT = 1.4;
    for (const sx of [-2.6, 2.6]) for (let k = 0; k < 10; k++) particle(k % 2 ? 0xffd36b : 0xff7a2a, new THREE.Vector3(GIG.at[0] + sx, .8, GIG.at[1] + .9), new THREE.Vector3((R() - .5)*1.2, 6 + R()*3, (R() - .5)*1.2), 1, .1, {grav:1});
  }
  if ((ARENA.screenT -= dt) <= 0) { ARENA.screenT = .2; for (const sc of ARENA.screens) drawScreen(sc, game ? 'game' : concert ? 'live' : 'idle'); }
  if (ARENA.halo) ARENA.halo.rotation.y += dt*.15;
}
const P_PITCH = () => ARENA.parts.pitch;

