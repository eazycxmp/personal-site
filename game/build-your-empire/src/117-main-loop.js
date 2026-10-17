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
    const C = W.camp || W.raid, ph = C ? C.t : -1, land = C && C.type === 'land', sea = C && C.type === 'sea', out = land && ph > 9;
    s.speed = C ? 6 : 3.4;
    if (W.raid && W.raid.siege && siegeSoldier(s, i, dt)) return;
    if (marchSoldier(s, i, dt, C)) return;
    if (land && ph > 9 && ph <= 22 && atBattle(s) && battleSoldier(s, i, dt)) return;
    if (land && ph <= 9 && ph > 7.5 && s.fought && !BT.lose) { cheer(s, dt, i); return; }
    if (s.down || s.fall) { s.down = false; s.fall = 0; s.char.g.rotation.x = 0; s.char.g.scale.setScalar(1); if (s.bar) s.bar.visible = false; }
    let tx = s.slot[0], tz = s.slot[1];
    const vb = !C && BOSS.on && BOSS.on.t > 2 ? (BOSS.on.target ? BOSS.on.target.inZ : [BOSS.on.g.position.x, BOSS.on.g.position.z]) : null;
    s.vsBoss = !!vb;
    if (vb) { const a = i/Math.max(1, soldiers.length)*Math.PI*2; tx = vb[0] + Math.cos(a)*6.5; tz = vb[1] + Math.sin(a)*6.5; }
    if (out) { tx = BF.x - 4.4 + (i % 8)*1.25; tz = BF.z - 2.4 - Math.floor(i / 8)*1.2; }
    if (sea) { tx = -9.2 + (i % 4)*.55; tz = -5.6 + Math.floor(i / 4)*.5; }
    s.char.g.visible = !(sea && C.dur - C.t > 9);
    const at = sea || vb || (!C && s.pos.z < 62) ? goTo(s, tx, tz, dt) : soldierGo(s, tx, tz, dt);
    animEntity(s, dt);
    if (at) {
      const face = vb ? Math.atan2(BOSS.on.g.position.x - s.pos.x, BOSS.on.g.position.z - s.pos.z) : out ? 0 : sea ? -Math.PI/2 : Math.PI;
      let d = face - s.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); s.yaw += d * Math.min(1, dt*6); s.char.g.rotation.y = s.yaw;
      const gun = W.unlocked.has('guns');
      s.char.armR.rotation.x = vb ? -1.5 + Math.sin(time*14 + i)*.15 : out && ph <= 22 ? (gun ? -1.5 : -1.6 + Math.sin(time*12 + i)*1.1) : 0;   // at home: at attention, still
    }
  });
  navGrid();
  updBattle(dt); updSea(dt); updAir(dt);
  updBridge(dt); updMineTrain(dt); updTrain(dt); updStrollers(dt);
  updCitizens(dt); updBuild(dt); updEvents(dt); updSpace(dt); updCastle(dt); updResidents(dt); updMarket(dt); updJet(dt); updConcert(dt);
  updRobber(dt); updCivic(dt); updTraffic(dt); updRugby(dt); updRideIncome(dt); updAch(dt); updHighway(dt); updOil(dt); updAI(dt);
  updEmpires(dt); updScouts(); updSiege(dt); updCrowd(dt); updFleets(dt); updArena(dt); updInvestTile(); updDistricts(dt); updHero(dt); if (started && (OBJ.t -= dt) <= 0) { OBJ.t = 1; OBJ.z = objective().z; } updMount(dt); updWonders(dt); updRanch(dt); updBoss(dt); updTrade(dt); updZoo(dt); updCouncil(dt); updSpaceMining(dt);
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
const camWant = new THREE.Vector3();
// camera views: the usual diagonal, straight down (to see between tall buildings), or pulled right back
const CAMV = {i:0, list:[{n:'Classic view', d:13, h:14.4}, {n:'Top-down view', d:2.4, h:18.9}, {n:'Overview', d:20, h:22.5}]};   // 10% lower than before
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
    Object.assign(sun.shadow.camera, {left:-22*k, right:22*k, top:22*k, bottom:-22*k});   // the wider view needs shadows further out sun.shadow.camera.updateProjectionMatrix();
  }
  const V = CAMV.list[CAMV.i], war = watchingWar();
  const wtype = W.camp ? W.camp.type : 'land';
  const D = (war && wtype === 'land' ? 8.5 : war ? 13 : V.d)*k, H = (war ? 16 : V.h)*k, ox = Math.sin(CAM_YAW)*D, oz = Math.cos(CAM_YAW)*D;
  // standing on the war table during a campaign (or pressing 🎥) shows the battlefield
  if (WATCH.on && Math.hypot(player.vel.x, player.vel.z) > .5) setWatch(false);
  updWatchBtn();
  const watching = war;
  const wf = watching ? warFocus() : null;
  const fx = wf ? wf[0] : (follow || player).pos.x, fz = wf ? wf[1] : (follow || player).pos.z;
  const fy = wf && wf[2] ? wf[2] : TRIP.on ? TRIP.g.position.y*.85 : !wf && heroFlies() ? (player.rideY || 0)*.8 : 0;
  camWant.set(fx + ox + .6, H + fy, fz + oz + .6);
  camera.position.lerp(camWant, Math.min(1, dt*(watching ? 2.5 : 6)));
  camera.lookAt(camera.position.x - ox, camera.position.y - H, camera.position.z - oz);
  if (PHOTO.on) photoCamera(dt, fx, fz);
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
  const o = started ? objective() : {txt:'', z:null};
  const objEl = $('obj'); if (objEl.textContent !== o.txt) objEl.textContent = o.txt;
  if (o.z) {
    const onIt = !o.z.tree && Math.abs(player.pos.x - o.z.x) < (o.z.w || 2)/2 && Math.abs(player.pos.z - o.z.z) < (o.z.d || 2)/2;
    arrow.visible = !onIt; arrow.position.set(o.z.x, 2.2 + Math.sin(time*5)*.25 + (o.z.tree ? 2.4 : 0), o.z.z);
    // point toward the next gate when the goal is in another region
    const way = route(player.pos, o.z.x, o.z.z)[0];
    const dx = way[0] - player.pos.x, dz = way[1] - player.pos.z, d = Math.hypot(dx, dz) || 1;
    pointerG.visible = Math.hypot(o.z.x - player.pos.x, o.z.z - player.pos.z) > 3.2;
    pointerG.position.set(player.pos.x + dx/d*1.4, .08, player.pos.z + dz/d*1.4); pointerG.rotation.y = Math.atan2(dx, dz);
  } else { arrow.visible = false; pointerG.visible = false; }
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
