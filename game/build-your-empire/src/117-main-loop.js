// ------------------------------------------------------------------ main loop
const testIn = {x:0, y:0};
let started = false, paused = false, last = performance.now(), saveT = 5, time = 0;
const v3 = new THREE.Vector3();
function project(pos) {
  v3.copy(pos).project(camera);
  return [(v3.x + 1) / 2 * stage.clientWidth, (1 - v3.y) / 2 * stage.clientHeight, v3.z < 1];
}
const prevPos = new THREE.Vector3();
function update(dt) {
  updLead(dt);
  time += dt; fullT -= dt;
  // input is relative to the screen; turn it into world directions for the diagonal camera
  let sx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x;
  let sy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joy.y;
  const sl = Math.hypot(sx, sy); if (sl > 1) { sx /= sl; sy /= sl; }
  const cy = Math.cos(CAM_YAW), sy2 = Math.sin(CAM_YAW);
  let ix = sx*cy + sy*sy2 + testIn.x, iz = -sx*sy2 + sy*cy + testIn.y;
  const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
  if (BOAT.on) boatIn.set(ix, iz);
  if (!started || PHOTO.on || SPACE.view || TRIP.on || BOAT.on) ix = iz = 0;
  const ps = player.speed * (W.mount ? MOUNTS[W.mount].speed : 1) * (policy('speed') || 1);
  player.vel.set(ix * ps, 0, iz * ps);
  prevPos.copy(player.pos);
  if (TRIP.on) tripStep(dt); else if (BOAT.on) boatStep(dt); else { player.pos.addScaledVector(player.vel, dt); collide(player.pos, prevPos, heroFlies() && (player.rideY || 0) > .8); }
  if (Math.abs(player.pos.x) > WORLD.w/2) { const d = player.pos.x > 0 ? -WORLD.w : WORLD.w; player.pos.x += d; prevPos.x += d; camera.position.x += d; W.flags.lap = (W.flags.lap || 0) - Math.sign(d); }
  player.cap = W.cap;
  // a tile works once you stop on it (or linger), so running straight across one does nothing
  const zn = TRIP.on || BOAT.on ? null : zoneAt(player.pos.x, player.pos.z);
  player.zoneT = zn && zn === player.zone ? player.zoneT + dt : 0; player.zone = zn;
  if (zn) { if (player.zoneT > .6 || Math.hypot(player.vel.x, player.vel.z) < .5) zoneAct(player, zn, dt); }
  else if (!TRIP.on && !BOAT.on && (player.tick -= dt) <= 0) {
    const t = nodes().find(t => t.logs > 0 && Math.hypot(t.x - player.pos.x, t.z - player.pos.z) < (t.item === 'stone' ? 1.7 : 1.55));
    if (!t) player.tick = 0;
    else if (harvest(t, player)) player.tick = t.item === 'stone' ? .4 : .32;
    else { player.tick = .3; full(); }
  }
  for (const s of Object.values(ST)) {
    const speed = aiMult() * (s.group ? BOOST[s.group] * (s.group === 'farm' ? seasonFarm() : 1) : 1) * (UPG[s.id] ? lvlMult(s.id) : 1);
    if (s.broken) { if (R() < dt*6) particle(R() < .5 ? 0xff7a2a : 0x555555, new THREE.Vector3(s.inZ[0] + (R() - .5), .8, s.inZ[1] + (R() - .5)), new THREE.Vector3(0, 2.5, 0), 1, .25, {grow:.4, op:.7}); continue; }
    if (s.in) {
      if (s.ins && !s.busy && s.outStack.length < s.outStack.cap && s.ins.every(gp => s.inStack.count(gp))) {
        for (const gp of s.ins) { const it = s.inStack.take(gp); flyAway(it.mesh, new THREE.Vector3(...s.fireAt), .2); }
        s.busy = true; s.prog = 0; s.yield = 1; s.size = 1;
      }
      if (!s.ins && !s.busy && s.inStack.length && s.outStack.length < s.outStack.cap) {
        const it = s.inStack.take(); flyAway(it.mesh, new THREE.Vector3(...s.fireAt), .2); s.busy = true; s.prog = 0;
        s.yield = it.size > 1.2 ? 2 : 1;   // a big salmon grills into two portions
        s.size = it.size;
      }
      if (s.busy && (s.prog += dt * speed / s.t) >= 1) {
        s.busy = false;
        for (let i = 0; i < s.yield && s.outStack.length < s.outStack.cap; i++) spawnItem(s.out, new THREE.Vector3(...s.fireAt), s.outStack, null, s.size > 1.2 ? 1 : s.size);
      }
    } else if (s.gen && s.outStack.length < s.outStack.cap && (s.prog += dt * speed / s.t) >= 1) {
      s.prog = 0; spawnItem(s.gen, new THREE.Vector3(...s.genAt), s.outStack);
    }
  }
  if (ST.spit) ST.spit.meat.rotation.x += dt * (ST.spit.busy ? 4 : 1);
  for (const w of workers) { const n0 = w.stack.length; equip(w); updWorker(w, dt); workAct(w, n0); if (w.kind === 'butcher') butcherCut(w); animEntity(w, dt); poseCarry(w); poseChop(w, dt); poseRod(w, w.state === 'load' && w.src === fishZone, dt); }
  for (const L of Object.values(LINES)) {
    updLine(L, dt);
    const [fx, fz] = L.slot(0);
    for (const c of L.q) {
      animEntity(c, dt);
      const seated = L.seats ? c.seat != null && Math.hypot(c.pos.x - L.seats[c.seat][0], c.pos.z - L.seats[c.seat][1]) < .3
        : c === L.q[0] && Math.hypot(c.pos.x - fx, c.pos.z - fz) < .3;
      if (seated) c.char.legL.rotation.x = c.char.legR.rotation.x = -1.45;
      if (seated && c.char.real && !c.char.qn) c.char.g.position.y = -.5;
      if (seated && L.seats) {
        c.char.g.rotation.y = c.yaw = Math.PI;
        if (c.mug) c.mug.visible = (c.sip || 0) > 0;
        c.char.armR.rotation.x = (c.sip || 0) > 0 ? -2.3 + Math.sin(time*3)*.15 : -.2;
      }
    }
    for (const c of L.leaving) animEntity(c, dt);
  }
  soldiers.forEach((s, i) => {
    // land: march to the battlefield and fight. sea: walk to the harbor and board the fleet.
    // only cavalry sent: the foot soldiers stay at the barracks
    const C0 = W.camp || W.raid, C = C0 && C0.type === 'land' && !armyGoes(C0) ? null : C0, ph = C ? C.t : -1, land = C && C.type === 'land', sea = C && C.type === 'sea', out = land && ph > 9;
    s.speed = C ? 6*(C.type === 'land' ? weatherSlow() : 1) : 3.4;   // rain and snow slow a land army
    if (W.raid && W.raid.siege && siegeSoldier(s, i, dt)) return;
    if (C && C.assault && assaultSoldier(s, i, dt)) return;
    if (marchSoldier(s, i, dt, C)) return;
    if (!C && paradeSoldier(s, i, dt)) return;
    if (land && ph > 9 && ph <= 22 && atBattle(s) && battleSoldier(s, i, dt)) return;
    if (land && ph <= 9 && ph > 7.5 && s.fought && !BT.lose) { cheer(s, dt, i); return; }
    if (s.down || s.fall) { s.down = false; s.fall = 0; s.char.g.rotation.x = 0; s.char.g.scale.setScalar(1); if (s.bar) s.bar.visible = false; }
    let tx = s.slot[0], tz = s.slot[1];
    const vb = !C && BOSS.on && BOSS.on.t > 2 ? (BOSS.on.target ? BOSS.on.target.inZ : [BOSS.on.g.position.x, BOSS.on.g.position.z]) : null;
    s.vsBoss = !!vb;
    if (vb) { const a = i/Math.max(1, soldiers.length)*Math.PI*2; tx = vb[0] + Math.cos(a)*6.5; tz = vb[1] + Math.sin(a)*6.5; }
    if (out) { tx = BF.x - 4.4 + (i % 8)*1.25; tz = BF.z - 2.4 - Math.floor(i / 8)*1.2; }
    if (sea) { tx = -9.2 + (i % 4)*.55; tz = -5.6 + Math.floor(i / 4)*.5; }
    const drill = !C && !vb ? soldierDrill(s, i) : null; if (drill) { tx = drill.x; tz = drill.z; s.speed = drill.run ? 4.6 : 3.4; }
    s.char.g.visible = !(sea && C.dur - C.t > 9);
    const at = sea || vb || (!C && s.pos.z < 62) ? goTo(s, tx, tz, dt) : soldierGo(s, tx, tz, dt);
    animEntity(s, dt);
    if (drill && drillPose(s, i, drill, at, dt)) return;
    if (at) {
      const face = vb ? Math.atan2(BOSS.on.g.position.x - s.pos.x, BOSS.on.g.position.z - s.pos.z) : out ? 0 : sea ? -Math.PI/2 : Math.PI;
      let d = face - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d * Math.min(1, dt*6); s.char.g.rotation.y = s.yaw;
      const gun = wepLvl() >= 1;
      s.char.armR.rotation.x = vb ? -1.5 + Math.sin(time*14 + i)*.15 : out && ph <= 22 ? (gun ? -1.5 : -1.6 + Math.sin(time*12 + i)*1.1) : 0;   // at home: at attention, still
    }
  });
  navGrid();
  updBattle(dt); updSea(dt); updAir(dt);
  updBridge(dt); updMineTrain(dt); updTrain(dt); updStrollers(dt);
  updCitizens(dt); updBuild(dt); updEvents(dt); updSpace(dt); updCastle(dt); updResidents(dt); updMarket(dt); updJet(dt); updConcert(dt);
  updRobber(dt); updCivic(dt); updTraffic(dt); updRugby(dt); updRideIncome(dt); updAch(dt); updHighway(dt); updOil(dt); updAI(dt);
  updEmpires(dt); updScouts(); updSiege(dt); updCrowd(dt); updFleets(dt); updArena(dt); updInvestTile(); updDistricts(dt); updHero(dt); if (started && (OBJ.t -= dt) <= 0) { OBJ.t = 1; OBJ.z = objective().z; } updMount(dt); updCavalry(dt); updCharge(dt); updEpic(dt); updFlags(dt); updRivalWars(dt); updDefences(dt); updAssault(dt); updParade(dt); updGenerals(dt); updSpies(dt); updEnvoys(dt); updMuseum(dt); updMusic(dt); updNightWar(dt); updFronts(dt); updWonders(dt); updRanch(dt); updBoss(dt); updTrade(dt); updZoo(dt); updCouncil(dt); updSpaceMining(dt);
  if (wheel) wheel.rotation.x -= dt * .9;
  for (const a of clarifiers) a.rotation.y += dt * .25;
  if (fountainAt && R() < dt*14) particle(0xcfefff, fountainAt.clone(), new THREE.Vector3((R() - .5)*1.2, 1.6 + R(), (R() - .5)*1.2), .7, .05, {grav:1});
  updWar(dt); updTribes(dt); updSupply(dt); if (started) scoutNextCamp();
  if ((W.unrestT = (W.unrestT || 0) + dt) > (W.unlocked.has('police') ? 45 : 90)) { W.unrestT = 0; W.unrest = Math.max(0, W.unrest - 1); }
  if (ST.mill) ST.mill.rotation.z += dt * 1.2;
  if (ST.diggerArm) ST.diggerArm.rotation.z = -.3 + Math.sin(time * 1.8) * .35;
  if (W.unlocked.has('barracks') && W.army > 0 && (tributeT -= dt) <= 0) {
    const trib = Math.round(W.army * 2 * (1 + .5*((W.castle || 1) - 1)));
    tributeT = 12; addCash(CASH.tribute, trib, {x:9.5, z:73.6});
    if (CASH.spoils) { const tb = landTribute(); if (tb) addCash(CASH.spoils, tb, {x:12.3, z:72.8}); }   // conquered lands pay tribute too
    popText(`+${trib} tribute`, new THREE.Vector3(9.5, 3.5, 73.6), '#ffe06b');
  }
  updBoats(dt);
  leapingFish(dt);
  animEntity(player, dt); poseChop(player, dt);
  poseRod(player, started && player.zone === fishZone, dt);
  updHomes(dt);
  for (const t of nodes()) {
    if (t.shake > 0) { t.shake -= dt; t.g.rotation.z = Math.sin(t.shake * 50) * .06; } else t.g.rotation.z = 0;
    if (!t.dead && t.logs <= 0 && (t.regrow -= dt) <= 0) { t.logs = t.item === 'stone' ? 5 : 4; setNode(t, true); popIn(t.top); }
  }
  for (const s of stacks) s.update(dt);
  for (const f of [...flyers]) {
    f.t += dt / f.dur; const to = target(f.to), e = Math.min(1, f.t);
    f.m.position.set(f.from.x + (to.x - f.from.x)*e, f.from.y + (to.y - f.from.y)*e + Math.sin(e*Math.PI)*(f.arc ?? (f.leap ? 1.3 : .9)), f.from.z + (to.z - f.from.z)*e);
    if (f.tick) f.tick(f, dt);
    if (f.leap) f.m.rotation.set(0, 0, 0), f.m.rotation.y = Math.PI/2 * Math.sign(to.z - f.from.z), f.m.rotation.z = (e - .5) * -2.2;
    if (f.t >= 1) { scene.remove(f.m); flyers.splice(flyers.indexOf(f), 1); f.done?.(); }
  }
  for (const p of [...popIns]) {
    p.t += dt * 2.2; const t = Math.min(1, p.t), u = t - 1;
    if (p.rise) p.obj.position.y = -2 * u * u;
    else p.obj.scale.setScalar(Math.max(.01, (p.obj.userData.lvScale || 1) * (1 + 2.70158*u*u*u + 1.70158*u*u)));
    if (p.t >= 1) { if (p.rise) p.obj.position.y = 0; else p.obj.scale.setScalar(p.obj.userData.lvScale || 1); popIns.splice(popIns.indexOf(p), 1); }
  }
  for (const f of fires) f.m.scale.y = f.base * (.8 + Math.sin(time * 13 + f.ph) * .2);
  for (const r of ripples) { r.position.z += dt * 2.2; if (r.position.z > 100) r.position.z = -70; }
  for (const f of [ST.flag, ST.flag2, ST.flag3]) if (f) f.rotation.y = Math.sin(time * 3) * .25;
  smoke(dt); updParts(dt); updFaders(dt);
  for (const p of [...pops]) if ((p.t += dt) > 1.2) { p.el.remove(); pops.splice(pops.indexOf(p), 1); }
  if (pops.length > 40) pops.splice(0, pops.length - 40).forEach(p => p.el.remove());
  if (started) { W.playT += dt; trackRate(dt); updGoals(dt); }
  if ((saveT -= dt) <= 0) { saveT = 5; if (started) save(); }
}
// Soldiers at home train rather than stand about. The drill-yard squad takes turns, all together: laps of the yard at a jog,
// sparring in pairs, then marching in formation up and down. Tower guards walk their beat, the others fetch and carry.
const YARD = {x0:-5.7, x1:-.1, z0:52.2, z1:59.4};
function soldierDrill(s, i) {
  const slot = BASE_SLOTS.indexOf(s.slot), k = slot >= 0 ? slot : i;
  if (k < 12) {
    const ph = Math.floor(time/40) % 3;
    if (ph === 0) {   // laps: round the yard in a file
      const Wd = YARD.x1 - YARD.x0, Dp = YARD.z1 - YARD.z0, per = 2*(Wd + Dp), d = ((time*3.3 + k*per/12) % per + per) % per;
      const p = d < Wd ? [YARD.x0 + d, YARD.z0] : d < Wd + Dp ? [YARD.x1, YARD.z0 + d - Wd] : d < 2*Wd + Dp ? [YARD.x1 - (d - Wd - Dp), YARD.z1] : [YARD.x0, YARD.z1 - (d - 2*Wd - Dp)];
      return {x:p[0], z:p[1], run:true, mode:'lap'};
    }
    if (ph === 1) return {x:s.slot[0] + (k % 2 ? .35 : -.35), z:s.slot[1], mode:'spar', partner:k ^ 1};
    return {x:s.slot[0], z:s.slot[1] + Math.sin(time*.7)*1.3, mode:'march'};
  }
  if (k >= 18 && k < 22) return {x:s.slot[0], z:s.slot[1] + (Math.floor(time/7 + k) % 2 ? 2.6 : -2.6)*(s.slot[1] > 50 ? -1 : 1), mode:'patrol'};
  // tents and the depot: fetching and carrying between them
  const a = Math.floor(time/6 + k*.7) % 2;
  return {x:a ? 7.6 : s.slot[0], z:a ? 48.2 : s.slot[1], mode:'chore'};
}
function drillPose(s, i, D, at, dt) {
  if (D.mode === 'lap') return true;   // keep jogging; the walk/jog animation does the rest
  if (D.mode === 'march') { s.char.armR.rotation.x = s.char.armL.rotation.x = 0; return true; }
  if (D.mode === 'spar' && at) {
    const pt = BASE_SLOTS[D.partner], face = pt ? Math.atan2(pt[0] - s.pos.x, pt[1] - s.pos.z) : 0;
    let d = face - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d*Math.min(1, dt*6); s.char.g.rotation.y = s.yaw;
    if ((s.drillT = (s.drillT || 0) - dt) <= 0) { s.drillT = .8 + R()*.6; qnAct(s.char, R() < .5 ? 'swing' : 'punch', .7, true); }
    return true;
  }
  if (D.mode === 'chore' && at && (s.drillT = (s.drillT || 0) - dt) <= 0) { s.drillT = 1.5; qnAct(s.char, 'pick', 1); }
  return D.mode === 'chore' || D.mode === 'patrol';
}
// The guide holds its target steady: once it points at a tile it stays on that tile until the job there is done or the tile
// goes, or something urgent comes up (the tutorial, a fire, a battle). A different target only takes over after it has
// stayed the best choice for two seconds, so the arrow never flicks between tiles as coins and loads change.
function steadyObjective(o, dt) {
  const S = OBJ.steady ||= {cur:null, cand:null, t:0};
  const valid = q => { const z = q && q.z; if (!z) return false; if (z.tree || z.logs !== undefined) return (z.logs ?? 1) > 0; return zones.includes(z) && z.active !== false && !z.locked && !(z.pad && W.unlocked.has(z.pad.id)); };
  const urgent = W.tut < TUT.length || /^(🔥|🏗️|⚔️|✈️|⚓)/.test(o.txt || '');
  if (!o.z || urgent || !S.cur || !valid(S.cur) || S.cur.z === o.z) { S.cur = o; S.cand = null; return o; }
  if (S.cand !== o.z) { S.cand = o.z; S.t = 0; }
  if ((S.t += dt) >= 2) { S.cur = o; S.cand = null; return o; }
  return S.cur;
}
// when the goal is off the screen, an arrow on the screen's edge points to it, with how far it is
function objEdge(z, d) {
  let el = objEdge.el;
  if (!el) { el = objEdge.el = document.createElement('div'); el.style.cssText = 'position:absolute;z-index:4;pointer-events:none;display:none;align-items:center;gap:4px;font:800 12px ui-rounded,system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000a'; el.innerHTML = '<span style="display:inline-block;font-size:26px;color:#ffd33c;text-shadow:0 1px 3px #000c">➤</span><span></span>'; stage.appendChild(el); }
  if (!z || TRIP.on || SPACE.view) { el.style.display = 'none'; return; }
  const W0 = stage.clientWidth, H0 = stage.clientHeight; v3.set(z.x, 1, z.z).project(camera);
  let sx = (v3.x + 1)/2*W0, sy = (1 - v3.y)/2*H0;
  const m = 46, on = v3.z < 1 && sx > m && sx < W0 - m && sy > m + 30 && sy < H0 - m - 50;
  if (on) { el.style.display = 'none'; return; }
  if (v3.z >= 1) { sx = W0 - sx; sy = H0 - sy; }   // behind the camera: flip
  const cx = W0/2, cy = H0/2, ax = sx - cx, ay = sy - cy, k = Math.min((W0/2 - m)/Math.max(1e-3, Math.abs(ax)), (H0/2 - m - 40)/Math.max(1e-3, Math.abs(ay)));
  el.style.display = 'flex'; el.style.left = (cx + ax*k - 14) + 'px'; el.style.top = (cy + ay*k - 14) + 'px';
  el.firstChild.style.transform = `rotate(${Math.atan2(ay, ax)}rad)`; el.lastChild.textContent = Math.round(d) + 'm';
}
const camWant = new THREE.Vector3();
// camera views: the usual diagonal, straight down (to see between tall buildings), or pulled right back
const CAMV = {i:0, list:[{n:'Classic view', d:13, h:13}, {n:'Top-down view', d:2.4, h:17}, {n:'Overview', d:20, h:20.3}]};   // lower again (was 16, 21, 25)
try { CAMV.i = +(localStorage.getItem('bye.cam') || 0) % CAMV.list.length; } catch (e) {}
function nextCam() {
  CAMV.i = (CAMV.i + 1) % CAMV.list.length; try { localStorage.setItem('bye.cam', CAMV.i); } catch (e) {}
  note(`🎥 ${CAMV.list[CAMV.i].n}`, 'Tap 🎥 or press C to switch.');
}
function render(dt) {
  // camera follows the player; pull back further on tall (portrait) screens
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight), k = aspect < 1 ? 1.45 : MOBILE ? 1 : clamp(stage.clientHeight / 740, 1, 1.5);
  if (k !== render.k) {   // fog and the sun's shadow reach out as far as the view does
    render.k = k; scene.fog.near = 42*k; scene.fog.far = 82*k;
    Object.assign(sun.shadow.camera, {left:-25*k, right:25*k, top:25*k, bottom:-25*k});   // the wider view needs shadows further out sun.shadow.camera.updateProjectionMatrix();
  }
  const V = CAMV.list[CAMV.i], war = watchingWar();
  const wtype = W.camp ? W.camp.type : 'land';
  // watching a battle: the camera drifts round the field, and dips in close for the big moments
  const cine = war && !PHOTO.on ? cineCam(dt) : null, yawC = CAM_YAW + (cine ? cine.yaw : 0);
  const D = (war && wtype === 'land' ? 11.5 : war ? 13 : V.d)*k*(cine ? cine.d : 1), H = (war ? (wtype === 'land' ? 19 : 16) : V.h)*k*(cine ? cine.h : 1), ox = Math.sin(yawC)*D, oz = Math.cos(yawC)*D;
  // standing on the war table during a campaign (or pressing 🎥) shows the battlefield
  if (WATCH.on && !LEAD.on && Math.hypot(player.vel.x, player.vel.z) > .5) setWatch(false);
  updWatchBtn();
  const watching = war;
  const wf = watching ? warFocus() : null;
  const fx = wf ? wf[0] : (follow || player).pos.x, fz = wf ? wf[1] : (follow || player).pos.z;
  const fy = wf && wf[2] ? wf[2] : TRIP.on ? TRIP.g.position.y*.85 : !wf && heroFlies() ? (player.rideY || 0)*.8 : 0;
  camWant.set(fx + ox + .6, H + fy, fz + oz + .6);
  camera.position.lerp(camWant, Math.min(1, dt*(watching ? 2.5 : 6)));
  camera.lookAt(camera.position.x - ox, camera.position.y - H, camera.position.z - oz);
  if (PHOTO.on) photoCamera(dt, fx, fz);
  fadePeaks(dt, fx, fy, fz);
  if (camShake > .01) { camera.position.x += (R() - .5)*camShake; camera.position.y += (R() - .5)*camShake*.6; camShake *= Math.pow(.02, dt); }
  // day and night: a four-minute cycle that never gets too dark to play
  const dk = .5 + .5*Math.cos(time / 240 * Math.PI * 2);
  updFx(dt, dk); updSeasons(dt); FX.day.value = dk;
  if (follow && (Math.hypot(player.vel.x, player.vel.z) > .5 || !strollers.includes(follow))) follow = null;
  for (const s of strollers) if (s.el) {
    const [x, y, vis] = project(new THREE.Vector3(s.pos.x, 2.25 + elevAt(s.pos.x, s.pos.z), s.pos.z));
    s.el.style.display = vis && Math.hypot(s.pos.x - player.pos.x, s.pos.z - player.pos.z) < 22 ? '' : 'none'; s.el.style.left = x + 'px'; s.el.style.top = y + 'px';
  }
  updAddons(dt, clamp((.5 - dk) * 2.4, 0, 1)); updShips(dt);
  const golden = lightAt(fx, fz, dk); updAO();
  sun.intensity = 3.4 * (.35 + .65*dk); hemi.intensity = 1.25 * (.55 + .45*dk);
  if (W.weather && W.weather !== 'clear') { sun.intensity *= .65; hemi.intensity *= .85; }   // overcast
  scene.background.setRGB(.12 + .5*dk + golden*.25, .17 + .67*dk + golden*.05, .3 + .65*dk - golden*.12, THREE.SRGBColorSpace); scene.fog.color.copy(scene.background);
  for (const l of fireLights) l.intensity = 3 + (1 - dk)*7;
  placeFireLights(fx, fz);
  updGfx3(dt, dk);
  for (const m of lampMats) m.color.setRGB(.5 + (1 - dk)*.5, .48 + (1 - dk)*.47, .4 + (1 - dk)*.35);
  if (player.char.crown) player.char.crown.visible = !!player.char.wantCrown;
  renderGoals();

  for (const L of Object.values(LINES)) for (const c of L.q.concat(L.leaving)) {
    const [x, y, vis] = project(new THREE.Vector3(c.pos.x, 2.35 + elevAt(c.pos.x, c.pos.z), c.pos.z));
    const far = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z) > 26;
    c.el.style.display = vis && !far ? '' : 'none';
    c.el.style.left = x + 'px'; c.el.style.top = y + 'px';
    if (L.q.includes(c)) {
      const mad = L.id !== 'mess' && !L.custom && c.waitT > PATIENCE * BOOST.patience * (1 + .1*(W.water || 0) + (W.unlocked.has('hospital') ? .15 : 0)) * .55;
      const html = (mad ? '😠 ' : '') + c.wants.filter(w => w.need > 0).map(w => `<span>${ITEM[w.type].icon}</span>${w.need}`).join(' ');
      c.el.classList.toggle('mad', mad);
      if (c.el._h !== html) { c.el._h = html; c.el.innerHTML = html; }
      c.el.classList.toggle('front', L.q[0] === c);
    }
  }
  for (const p of pops) {
    const [x, y] = project(p.pos);
    p.el.style.left = x + 'px'; p.el.style.top = (y - p.t*60) + 'px'; p.el.style.opacity = String(1 - p.t/1.2);
  }
  const o = started ? steadyObjective(objective(), dt) : {txt:'', z:null};
  const objEl = $('obj'); if (objEl.textContent !== o.txt) objEl.textContent = o.txt;
  if (o.z) {
    const onIt = !o.z.tree && Math.abs(player.pos.x - o.z.x) < (o.z.w || 2)/2 && Math.abs(player.pos.z - o.z.z) < (o.z.d || 2)/2;
    arrow.visible = !onIt; arrow.position.set(o.z.x, 2.2 + Math.sin(time*5)*.25 + (o.z.tree ? 2.4 : 0), o.z.z);
    // the pointer at your feet aims straight at the goal, wherever on the map it is
    const dx = o.z.x - player.pos.x, dz = o.z.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
    pointerG.visible = d > 3.2;
    pointerG.position.set(player.pos.x + dx/d*1.4, .08, player.pos.z + dz/d*1.4); pointerG.rotation.y = Math.atan2(dx, dz);
    objEdge(o.z, d);
  } else { arrow.visible = false; pointerG.visible = false; objEdge(null); }
  const SZ = SEASONS[seasonIdx()];
  const nextAge = AGE_NEED[W.era + 1], rentMin = Math.round((RENT.last || 0)*3);
  const hl = `<span class="chip" title="${nextAge ? 'Next: ' + ERAS[W.era + 1] + ' · ' + nextAge[1] : 'The last age'}">${ERA_ICON[W.era]} ${ERAS[W.era]}${nextAge ? ` <small>→ ${nextAge[1]}</small>` : ''}</span>`
    + (rentMin ? `<span class="chip">🏠 ${rentMin.toLocaleString()} <small>rent/min</small></span>` : '') + `<span class="chip">${SZ.icon} ${SZ.n}${W.weather === 'rain' ? ' 🌧️' : W.weather === 'snow' ? ' 🌨️' : ''}</span>`
    + (population() ? `<span class="chip">🧑 ${population()}</span>` : '') + (strollers.length ? `<span class="chip">${(W.happy ?? 70) > 70 ? '😄' : (W.happy ?? 70) > 45 ? '🙂' : '😟'} ${W.happy ?? 70}%</span>` : '') + (W.festival > 0 ? '<span class="chip">🎉 Festival</span>' : '') + `<span class="chip">😋 ${W.fed} <small>fed</small></span>`
    + (W.unlocked.has('southGate') ? `<span class="chip">🛡️ ${W.army}</span>` : '')
    + (warZone ? `<span class="chip">⚔️ ${W.conquests}/${CAMPAIGNS.length}</span>` : '')
    + (W.unrest ? `<span class="chip angry">😠 ${W.unrest}/3</span>` : '') + empireChips();
  const hr = `<span class="chip money">💵 ${W.coins}</span><span class="chip">🪵 ${player.stack.count(['log'])}</span>`
    + (W.unlocked.has('northGate') ? `<span class="chip">🪨 ${player.stack.count(['stone'])}</span>` : '')
    + (W.unlocked.has('workshop') ? `<span class="chip">🔨 ${player.stack.count(['tools'])}</span>` : '')
    + (W.unlocked.has('library') ? `<span class="chip">📜 ${player.stack.count(['scroll'])}</span>` : '')
    + `<span class="chip">🎒 ${player.stack.length}/${W.cap}</span>`;
  if ($('hudL')._h !== hl) { $('hudL')._h = hl; $('hudL').innerHTML = hl; }
  if ($('hudR')._h !== hr) { $('hudR')._h = hr; $('hudR').innerHTML = hr; }
  if (SPACE.view) { updSpaceView(dt); const S = spaceScene(SPACE.view); S.cam.aspect = camera.aspect; S.cam.updateProjectionMatrix(); renderFinal(0, S.sc, S.cam); }
  else renderFinal(clamp((.5 - dk) * 2.4, 0, 1));
}
