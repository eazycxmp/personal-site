// ------------------------------------------------------------------ the Moon: walk it yourself in a suit, under a ringed planet, with ships overhead
function spaceDressing(S) {
  if (S.dressed || S.belt) return; S.dressed = true;
  const mars = S.planet === 'mars';
  // a sky that glows warm at the horizon and fades to deep blue overhead
  const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 16), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, uniforms:{a:{value:new THREE.Color(mars ? 0xe0a070 : 0x6a7a9a)}, b:{value:new THREE.Color(mars ? 0x2a1a2a : 0x05070f)}},
    vertexShader:'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:'uniform vec3 a; uniform vec3 b; varying float h; void main(){ gl_FragColor = vec4(mix(a, b, smoothstep(-.05, .45, h)), 1.0); }'}));
  sky.renderOrder = -1; S.sc.add(sky);
  // a ringed planet hangs in the sky
  const pl = new THREE.Group(); pl.position.set(60, 55, -120); pl.rotation.set(.3, 0, .35); S.sc.add(pl);
  pl.add(new THREE.Mesh(new THREE.SphereGeometry(14, 32, 20), new THREE.MeshStandardMaterial({color:mars ? 0xd8c0a0 : 0xe8d8c0, roughness:.9})));
  const ring = new THREE.Mesh(new THREE.RingGeometry(18, 27, 64), new THREE.MeshBasicMaterial({color:0xf0e0c8, side:THREE.DoubleSide, transparent:true, opacity:.75}));
  ring.rotation.x = Math.PI/2.1; pl.add(ring);
  // jagged mountains round the horizon and crystal spires near the base
  for (let i = 0; i < 26; i++) { const a = i/26*Math.PI*2, r = 70 + (i % 3)*6, h = 10 + (i*7 % 9)*2.4; const m = new THREE.Mesh(G.cone, mat(mars ? 0x8a4a2a : 0x7a7a7e, {flatShading:true}), ); m.scale.set(9 + (i % 4)*2, h, 9); m.position.set(Math.cos(a)*r, h/2 - 2, Math.sin(a)*r); S.sc.add(m); }
  for (let i = 0; i < 14; i++) { const a = i*2.4, r = 14 + (i % 5)*3, x = Math.cos(a)*r, z = Math.sin(a)*r; for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(G.cone4, mat(mars ? 0x9a3a4a : 0x6a8ab0, {flatShading:true, metalness:.3, roughness:.3})); c.scale.set(.35, 1.4 + k*.5, .35); c.position.set(x + k*.4, S.H(x, z) + .6, z + (k % 2)*.4); c.rotation.set((k - 1)*.3, 0, (k - 1)*.25); S.sc.add(c); } }
  // fuel tanks and hoses snaking between the modules
  const tk = MODELS.spacekit && MODELS.spacekit.getObjectByName('tanks');
  if (tk) for (const [x, z] of [[11, -7], [-9, 8]]) { const t = tk.clone(true); t.position.set(x, S.H(x, z), z); t.scale.setScalar(.9); S.sc.add(t); }
  for (const [a, b] of [[[-6, -3], [11, -7]], [[4, -6], [11, -7]], [[-9, 8], [-6, -3]]]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i/12, x = a[0] + (b[0] - a[0])*u, z = a[1] + (b[1] - a[1])*u + Math.sin(u*Math.PI*2)*1.2; pts.push(new THREE.Vector3(x, S.H(x, z) + .18, z)); }
    S.sc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, .16, 8), mat(0xe8e8e4, {roughness:.7})));
  }
  // ships overhead: a capital ship cruising high, fighters sweeping past
  const ship = n => MODELS.spacekit && MODELS.spacekit.getObjectByName(n);
  if (ship('destroyer')) { const d = ship('destroyer').clone(true); d.scale.setScalar(2.2); d.position.set(-40, 42, -60); S.sc.add(d); S.capital = d; }
  S.fighters = [];
  if (ship('starfighter')) for (let i = 0; i < 3; i++) { const f = ship('starfighter').clone(true); f.scale.setScalar(.7); S.sc.add(f); S.fighters.push(f); }
}
function moonWalker(S) {
  if (S.walker) return S.walker;
  const c = makeChar({hero:true, body:0xf2f2f0, trim:0xc8302a, pants:0xf2f2f0, shoe:0xd8dce2, noPack:true, hair:'bald', long:true});
  scene.remove(c.g); S.sc.add(c.g);
  const k = MODELS.spacekit;
  if (k) { const h = k.getObjectByName('helmet').clone(true); h.scale.setScalar(.76); h.position.set(0, 1.66, 0); c.g.add(h); const p = k.getObjectByName('pack').clone(true); p.scale.setScalar(.55); p.position.set(0, 1.05, -.32); c.g.add(p); }
  for (const arm of [c.armL, c.armR]) { mesh(G.box, 0xc8302a, [.17, .13, .21], [0, .02, 0], arm); mesh(G.sph, 0xf2f2f0, [.09, .1, .09], [0, -.49, 0], arm); }
  S.walker = {c, x:3, z:5, yaw:0, walk:0};
  return S.walker;
}
const MOON_BLOCK = [[-6, -3, 2.6], [-2, -7, 2], [4, -6, 3], [8, -1, 1.9], [0, 0, 1.8], [-12, -10, 1.8], [11, -7, 1.8], [-9, 8, 1.8]];
function updMoonWalk(dt, S) {
  if (S.belt || SPACE.cut || !W.flags.moon) return false;
  spaceDressing(S);
  const w = moonWalker(S), c = w.c;
  let sx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x, sy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joy.y;
  const sl = Math.hypot(sx, sy); if (sl > 1) { sx /= sl; sy /= sl; }
  const cy = Math.cos(CAM_YAW), sn = Math.sin(CAM_YAW), ix = sx*cy + sy*sn, iz = -sx*sn + sy*cy, sp = Math.hypot(ix, iz);
  if (sp > .1) {
    let nx = w.x + ix*dt*3.4, nz = w.z + iz*dt*3.4;
    for (const [bx, bz, br] of MOON_BLOCK) { const d = Math.hypot(nx - bx, nz - bz); if (d < br) { nx = bx + (nx - bx)/d*br; nz = bz + (nz - bz)/d*br; } }
    const r = Math.hypot(nx, nz); if (r > 40) { nx *= 40/r; nz *= 40/r; }
    w.x = nx; w.z = nz; w.yaw = Math.atan2(ix, iz); w.walk += dt*7;
  }
  // low gravity: long floaty hops
  const hop = sp > .1 ? Math.abs(Math.sin(w.walk*.5))*.45 : 0;
  c.g.position.set(w.x, S.H(w.x, w.z) + hop, w.z); c.g.rotation.y = w.yaw;
  c.legL.rotation.x = sp > .1 ? Math.sin(w.walk)*.5 : 0; c.legR.rotation.x = -c.legL.rotation.x; c.armL.rotation.x = -c.legL.rotation.x*.6; c.armR.rotation.x = c.legL.rotation.x*.6;
  if (sp > .1 && R() < dt*6) particle(0xb8b4ac, new THREE.Vector3(w.x, S.H(w.x, w.z) + .05, w.z), new THREE.Vector3((R() - .5), .6, (R() - .5)), .8, .08);
  // the camera follows you like it does at home
  const D = 13, gy = S.H(w.x, w.z);
  S.cam.position.lerp(new THREE.Vector3(w.x + Math.sin(CAM_YAW)*D, gy + 9, w.z + Math.cos(CAM_YAW)*D), Math.min(1, dt*4)); S.cam.lookAt(w.x, gy + 1, w.z);
  // ships pass overhead
  if (S.capital) { S.capital.position.x = -40 + ((time*1.5) % 120); S.capital.rotation.y = Math.PI/2; }
  (S.fighters || []).forEach((f, i) => { const a = time*.5 + i*2.1; f.position.set(Math.cos(a)*30, 18 + i*3, Math.sin(a)*30 - 10); f.rotation.y = -a + Math.PI; f.rotation.z = .5; });
  // walk back onto the lander's pad to fly home
  if (Math.hypot(w.x - 2.6, w.z - 2.6) < 1.1) { if ((w.home = (w.home || 0) + dt) > .8) { w.home = 0; w.x = 3; w.z = 5; SPACE.view = null; stage.classList.remove('space'); banner('🚀 Back on Earth', 'Your empire missed you.'); } } else w.home = 0;
  if (!S.homePad) { const p = new THREE.Mesh(new THREE.RingGeometry(.7, 1.05, 32), new THREE.MeshBasicMaterial({color:0x5af0ff, transparent:true, opacity:.8, side:THREE.DoubleSide, toneMapped:false})); p.rotation.x = -Math.PI/2; p.position.set(2.6, S.H(2.6, 2.6) + .06, 2.6); S.sc.add(p); S.homePad = p; }
  S.homePad.material.opacity = .5 + Math.sin(time*4)*.3;
  return true;
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({coins:W.coins, earned:W.earned, fed:W.fed, army:W.army, conquests:W.conquests, unrest:W.unrest,
      cash:Object.fromEntries(Object.values(CASH).map(c => [c.id, c.value])), unlocked:[...W.unlocked], paid:W.paid, tut:W.tut, flags:W.flags,
      levels:W.levels, upPaid:W.upPaid, upSpent:W.upSpent, goals:W.goals, caught:W.caught, decor:W.decor || [], fund:W.fund || 0, fundIn:W.fundIn || 0, autoInvest:!!W.autoInvest, rival:W.rival || 0, rivalWins:W.rivalWins || 0, rivalAlly:!!W.rivalAlly, playT:W.playT, rate:W.rate, savedAt:Date.now()}));
  } catch (e) {}
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!s) return false;
    W.coins = s.coins || 0; W.earned = s.earned || 0; W.fed = s.fed || 0; W.paid = s.paid || {}; W.tut = s.tut || 0; W.flags = s.flags || {};
    W.army = s.army || 0; W.conquests = s.conquests || 0; W.unrest = s.unrest || 0;
    W.levels = s.levels || {}; W.upPaid = s.upPaid || {}; W.upSpent = s.upSpent || 0; W.goals = s.goals || []; W.caught = s.caught || 0;
    W.playT = s.playT || 0; W.rate = s.rate || 0; rateBase = W.earned;
    if (s.savedAt && W.rate > 0) {
      awayS = Math.min((Date.now() - s.savedAt) / 1000, 4*3600);
      // a tenth of what the camp earns while you play, and never more than 15 minutes of live play
      if (awayS > 60) offline = Math.floor(Math.min(W.rate * awayS * .1, W.rate * 900));
    }
    for (const p of PADS) if ((s.unlocked || []).includes(p.id)) unlock(p.id, false);
    const piles = typeof s.cash === 'number' ? {main:s.cash} : (s.cash || {});
    for (const [id, v] of Object.entries(piles)) {
      const c = CASH[id]; if (!c) continue;
      c.value = v;
      for (let i = 0; i < Math.min(v, 45); i++) { const m = itemMesh('coin'); m.position.set(c.x, .1, c.z); c.stack.push({type:'coin', mesh:m}); }
    }
    W.fund = s.fund || 0; W.fundIn = s.fundIn || 0; W.autoInvest = !!s.autoInvest;
    if (W.flags.traders) setTimeout(() => addTraders(W.flags.traders), 0);
    W.decor = s.decor || []; W.rival = s.rival || 0;
    // saves from before the map spread out: move placed decorations into the new, wider world
    if (!W.flags.spread) { for (const d of W.decor) [d.x, d.z] = spreadPt(d.x, d.z); W.flags.spread = 2; }
    // saves from the first wide map (60 each way): the quarry and market quarter came 30 closer
    if (W.flags.spread === 1) { for (const d of W.decor) [d.x, d.z] = closerPt(d.x, d.z); W.flags.spread = 2; } W.rivalWins = s.rivalWins || 0; W.rivalAlly = !!s.rivalAlly;
    for (const d of W.decor) circles.push({x:d.x, z:d.z, r:DECOR[d.k].r, decor:decorMesh(d.k, d.x, d.z, d.ry)});
    if (W.rival || W.rivalAlly) rivalCity();
    for (let i = 0; i < W.army; i++) { const sl = yardSlot(i); makeSoldier(sl[0], sl[1]); }
    for (let i = 0; i < W.conquests; i++) outpost(i, false);
    if (W.conquests >= 5) setEra(7, false);
    if (W.conquests >= CAMPAIGNS.length) setEra(10, false);
    for (let i = 5; i < W.conquests; i++) fortress(CAMPAIGNS[i].target, true);
    if (player.speed < 7 && W.flags.roads) player.speed = 7;
    return true;
  } catch (e) { console.error(e); return false; }
}

