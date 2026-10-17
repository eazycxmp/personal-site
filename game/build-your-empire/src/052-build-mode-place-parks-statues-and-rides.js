// ------------------------------------------------------------------ build mode: place parks, statues and rides anywhere
const DECOR = {
  bench:{n:'Bench', icon:'🪑', cost:200, appeal:2, r:.5}, flowers:{n:'Flower bed', icon:'🌷', cost:300, appeal:3, r:.5},
  tree:{n:'Shade tree', icon:'🌳', cost:250, appeal:3, r:.5}, lamp:{n:'Lamp post', icon:'💡', cost:400, appeal:2, r:.25},
  fountain:{n:'Fountain', icon:'⛲', cost:2000, appeal:10, r:1}, statue:{n:'Statue', icon:'🗿', cost:5000, appeal:15, r:.6},
  gazebo:{n:'Gazebo', icon:'🛖', cost:3500, appeal:12, r:1.1}, carousel:{n:'Carousel', icon:'🎠', cost:15000, appeal:30, r:1.3, ride:true},
  ferris:{n:'Ferris wheel', icon:'🎡', cost:25000, appeal:45, r:1.4, ride:true}, coaster:{n:'Roller coaster', icon:'🎢', cost:60000, appeal:80, r:1.9, ride:true},
};
const decorObjs = [], rides = [];
const appeal = () => (W.decor || []).reduce((a, d) => a + DECOR[d.k].appeal, 0);
const appealMult = () => 1 + Math.min(.75, appeal() * .004 * (policy('appeal') || 1)) + wonderCount()*.05;
function decorMesh(k, x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = k === 'coaster' ? 0 : ry; scene.add(g); g.updateMatrixWorld(true);
  const P = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  if (k === 'bench') { P(G.box, 0x8a5a2b, [1, .07, .35], [0, .42, 0]); P(G.box, 0x8a5a2b, [1, .3, .06], [0, .62, -.16]); for (const x of [-.4, .4]) P(G.box, 0x2a2a2e, [.06, .42, .3], [x, .21, 0]); }
  if (k === 'flowers') { P(G.box, 0x7a5a3a, [1, .25, .7], [0, .12, 0]); P(G.box, 0x4a3020, [.92, .02, .62], [0, .25, 0]); for (let i = 0; i < 12; i++) P(G.sph, [0xff6a8a, 0xffd84a, 0xffffff, 0xb78cff][i % 4], [.08, .08, .08], [-.38 + (i % 6)*.15, .32, i < 6 ? -.15 : .15]); }
  if (k === 'tree') { P(G.cyl, 0x6b4526, [.12, 1.2, .12], [0, .6, 0]); P(G.ico, 0x4a9a3a, [.75, .7, .75], [0, 1.6, 0]); P(G.ico, 0x5ec04c, [.5, .5, .5], [.25, 2, .1]); }
  if (k === 'lamp') { P(G.cyl, 0x2a2e36, [.05, 2.2, .05], [0, 1.1, 0], {metalness:.6}); P(G.box, 0x2a2e36, [.22, .3, .22], [0, 2.25, 0]); bulb(g, 0, 2.25, 0, 0xfff2c8, .1); }
  if (k === 'fountain') { P(G.cyl, 0xe8e2d6, [1, .4, 1], [0, .2, 0]); P(G.cyl, 0x3a9ad0, [.88, .03, .88], [0, .4, 0], {roughness:.1}); P(G.cyl, 0xe8e2d6, [.12, 1, .12], [0, .8, 0]); P(G.cyl, 0xe8e2d6, [.4, .08, .4], [0, 1.3, 0]); rides.push({k:'spray', g}); }
  if (k === 'statue') { P(G.box, 0xd8d2c4, [.8, .8, .8], [0, .4, 0]); P(G.cap, 0xc8a24a, [.55, .7, .55], [0, 1.25, 0], {metalness:.7, roughness:.3}); P(G.sph, 0xc8a24a, [.17, .17, .17], [0, 1.78, 0], {metalness:.7, roughness:.3}); const a = P(G.box, 0xc8a24a, [.08, .5, .08], [.2, 1.85, 0], {metalness:.7}); a.rotation.z = -.4; }
  if (k === 'gazebo') { P(G.cyl, 0xe8e2d6, [1.1, .15, 1.1], [0, .07, 0]); for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2; P(G.cyl, 0xf4f0e6, [.05, 1.6, .05], [Math.cos(a)*.95, .9, Math.sin(a)*.95]); } P(G.cone, 0x2f8a5a, [1.3, .8, 1.3], [0, 2.1, 0]); }
  if (k === 'carousel') {
    P(G.cyl, 0xf4f0e6, [1.3, .2, 1.3], [0, .1, 0]); P(G.cyl, 0xd9a52a, [.1, 2.2, .1], [0, 1.2, 0], {metalness:.6});
    const top = new THREE.Group(); top.position.y = 2.3; g.add(top); mesh(G.cone, 0xd9443a, [1.45, .7, 1.45], [0, 0, 0], top); for (let i = 0; i < 12; i++) bulb(top, Math.cos(i/12*Math.PI*2)*1.4, -.3, Math.sin(i/12*Math.PI*2)*1.4, 0xffd36b, .05);
    const spin = new THREE.Group(); g.add(spin);
    for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2, h = new THREE.Group(); h.position.set(Math.cos(a)*.95, .7, Math.sin(a)*.95); h.rotation.y = -a; spin.add(h); mesh(G.box, [0xffffff, 0xd9a050, 0x6a4226][i % 3], [.16, .26, .5], [0, 0, 0], h); mesh(G.box, 0xffffff, [.12, .22, .12], [0, .18, .22], h); mesh(G.cyl, 0xd9a52a, [.02, 1.4, .02], [0, .3, 0], h, {metalness:.6}); }
    rides.push({k:'carousel', o:spin});
  }
  if (k === 'ferris') {
    for (const x of [-.5, .5]) for (const s of [-1, 1]) { const l = P(G.box, 0xdfe4ea, [.1, 3.2, .1], [x, 1.5, s*.7], {metalness:.5}); l.rotation.x = s*.22; }
    const w = new THREE.Group(); w.position.y = 2.9; g.add(w);
    for (const x of [-.45, .45]) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.1, .05, 6, 32), mat(0xdfe4ea, {metalness:.5})); r.rotation.y = Math.PI/2; r.position.x = x; w.add(r); }
    const cabins = [];
    for (let i = 0; i < 10; i++) {
      const a = i/10*Math.PI*2, s = new THREE.Group(); s.rotation.x = a; w.add(s); mesh(G.box, 0xdfe4ea, [.04, 2.1, .04], [0, 1.05, 0], s);
      const c = new THREE.Group(); c.position.set(0, Math.sin(a)*2.1, Math.cos(a)*2.1); w.parent.add(c); c.userData.a = a;
      mesh(G.box, [0xd9443a, 0x3f7cc0, 0xf2c200, 0x3f9a6a][i % 4], [.5, .4, .4], [0, -.25, 0], c); bulb(c, 0, .05, 0, 0xfff2c8, .05); cabins.push(c);
    }
    rides.push({k:'ferris', o:w, cabins});
  }
  if (k === 'coaster') {
    // a loop of track on stilts, with a train of cars running round it
    const pts = []; for (let i = 0; i < 48; i++) { const a = i/48*Math.PI*2; pts.push([Math.cos(a)*2, 1.2 + Math.sin(a*2)*.8 + Math.sin(a*3)*.4, Math.sin(a)*1.2]); }
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), true, 'centripetal');
    const N = 240, up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(), tg = new THREE.Vector3(), q = new THREE.Vector3();
    const railPts = [[], []], spine = [];
    for (let i = 0; i < N; i++) {
      const u = i / N; curve.getPointAt(u, q); curve.getTangentAt(u, tg); side.crossVectors(tg, up).normalize();
      railPts[0].push(q.clone().addScaledVector(side, -.13)); railPts[1].push(q.clone().addScaledVector(side, .13)); spine.push(q.clone().setY(q.y - .07));
    }
    const steel = mat(0xd9443a, {metalness:.45, roughness:.35});
    for (const rp of railPts) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true), N, .035, 6, true), steel));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spine, true), N, .06, 6, true), mat(0xb8342c, {metalness:.4, roughness:.4})));
    // cross ties every so often, turned to the track
    for (let i = 0; i < 64; i++) {
      const u = i / 64; curve.getPointAt(u, q); curve.getTangentAt(u, tg);
      const tie = mesh(G.box, 0x6a2a24, [.34, .03, .05], [q.x, q.y - .04, q.z], g); tie.lookAt(q.x + tg.x + g.position.x, q.y + tg.y, q.z + tg.z + g.position.z);
      if (i % 5 === 0) P(G.cyl, 0xdfe4ea, [.035, q.y - .07, .035], [q.x, (q.y - .07)/2, q.z]);
    }
    const cars = []; for (let i = 0; i < 4; i++) { const c = new THREE.Group(); g.add(c); mesh(G.box, 0x3f7cc0, [.3, .2, .36], [0, .12, 0], c); bulb(c, 0, .26, 0, 0xffd36b, .04); cars.push(c); }
    rides.push({k:'coaster', pts, curve, cars, g, u:0});
  }
  if (k === 'carousel' || k === 'ferris' || k === 'coaster') riders(k, g);
  decorObjs.push(g);
  return g;
}
const BUILD = {on:false, k:null, ghost:null};
function decorSpot() {
  const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
  return [player.pos.x + s*1.8, player.pos.z + c*1.8];
}
// roads and queues where travelers, recruits and soldiers walk stay clear
const NO_BUILD = [{x0:30.263, x1:51, z0:-.4, z1:3.3}, {x0:39.5, x1:51, z0:3, z1:5.4}, {x0:42, x1:51, z0:76.2, z1:79}, {x0:-10.4, x1:7.6, z0:3.7, z1:5.5},
  {x0:-10.4, x1:2.8, z0:71.2, z1:73.2}, {x0:-10.4, x1:-8.4, z0:71, z1:79}, {x0:4.2, x1:6.2, z0:71, z1:79}];
function decorFits(k, x, z) {
  const r = DECOR[k].r;
  if (NO_BUILD.some(a => x + r > a.x0 && x - r < a.x1 && z + r > a.z0 && z - r < a.z1)) return false;
  if ([...Object.values(GAP_ROADS), ...WORLD.roads, ZOOPARK.path].some(a => x + r > a.x0 && x - r < a.x1 && z + r > a.z0 && z - r < a.z1)) return false;
  if (LAND.rects.some(a => x - r > a.x0 && x + r < a.x1 && z - r > a.z0 && z + r < a.z1) && !boxes.some(b => x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1) && !circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r) && !zones.some(q => Math.abs(q.x - x) < q.w/2 + r && Math.abs(q.z - z) < q.d/2 + r)) return true;
  if (!AREAS.slice(0, 1).concat(Object.values(REGIONS).filter(rg => regionOpen(Object.keys(REGIONS).find(id => REGIONS[id] === rg))).map(rg => rg.rect)).some(a => x - r > a.x0 && x + r < a.x1 && z - r > a.z0 && z + r < a.z1)) return false;
  if (boxes.some(b => x + r > b.x0 && x - r < b.x1 && z + r > b.z0 && z - r < b.z1)) return false;
  if (circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + r)) return false;
  return !zones.some(q => Math.abs(q.x - x) < q.w/2 + r && Math.abs(q.z - z) < q.d/2 + r);
}
function openBuild() {
  const m = $('modal'); m.hidden = false;
  m.innerHTML = `<div class="card"><h1 style="font-size:26px">🏗️ Build</h1><p>Parks, statues and rides make your town nicer: guests pay more and stay happy. Pick one, then walk to where you want it.</p>
    <div class="palette">${Object.entries(DECOR).map(([k, d]) => `<button data-k="${k}" ${W.coins < d.cost ? 'disabled' : ''}><span>${d.icon}</span>${d.n}<small>${d.cost.toLocaleString()} 💵</small></button>`).join('')}</div>
    <p class="keys">Appeal ${appeal()} · guests pay +${Math.round((appealMult() - 1)*100)}%</p>
    ${(W.decor || []).length ? '<button class="ghost" id="bdUndo">Sell the last one (half back)</button>' : ''}<button class="ghost" id="bdClose">Close</button></div>`;
  m.querySelectorAll('.palette button').forEach(b => b.onclick = () => { m.hidden = true; startPlacing(b.dataset.k); });
  $('bdClose').onclick = () => { m.hidden = true; };
  if ($('bdUndo')) $('bdUndo').onclick = () => {
    const d = W.decor.pop(), back = Math.floor(DECOR[d.k].cost / 2), g = decorObjs.pop();
    scene.remove(g); const ci = circles.findIndex(c => c.decor === g); if (ci >= 0) circles.splice(ci, 1);
    for (let i = rides.length; i--;) if (rides[i].g === g || rides[i].o?.parent === g || rides[i].o?.parent?.parent === g) rides.splice(i, 1);
    W.coins += back; W.upSpent -= back; m.hidden = true; save();
  };
}
function startPlacing(k) {
  BUILD.on = true; BUILD.k = k;
  if (BUILD.ghost) scene.remove(BUILD.ghost);
  BUILD.ghost = decorMesh(k, 0, 0); decorObjs.pop();
  BUILD.ghost.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .55; o.castShadow = false; } });
  $('placeBar').hidden = false; $('placeName').textContent = `${DECOR[k].icon} ${DECOR[k].n}`;
}
function endPlacing() { BUILD.on = false; if (BUILD.ghost) scene.remove(BUILD.ghost); BUILD.ghost = null; $('placeBar').hidden = true; }
function placeDecor() {
  const k = BUILD.k, d = DECOR[k], [x, z] = decorSpot();
  if (W.coins < d.cost) { popText('Not enough 💵', player.pos.clone().setY(2.8), '#ffcdb8'); return; }
  if (!decorFits(k, x, z)) { popText('No room here', player.pos.clone().setY(2.8), '#ffcdb8'); return; }
  W.coins -= d.cost; W.upSpent += d.cost;
  (W.decor ||= []).push({k, x:+x.toFixed(2), z:+z.toFixed(2), ry:+player.yaw.toFixed(2)});
  const g = decorMesh(k, x, z, player.yaw); popIn(g); puff(x, z);
  circles.push({x, z, r:d.r, decor:g});
  snd(523, .1, 'triangle', .05); setTimeout(() => snd(784, .14, 'triangle', .05), 90);
  popText(`${d.icon} +${d.appeal} appeal`, new THREE.Vector3(x, 2.6, z), '#b8f59a');
  save(); endPlacing();
}
function updBuild(dt) {
  if (BUILD.ghost) {
    const [x, z] = decorSpot(), ok = decorFits(BUILD.k, x, z) && W.coins >= DECOR[BUILD.k].cost;
    BUILD.ghost.position.set(x, 0, z); BUILD.ghost.rotation.y = player.yaw;
    BUILD.ghost.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.setHex(ok ? 0x103a10 : 0x5a1010); });
  }
  for (const r of rides) {
    if (r.k === 'carousel') r.o.rotation.y += dt*.8;
    if (r.k === 'ferris') { r.o.rotation.x += dt*.25; for (const c of r.cabins) { const a = c.userData.a + r.o.rotation.x; c.position.set(0, 2.9 + Math.sin(a)*2.1, Math.cos(a)*2.1); } }
    if (r.k === 'coaster') {
      // the train slows on the climbs and rushes down the drops (lower track = faster), gliding along the curve
      const lead = r.curve.getPointAt(r.u), v = .07 + .09*clamp((2.4 - lead.y) / 2, 0, 1);
      r.u = (r.u + dt*v) % 1;
      r.cars.forEach((c, i) => {
        const u = ((r.u - i*.03) % 1 + 1) % 1, p = r.curve.getPointAt(u), t = r.curve.getTangentAt(u);
        c.position.set(p.x, p.y + .03, p.z); c.lookAt(p.x + t.x + r.g.position.x, p.y + .03 + t.y, p.z + t.z + r.g.position.z);
      });
    }
    if (r.k === 'spray' && R() < dt*10) particle(0xcfefff, r.g.position.clone().setY(1.35), new THREE.Vector3((R() - .5)*1.2, 1.4 + R(), (R() - .5)*1.2), .7, .05, {grav:1});
  }
}

