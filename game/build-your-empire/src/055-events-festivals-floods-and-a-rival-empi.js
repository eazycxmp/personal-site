// ------------------------------------------------------------------ events: festivals, floods and a rival empire
const EV = {t:150, rival:null, rivalG:null};
function rivalCity() {
  if (EV.rivalG) scene.remove(EV.rivalG);
  const g = new THREE.Group(); scene.add(g); EV.rivalG = g;
  clearForest({x0:-9, x1:14, z0:111, z1:122});
  slab(0x8a7a5a, 22, 9, 3, 116.5, .002);
  if (EV.noRival) return;
  const lv = Math.max(W.rival || 0, ostLevel()); seed = 41;
  if (!(MODELS.castles && MODELS.styles)) for (let i = 0; i < 6 + lv*3; i++) {
    const x = -7 + (i % 8)*2.6 + rnd()*.5, z = 113.5 + Math.floor(i / 8)*2.6, h = 1 + rnd()*1.4 + lv*.4;
    mesh(G.box, [0x5a3a3a, 0x4a4a5a, 0x3a2a2a][i % 3], [1.5, h, 1.4], [x, h/2, z], g); mesh(G.cone4, 0x2a1a1a, [1.2, .7, 1.1], [x, h + .35, z], g).rotation.y = Math.PI/4;
  }
  for (const x of [-8, 14]) { mesh(G.cyl, 0x3a3a3e, [.5, 3 + lv*.5, .5], [x, 1.5 + lv*.25, 112.4], g); mesh(G.cone, 0x6a1a1a, [.6, 1, .6], [x, 3.6 + lv*.5, 112.4], g); }
  mesh(G.cyl, 0x2a2a2e, [.05, 3, .05], [3, 1.5, 112], g); mesh(G.box, W.rivalAlly || ostOurs() ? 0xf2c200 : 0x6a1a1a, [.9, .5, .03], [3.47, 2.7, 112], g);
}
function updEvents(dt) {
  if (!started) return;
  // a festival: lanterns, confetti and guests who pay double
  if (W.festival > 0) {
    W.festival -= dt;
    if (R() < dt*25) particle([0xff6a8a, 0xffd84a, 0x5ac8ff, 0xb78cff][R()*4|0], new THREE.Vector3(player.pos.x + (R() - .5)*14, 6, player.pos.z + (R() - .5)*14), new THREE.Vector3((R() - .5)*2, -1.5, (R() - .5)*2), 3, .07);
    if (W.festival <= 0) banner('🎉 The festival is over', 'What a party. Everyone is a little happier.');
  }
  // floods in spring, unless the medieval water works hold the river back
  if (W.flood > 0) {
    W.flood -= dt; water.position.y = -.2 + Math.min(.12, W.flood*.02) ;
    if (W.flood <= 0) { water.position.y = -.2; fishZone.active = true; banner('🌊 The river is back in its banks', 'Fishing is open again.'); }
  }
  if (W.raid && !W.raid.siege) {
    W.raid.t -= dt;
    if (W.raid.t <= 0 && W.raid.revolt) { const k = W.raid.revolt; W.raid = null; setTimeout(endBattle, 2500); endRevolt(k); }
    else if (W.raid.t <= 0 && W.raid.tribe != null) {
      const R0 = W.raid, c = CAMPAIGNS[R0.tribe]; W.raid = null; setTimeout(() => { endBattle(); BT.lose = BT.noCap = false; }, 2500);
      if (R0.win) { const loot = 300 + 200*W.era; addCash(CASH.spoils || cash, loot, {x:12.3, z:84.8}); banner(`🛡️ The ${c.name} are beaten off!`, `Your army takes ${loot} 💵 from them.`); }
      else { const lost = Math.min(Math.floor(W.coins*.12), 5000 + 3000*W.era); spend(lost); banner(`🔥 The ${c.name} raid you!`, `They carry off ${lost} 💵. Train more soldiers before they come back.`); }
      save();
    }
    else if (W.raid.t <= 0) {
      W.raid = null; setTimeout(endBattle, 2500);
      W.rivalWins = (W.rivalWins || 0) + 1;
      const loot = 400 + 250*W.era; addCash(CASH.spoils || cash, loot, {x:12.3, z:84.8});
      if (W.rivalWins >= 4 && !W.rivalAlly) { W.rivalAlly = true; banner('🤝 The rival empire surrenders!', 'They join you and pay tribute every season.'); rivalCity(); }
      else banner('🛡️ Raid beaten off!', `Your army takes ${loot} 💵 from the raiders.`);
      save();
    }
  }
  if (W.rivalAlly && (EV.tribT = (EV.tribT ?? 30) - dt) <= 0) { EV.tribT = 30; addCash(CASH.spoils || cash, 200 + 100*W.era, {x:12.3, z:84.8}); }
  if ((EV.t -= dt) > 0) return;
  EV.t = 120 + R()*90;
  const si = seasonIdx(), roll = R();
  if (W.era >= 2 && roll < .4) { W.festival = 40; banner('🎉 Festival!', 'Lanterns, music and confetti. Guests pay double for 40 seconds.'); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => snd(f, .2, 'triangle', .05), i*120)); }
  else if (si === 0 && W.era >= 2 && roll < .75) {
    if ((W.water || 0) >= 3) banner('🌊 Spring flood!', 'Your water works hold the river back.');
    else { W.flood = 25; fishZone.active = false; banner('🌊 Spring flood!', 'The river floods its banks. No fishing for a little while. Build the medieval water works to stop this.'); }
  }
}

