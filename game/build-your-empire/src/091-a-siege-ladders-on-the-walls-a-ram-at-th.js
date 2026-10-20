// ------------------------------------------------------------------ a siege: ladders on the walls, a ram at the gate, warships off the river bank
const SIEGE = {foes:[], ships:[], ladders:[], archers:[], win:true, r:null, breach:0, gateHp:0, arrowT:0, gunT:0, shipT:0};
function castleBox() { return boxes.find(b => b.castle && W.castle); }
const INV = {on:false, units:[], r:null, t:0};
function startInvasion(r, o = {}) {
  // every army comes down its own road to the junction, then up the one road in to your gate (091c)
  const pts = waveRoute(r), look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, Math.max(r.look, W.troop || 0))], n = o.n || 12;
  Object.assign(INV, {on:true, r, pts, t:0, units:[], total:n, atk:o.atk ?? null, wave:o.wave || null});
  for (let i = 0; i < n; i++) { const e = entity(look, pts[0][0] + ((i % 4) - 1.5)*.8, pts[0][1] + Math.floor(i / 4)*.8, 7, 0); e.pi = 0; e.hp = 3 + .3*(o.wave || 0) + .2*W.era; INV.units.push(e); }
  if (!o.wave) banner(`⚔️ ${r.icon} ${r.n} marches on you!`, `Their army is on its road to the junction, then the road in to your gate. Tap 🎥 to watch them come. Ready the walls!`);
  snd(110, .5, 'sawtooth', .05, .6);
}
function updInvasion(dt) {
  if (!INV.on) return;
  if (!INV.units.length) {
    INV.on = false; const s = es(INV.r); s.pow = Math.max(10, s.pow*.85); W.flags.invasionsBroken = (W.flags.invasionsBroken || 0) + 1;
    banner(`🏆 ${INV.r.icon} ${INV.r.n}'s army is destroyed on the road!`, 'Not one reached your walls.');
    waveBegun(); if (INV.wave) waveOver(true);
    return;
  }
  INV.t += dt; let arrived = 0;
  for (const [i, e] of [...INV.units.entries()]) {
    const ox = ((i % 4) - 1.5)*.8, oz = Math.floor(i / 4)*.8, sp = 7*barricadeAt(e);
    if (!sp) continue;   // a mine took them
    if (e.pi < INV.pts.length) { const [x, z] = INV.pts[e.pi]; if (march(e, x + ox, z + oz, dt, sp)) e.pi++; } else arrived++;
    animEntity(e, dt); e.char.g.rotation.y = e.yaw;
  }
  if (INV.units.length) reveal(INV.units[0].pos.x, INV.units[0].pos.z, 10);
  if (INV.units.length && (arrived >= INV.units.length*.7 || INV.t > 90)) {
    const left = INV.units.length/INV.total;
    for (const e of INV.units) { scene.remove(e.char.g); stacks.delete(e.stack); if (e.bar) scene.remove(e.bar); const k = ENTS.indexOf(e); if (k >= 0) ENTS.splice(k, 1); }
    // only those who made it attack: their strength shrinks with every one lost on the road
    SIEGE.scale = left; SIEGE.atkOverride = (INV.atk ?? es(INV.r).pow)*left; SIEGE.wave = INV.wave; SIEGE.spawnAt = ROAD_IN[ROAD_IN.length - 1];
    INV.units.length = 0; INV.on = false; startSiege(INV.r);
    SIEGE.scale = null; SIEGE.atkOverride = null; SIEGE.spawnAt = null;
  }
}
function startSiege(r) {
  const s = es(r), atk = SIEGE.atkOverride ?? s.pow, def = defPower(), win = def >= atk, cb = castleBox();
  waveBegun();
  W.raid = {t:50, dur:50, type:'siege', siege:true, rival:EMP.list.indexOf(r)};
  Object.assign(SIEGE, {r, win, atk, def, breach:0, gateHp:10 + (W.castle || 0)*8 + lvOf('gate')*6, arrowT:0, gunT:0, shipT:0});
  BT.id = (BT.id || 0) + 1; BT.noCap = !win;
  W.flags.sieges = (W.flags.sieges || 0) + 1;
  const look = ENEMY_LOOKS[Math.min(ENEMY_LOOKS.length - 1, Math.max(r.look, W.troop || 0))];
  const n = Math.max(2, Math.round(Math.min(16 + Math.min(14, Math.floor((SIEGE.wave || 0)/2)), 6 + Math.round(atk/12))*(SIEGE.scale ?? 1))), H = [0, 2, 2.6, 2.8, 2.2][W.castle || 0];
  let li = 0, gi = 0;
  for (let i = 0; i < n; i++) {
    const sa = SIEGE.spawnAt, x0 = sa ? sa[0] - 3.5 + (i % 8) : r.land ? -6 + (i % 8)*2 : -9.6 + (i % 3)*.6, z0 = sa ? sa[1] + Math.floor(i / 8)*1.2 : r.land ? 107 + Math.floor(i / 8)*1.4 : 94 + Math.floor(i / 3)*1.1;
    const f = entity(look, x0, z0, 2.6, 0);
    Object.assign(f, {yaw:Math.PI, alive:true, fall:0, hp:(win ? 4 : 9) + W.era*.5, gun:!!look.gun, cd:R(), role:'fight'});
    f.maxHp = f.hp;
    if (cb && i % 5 < 2 && li < 5) {
      f.role = 'ladder'; f.wx = cb.x0 + .9 + li*((cb.x1 - cb.x0 - 1.8)/4); f.wz = cb.z1 + .35; f.topZ = cb.z1 - .75; f.H = H; li++;
      const L = new THREE.Group(); scene.add(L); f.ladder = L; SIEGE.ladders.push(L);
      const len = Math.hypot(H + .3, 1.1);
      for (const x of [-.22, .22]) mesh(G.box, 0x8a5a2b, [.06, len, .06], [x, len/2, 0], L);
      for (let y = .3; y < len; y += .35) mesh(G.box, 0x6b4526, [.44, .04, .04], [0, y, 0], L);
    } else if (cb && i % 5 === 2 && gi < 3) { f.role = 'gate'; f.wx = cb.x1 + .7 + (gi % 2)*.5; f.wz = 87.4 + gi*.45; gi++; }
    SIEGE.foes.push(f);
  }
  if (r.sea) for (const [x, z] of [[-14.4, 74], [-12.8, 78]]) { const p = makePirate(x, r.id === 'azul' ? -108 : 138); Object.assign(p, {tz:z, hp:win ? 4 : 9, sink:0}); SIEGE.ships.push(p); }
  // archers man the stone walls
  if (cb && W.castle >= 2) for (let k = 0; k < Math.min(6, W.castle*2); k++) {
    const c = makeChar(ARMS()); c.g.position.set(cb.x0 + 1 + k*((cb.x1 - cb.x0 - 2)/5), H - .1, cb.z1 - (W.castle === 3 ? 1.3 : .8)); scene.add(c.g); c.armR.rotation.x = -1.5; SIEGE.archers.push(c);
  }
  siegeKit(cb);
  banner(`🏰 ${r.icon} ${r.n} besieges your ${cb ? 'castle' : 'town'}!`, `Their ⚔️${Math.round(atk)} vs your 🛡️${Math.round(def)}. ${cb ? 'Ladders, a ram at the gate' : 'They storm the military grounds'}${r.sea ? ' and warships on the river' : ''}!`);
  snd(110, .5, 'sawtooth', .05, .6); setTimeout(() => snd(98, .5, 'sawtooth', .05, .6), 400);
}
function shootArrow(from, to, hit, onHit) {
  const a = new THREE.Mesh(G.box, mat(0x3a2a1a)); a.scale.set(.03, .03, .5); a.position.copy(from); a.lookAt(to); scene.add(a);
  flyers.push({m:a, from:from.clone(), to:hit ? to.clone() : to.clone().add(new THREE.Vector3((R() - .5)*2, -1, (R() - .5)*2)), t:0, dur:.35, arc:.4, done:() => { if (hit) onHit(); }});
}
function updSiege(dt) {
  if (!W.raid || !W.raid.siege) return;
  const C = W.raid, e = C.dur - C.t, win = SIEGE.win, live = SIEGE.foes.filter(f => f.alive && !f.inside), cb = castleBox();
  if ((C.t -= dt) <= 0) { endSiege(); return; }
  const guard = soldiers.filter(s => !s.down && s.hp > 0);
  for (const f of SIEGE.foes) {
    f.vel.set(0, 0, 0);
    if (f.alive && !f.inside) {
      if (f.role === 'ladder') {
        if (f.climb == null) {
          if (moveTo(f, f.wx, f.wz, dt)) { f.climb = 0; f.yaw = Math.PI; f.ladder.position.set(f.wx, 0, f.wz); f.ladder.rotation.x = -Math.atan2(1.1, f.H + .3); }
          else { f.ladder.position.set(f.pos.x, 1.7, f.pos.z); f.ladder.rotation.set(Math.PI/2, f.yaw, 0); }
        } else if (e > 12) {
          f.climb = Math.min(1, f.climb + dt/(win ? 9 : 6));
          f.pos.z = f.wz + (f.topZ - f.wz)*f.climb;
          if (f.climb >= 1) { f.inside = true; f.char.g.visible = false; SIEGE.breach++; popText('Over the wall!', new THREE.Vector3(f.pos.x, f.H + 1.5, f.pos.z), '#ff8a75'); }
        }
      } else if (f.role === 'gate' && SIEGE.gateHp > 0) {
        if (moveTo(f, f.wx, f.wz, dt)) {
          f.yaw = -Math.PI/2;
          if (e > 12 && (f.cd -= dt) <= 0) { f.cd = 1.1; f.swing = .3; qnAct(f.char, 'swing', .75, true); SIEGE.gateHp -= win ? .5 : 1; snd(80, .12, 'square', .04); particle(0x8a5a2b, new THREE.Vector3(f.wx - .6, 1, f.wz), new THREE.Vector3(0, 2, 0), .5, .1, {grav:1});
            if (SIEGE.gateHp <= 0) { SIEGE.breach += 3; banner('🚪 The gate is broken!', 'They are inside the walls!'); SIEGE.foes.forEach(o => { if (o.role === 'gate') o.role = 'fight'; }); } }
        }
      } else if (e > 8) {
        if (!f.target || f.target.down || f.target.hp <= 0) f.target = nearest(f, guard);
        const t = f.target;
        if (t) {
          const d = Math.hypot(t.pos.x - f.pos.x, t.pos.z - f.pos.z), reach = f.gun ? 6 : .95;
          if (d > reach) { moveTo(f, t.pos.x, t.pos.z, dt); collideFighters(f, SIEGE.foes); }
          f.yaw = Math.atan2(t.pos.x - f.pos.x, t.pos.z - f.pos.z);
          if ((f.cd -= dt) <= 0 && d <= reach + .1) { f.cd = f.gun ? 1.3 + R()*.8 : .9 + R()*.5; strike(f, t, f.gun && d > 1.2, (f.gun && d > 1.2 ? 1 : 1.2) * (win ? .7 : 1.7)); }
        } else moveTo(f, cb ? cb.x1 + 1 : 3, cb ? 91.5 : 76, dt);
      }
    }
    animEntity(f, dt); f.char.g.rotation.y = f.yaw;
    if (f.climb != null && f.alive) { f.char.g.position.y += f.climb*f.H; f.char.armL.rotation.x = f.char.armR.rotation.x = -2.6 + Math.sin(time*8)*.3; }
    else if (f.alive && f.swing > 0) { f.swing -= dt; f.char.armR.rotation.x = -2.4 + (1 - f.swing/.3)*2.2; }
    if (!f.alive && f.climb > 0) f.climb = 0;
    poseFall(f, dt); healthBar(f);
  }
  // archers on the walls pick off climbers and anyone near the walls
  if (SIEGE.archers.length && e > 10 && (SIEGE.arrowT -= dt) <= 0) {
    SIEGE.arrowT = 1.6 / SIEGE.archers.length;
    const tg = live.filter(f => f.role === 'ladder' || f.role === 'gate').sort((a, b) => (b.climb || 0) - (a.climb || 0))[0] || live[0];
    if (tg) {
      const a = SIEGE.archers[R()*SIEGE.archers.length|0], from = a.g.position.clone().setY(a.g.position.y + 1.3);
      shootArrow(from, tg.pos.clone().setY(1 + (tg.climb || 0)*(tg.H || 0)), R() < (win ? .65 : .3), () => { tg.hp -= 2.5; tg.hit = .18; if (tg.hp <= 0) knockOut(tg); });
    }
  }
  // warships sail up the river and bombard the walls; the castle's cannons answer
  for (const p of SIEGE.ships) {
    const z0 = p.g.position.z, dir = Math.sign(p.tz - z0), arrived = Math.abs(p.tz - z0) < .3;
    if (!arrived && !p.sink) p.g.position.z += dir*Math.min(Math.abs(p.tz - z0), dt*7);
    p.g.rotation.y = arrived ? Math.PI*(dir < 0 ? 1 : 0) + Math.sin(time*.8)*.04 : dir < 0 ? Math.PI : 0;
    if (p.sink) { p.sink = Math.min(1.6, p.sink + dt*.45); p.g.position.y = -.26 - p.sink*2.4; p.g.rotation.z = p.sink*.8; }
    else p.g.position.y = -.26 + Math.sin(time*2 + p.tz)*.06;
  }
  const afloat = SIEGE.ships.filter(p => !p.sink && Math.abs(p.tz - p.g.position.z) < .3);
  if (afloat.length && e > 10 && e < 42 && (SIEGE.shipT -= dt) <= 0) {
    SIEGE.shipT = 1.1;
    const p = afloat[R()*afloat.length|0], tp = cb ? new THREE.Vector3(cb.x0 + R()*(cb.x1 - cb.x0), 1.2 + R(), cb.z0 + R()*(cb.z1 - cb.z0)) : new THREE.Vector3(3, 1, 66);
    broadside(p.g.position, tp, R() < .7, () => particle(0x555555, tp, new THREE.Vector3(0, 2, 0), 1.6, .35, {grow:.6, op:.6}));
  }
  if (afloat.length && e > 12 && (SIEGE.gunT -= dt) <= 0) {
    const guns = (W.castle >= 3 ? 2 : 0) + (W.unlocked.has('warship') ? 1 : 0);
    SIEGE.gunT = guns ? 2.4 / guns : 1e9;
    if (guns) {
      const p = afloat[R()*afloat.length|0], from = cb ? new THREE.Vector3(cb.x0 + .5, 2.4, (cb.z0 + cb.z1)/2) : new THREE.Vector3(-13.4, .3, -4.6);
      broadside(from, p.g.position.clone().setY(.6), R() < (win ? .6 : .3), () => { if (--p.hp <= 0 && !p.sink) p.sink = .01; });
    }
  }
  updSiegeKit(dt, e, cb);
  // the end: a won siege leaves the field to you; a lost one, to them
  if (e >= 40 && win) { for (const f of live) knockOut(f); for (const p of SIEGE.ships) if (!p.sink) p.sink = .01; }
  if (e >= 40 && !win && !SIEGE.overrun) {
    SIEGE.overrun = true;
    for (const s of soldiers) if (!s.down) { s.down = true; s.fall = 0; s.hp = 0; }
    banner(`🔥 ${SIEGE.r.n} breaks through!`, 'Their army pours into your town.');
  }
  if (SIEGE.overrun) for (const f of live) { f.inside = false; moveTo(f, 4 + (f.wx || 0)*.2, 6, dt); }
}
// your soldiers sally out and fight the besiegers
function siegeSoldier(s, i, dt) {
  const C = W.raid, e = C.dur - C.t;
  if (e < 7 || e > 42) return false;
  if (s.hp === undefined || s.battle !== BT.id) { s.battle = BT.id; s.maxHp = s.hp = 5 + (W.troop || 0); s.down = false; s.fall = 0; s.cd = R()*.8; s.target = null; s.fought = true; }
  const guns = W.unlocked.has('guns'), alive = SIEGE.foes.filter(f => f.alive && !f.inside);
  if (!alive.length && !s.down) return false;
  s.vel.set(0, 0, 0); s.speed = 3.8;
  if (!s.down) {
    if (!s.target || !s.target.alive || s.target.inside) s.target = nearest(s, alive);
    const t = s.target;
    if (t) {
      const d = Math.hypot(t.pos.x - s.pos.x, t.pos.z - s.pos.z), melee = d < 1.15, reach = guns ? 8 : .95;
      if (d > reach) { moveTo(s, t.pos.x, t.pos.z, dt); collideFighters(s, soldiers); }
      s.yaw = Math.atan2(t.pos.x - s.pos.x, t.pos.z - s.pos.z);
      if ((s.cd -= dt) <= 0 && d <= reach + .1) { const ranged = guns && !melee; s.cd = ranged ? 1 + R()*.7 : .75 + R()*.4; strike(s, t, ranged, (ranged ? 1.3 : 1 + (W.troop || 0)*.2) * (SIEGE.win ? 1.7 : .6)); }
    }
  }
  animEntity(s, dt); s.char.g.rotation.y = s.yaw;
  if (!s.down) { if (s.swing > 0) { s.swing -= dt; s.char.armR.rotation.x = guns ? -1.5 + s.swing : -2.4 + (1 - s.swing/.3)*2.2; } else s.char.armR.rotation.x = guns ? -1.5 : -.7; }
  poseFall(s, dt); healthBar(s);
  return true;
}
function endSiege() {
  const {r, win, atk} = SIEGE, s = es(r);
  for (const f of SIEGE.foes) { scene.remove(f.char.g); stacks.delete(f.stack); if (f.bar) scene.remove(f.bar); }
  for (const x of [...SIEGE.ladders, ...SIEGE.ships.map(p => p.g), ...SIEGE.archers.map(c => c.g)]) scene.remove(x);
  for (const x of SIEGE.kit || []) scene.remove(x); SIEGE.kit = [];
  Object.assign(SIEGE, {foes:[], ships:[], ladders:[], archers:[], overrun:false});
  for (const so of soldiers) if (so.down || so.fall) { so.down = false; so.fall = 0; so.hp = so.maxHp; so.char.g.rotation.x = 0; so.char.g.scale.setScalar(1); if (so.bar) so.bar.visible = false; }
  W.raid = null; BT.noCap = false;
  if (win) {
    const loot = Math.round(atk*40); addCash(CASH.spoils || cash, loot, {x:12.3, z:72.8});
    s.pow *= .7; s.rel += 10; W.flags.siegesWon = (W.flags.siegesWon || 0) + 1;
    banner(`🛡️ The siege is broken!`, `${r.n} retreats. Your army takes ${loot} 💵 from their camp.`);
    waveOver(true);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*110));
  } else {
    // overrun: a district falls (see 091c), they carry off gold and take a province
    const loot = Math.min(Math.floor(W.coins*.2), Math.round(atk*150)); spend(loot);
    const k = landKeys().filter(k => !land(k).lost).sort((a, b) => land(a).loy - land(b).loy)[0];
    if (k) { const L = land(k); L.lost = true; L.by = r.id; }
    s.pow *= .85;
    note(`🔥 ${r.icon} ${r.n} overran your defences`, `They took ${loot} 💵${k ? ` and seized ${landName(k)}` : ''}.`);
    waveOver(false);
  }
  save();
}

