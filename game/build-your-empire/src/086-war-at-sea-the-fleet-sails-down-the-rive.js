// ------------------------------------------------------------------ war at sea: the fleet sails down the river, out to sea, anchors off a beach and bombards the fort
const seaSite = C => C.site || (C.ci === 4 ? 'empire' : 'cove');
function startSea() {
  const C = W.camp, id = seaSite(C), S = COAST.sites[id], f = COAST.cur = coastFort(id);
  fortReset(f);
  const war = boats.find(b => b.kind === 'war');
  if (war) { war.inFleet = true; war.lane = -13.6; war.home = -4.6; addCrew(war); }
  [[-15.2, -8.8], [-12, -8.8]].forEach(([x, z]) => { const b = makeBoat('troop'); b.x = x; b.z = z; b.inFleet = true; b.temp = true; b.lane = x; b.home = z; addCrew(b); });
  fleet().forEach((b, k) => { b.ax = S.x - 5 + k*5; b.az = -96.6 - (k % 2)*.9; });
  [-1, 1].forEach(s => { const p = makePirate(S.x + s*7, -106); p.hp = 3; pirates.push(p); });
}
function updSea(dt) {
  const C = W.camp;
  if (!C || C.type !== 'sea') { if (pirates.length && !C) { pirates.forEach(p => scene.remove(p.g)); pirates.length = 0; } return; }
  const e = C.dur - C.t, ease = u => u < 0 ? 0 : u > 1 ? 1 : u*u*(3 - 2*u), win = C.win !== false, f = COAST.cur, MZ = -93.2, stop = win ? 35 : 30;
  for (const b of fleet()) {
    let x = b.lane, z = b.home, yaw = Math.PI;
    if (e < 9) z = b.home;
    else if (e < 17) z = b.home + (MZ - b.home)*ease((e - 9)/8);
    else if (e < 21) { const u = ease((e - 17)/4); x = b.lane + (b.ax - b.lane)*u; z = MZ + (b.az - MZ)*u; yaw = Math.atan2(b.ax - b.lane, b.az - MZ); }
    else if (e < stop) { x = b.ax; z = b.az + Math.sin(time*.8 + b.lane)*.12; yaw = Math.PI/2 + Math.sin(time*.6 + b.lane)*.05; }
    else {
      const u = (e - stop) / Math.max(1, C.dur - 1 - stop);
      if (u < .35) { const v = ease(u/.35); x = b.ax + (b.lane - b.ax)*v; z = b.az + (MZ - b.az)*v; yaw = Math.atan2(b.lane - b.ax, MZ - b.az); }
      else { z = MZ + (b.home - MZ)*ease((u - .35)/.65); yaw = 0; }
    }
    b.x = x; b.z = z;
    b.g.position.set(x, Math.sin(time*2 + x)*.06 - .26, z); b.g.rotation.y = yaw; b.g.rotation.z = Math.sin(time*1.6 + z*.1)*.05;
  }
  // the defenders' ships come out to meet you, and go down if you are winning
  pirates.forEach((p, i) => {
    const tx = f.g.position.x + (i ? 6 : -6), z = e < 21 ? -106 + 7*ease(e/21) : -99 + Math.sin(time*.7 + i)*.3;
    p.x = tx; p.z = z; if (win && e > 24 + i*4) p.sink = Math.min(1.6, p.sink + dt*.45);
    p.g.position.set(tx, -.26 - p.sink*2.4 + Math.sin(time*2 + i)*.06, z);
    p.g.rotation.y = Math.PI/2 + Math.sin(time*.9 + i)*.2; p.g.rotation.z = p.sink*.8;
    if (p.sink > 0 && p.sink < 1.5 && R() < dt*14) particle(R() < .5 ? 0xff7a2a : 0x4a4a4a, new THREE.Vector3(tx + (R() - .5)*2, 1.2 - p.sink, z + (R() - .5)), new THREE.Vector3(0, 2.5, 0), .9, .25, {grow:.5, op:.75});
  });
  if (e >= 21 && e < stop && (seaFireT -= dt) <= 0) {
    seaFireT = .28;
    const ours = fleet(), foes = pirates.filter(p => p.sink < .4), roll = R();
    if (roll < .5 && ours.length) {
      const b = ours[R()*ours.length|0], tp = f.g.position.clone().add(new THREE.Vector3((R() - .5)*6, 1 + R(), (R() - .5)*2));
      broadside(b.g.position, tp, R() < (win ? .8 : .45), () => { fortHit(f); if (R() < .5) particle(0xff7a2a, tp, new THREE.Vector3(0, 2, 0), 1.2, .4, {grow:.6, op:.7}); });
    } else if (roll < .65 && ours.length && foes.length) { const b = ours[R()*ours.length|0], tg = foes[R()*foes.length|0]; broadside(b.g.position, tg.g.position.clone().setY(.6), R() < .6); }
    else if (ours.length && f.guns.length && f.hp > 0) { const gn = f.guns[R()*f.guns.length|0], from = gn.getWorldPosition(new THREE.Vector3()), tg = ours[R()*ours.length|0]; broadside(from, tg.g.position.clone().setY(.6), R() < (win ? .2 : .45)); }
    else if (ours.length && foes.length) { const p = foes[R()*foes.length|0], tg = ours[R()*ours.length|0]; broadside(p.g.position, tg.g.position.clone().setY(.6), .25); }
  }
  // the fort burns as it falls; when it does, your flag goes up
  if (f.hp < f.max*.6 && R() < dt*8) particle(R() < .5 ? 0xff7a2a : 0x555555, f.g.position.clone().add(new THREE.Vector3((R() - .5)*6, 1.5, (R() - .5)*2)), new THREE.Vector3(0, 2.4, 0), 1.2, .3, {grow:.5, op:.65});
  if (win && e >= stop && f.flag.material.color.getHex() !== 0xf2c200) { f.flag.material = mat(0xf2c200); while (f.hp > 0) fortHit(f); }
}
function endSea() {
  const C = W.camp || endSea.last || {}, f = COAST.cur;
  for (const b of [...boats]) {
    if (!b.inFleet) continue;
    b.inFleet = false; if (b.crew) b.crew.visible = false;
    if (b.temp) { scene.remove(b.g); boats.splice(boats.indexOf(b), 1); }
    else { b.state = 'dock'; b.z = b.home; }
  }
  pirates.forEach(p => scene.remove(p.g)); pirates.length = 0;
  if (f && C.win !== false) {
    (W.flags.coast ||= {})[f.id] = 1;
    // the fort is rebuilt under your flag
    fortReset(f); f.flag.material = mat(0xf2c200);
  } else if (f) fortReset(f);
  COAST.cur = null;
}

