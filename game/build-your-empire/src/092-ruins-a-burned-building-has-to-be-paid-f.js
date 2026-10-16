// ------------------------------------------------------------------ ruins: a burned building has to be paid for again, from scratch
function rebuildCost(st) {
  const p = PADS.find(q => q.id === st.id), base = !p ? 1500 : p.cur === 'coin' ? p.cost : p.cost*60;
  return Math.round(Math.max(800, base) * (1 + .5*((W.levels[st.id] || 1) - 1)));
}
function ruinStation(st, cost) {
  st.broken = true; st.busy = false; st.ruin = cost; st.ruinCost = st.ruinCost || cost;
  (W.flags.ruins ||= {})[st.id] = cost;
  for (const o of PADOBJ[st.id] || []) o.visible = false;
  const [x, z] = st.inZ || st.outZ, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); st.rubble = g;
  const scorch = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({color:0x1a1410, transparent:true, opacity:.55, depthWrite:false})); scorch.rotation.x = -Math.PI/2; scorch.scale.set(3.4, 3.4, 1); scorch.position.y = .03; g.add(scorch);
  seed = st.id.length*7;
  for (let i = 0; i < 9; i++) mesh(G.box, i % 3 ? 0x5a5048 : 0x2a2420, [.3 + rnd()*.5, .2 + rnd()*.4, .3 + rnd()*.5], [(rnd() - .5)*2.4, .15, (rnd() - .5)*2.4], g).rotation.y = rnd()*3;
  for (let i = 0; i < 3; i++) { const b = mesh(G.box, 0x1e1a16, [.12, .12, 1.6], [(rnd() - .5)*1.6, .35, (rnd() - .5)*1.6], g); b.rotation.set(rnd()*.6, rnd()*3, .4); }
  st.repairZone = addZone({kind:'rebuild', st:st.id, x, z, icon:'🏗️', tile:{alpha:1, size:84, label:`Rebuild ${cost}`, fill:'rgba(120,60,20,.65)'}});
}
function payRebuild(zn, e) {
  const st = ST[zn.st]; if (!st || !st.ruin) return;
  if (W.coins <= 0) { e.tick = .3; return; }
  const amt = Math.min(st.ruin, W.coins, Math.max(1, Math.ceil(st.ruinCost / 28)));
  spend(amt); st.ruin -= amt; W.flags.ruins[st.id] = st.ruin; e.tick = .045;
  snd(500 + (1 - st.ruin/st.ruinCost)*500, .03, 'triangle', .025);
  if (st.ruin <= 0) {
    for (const o of PADOBJ[st.id] || []) o.visible = true;
    scene.remove(st.rubble); st.rubble = null; st.broken = false; st.ruin = 0; st.ruinCost = 0; delete W.flags.ruins[st.id];
    removeZone(zn); st.repairZone = null; puff(zn.x, zn.z); shakeCam(.3);
    banner(`🏗️ ${st.name} rebuilt!`, 'Back in business.'); save();
  } else if (Math.random() < .2) { drawTile(zn.tc.g, '🏗️', {alpha:1, size:84, label:`Rebuild ${st.ruin}`, fill:'rgba(120,60,20,.65)'}); zn.tc.t.needsUpdate = true; }
}

