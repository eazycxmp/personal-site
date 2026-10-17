// ------------------------------------------------------------------ guns
function rifle(arm, modern) {
  const r = new THREE.Group(); r.position.set(0, -.5, .06); arm.add(r);
  mesh(G.box, modern ? 0x1e2018 : 0x6a4422, [.07, .1, .32], [0, 0, -.06], r);
  if (modern) { mesh(G.cyl, 0x111114, [.035, .18, .035], [0, .08, .12], r).rotation.x = Math.PI/2; mesh(G.box, 0x1e2018, [.05, .14, .06], [0, -.08, .05], r); }
  mesh(G.cyl, 0x2a2c30, [.025, .5, .025], [0, .03, .3], r, {metalness:.7, roughness:.3}).rotation.x = Math.PI/2;
  return r;
}
// every soldier re-equips for the new age
function troopStage(n, anim) {
  W.troop = Math.max(W.troop || 0, n);
  for (const s of soldiers) {
    const old = s.char; scene.remove(old.g);
    s.char = makeChar(ARMS()); s.char.g.position.copy(old.g.position); s.char.g.rotation.y = s.yaw;
    if (anim) puff(s.pos.x, s.pos.z);
  }
  if (anim && n !== 4) banner(`${['', '🏛️', '🪓', '🛡️', '', '🎖️'][n]} ${TROOPS[n].n}!`, 'Your soldiers re-equip for a new age. Campaigns need fewer of them.');
}
function gunRack(anim) {
  const g = new THREE.Group(); g.position.set(-5, 0, 66.5); scene.add(g);
  for (const x of [-1.15, -.35]) mesh(G.box, 0x5e3f22, [.08, .9, .08], [x, .45, .75], g);
  mesh(G.box, 0x5e3f22, [.9, .07, .1], [-.75, .8, .75], g);
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Group(); r.position.set(-1.05 + i*.2, .02, .66); r.rotation.x = -.18; g.add(r);
    mesh(G.box, 0x6a4422, [.06, .32, .09], [0, .16, 0], r); mesh(G.cyl, 0x2a2c30, [.022, .6, .022], [0, .6, 0], r, {metalness:.7});
  }
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('GUNS', '#2a1a10', '#ffd36b')}));
  sign.scale.set(1.3, .4, 1); sign.position.set(0, 1.95, 1.02); g.add(sign);
  if (anim) popIn(g);
}

