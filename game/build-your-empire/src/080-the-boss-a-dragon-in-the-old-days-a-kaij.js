// ------------------------------------------------------------------ the boss: a dragon in the old days, a kaiju in the modern ones
const BOSS = {t:600, on:null};
// the dragon model, assembled at its pivots: jaw, tail and wings move
function dragonModel(s = .78) {
  const src = MODELS.dragon; if (!src || !src.getObjectByName('dragon_body')) return null;
  const g = new THREE.Group(), P = {};
  const piv = {body:[0, 0, 0], jaw:[0, 1.5, 3.25], tail:[0, .3, -2.0], wingL:[-.5, .82, .7], wingR:[.5, .82, .7]};
  for (const [k, p] of Object.entries(piv)) {
    const o = src.getObjectByName('dragon_' + k); if (!o) continue;
    const m = o.clone(true); m.position.set(...p); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1);
    m.traverse(q => { if (q.isMesh) { q.castShadow = true; } }); g.add(m); P[k] = m;
  }
  g.scale.setScalar(s); g.parts = P; g.wings = [P.wingL, P.wingR].filter(Boolean); g.real = true;
  return g;
}
// a jet of flame from a mouth to a point: three nested cones (white-hot core, orange, red) that flicker, embers at the end
function flameJet(F, from, to, on, dt) {
  if (!F.g) {
    F.g = new THREE.Group(); scene.add(F.g); F.cones = [];
    [[0xfff2b0, .22, 1], [0xffa030, .45, .8], [0xe8401a, .7, .55]].forEach(([c, r, op]) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 12, 1, true), new THREE.MeshBasicMaterial({color:c, transparent:true, opacity:op, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}));
      m.geometry.translate(0, -.5, 0); m.geometry.rotateX(-Math.PI/2); m.userData.r = r; F.g.add(m); F.cones.push(m);
    });
    F.light = FLAME_LIGHT;
  }
  F.g.visible = on; F.light.intensity = on ? 6 + Math.sin(time*40)*2 : 0;
  if (!on) return;
  const len = from.distanceTo(to);
  F.g.position.copy(from); F.g.lookAt(to);
  F.cones.forEach((m, i) => { const w = m.userData.r*(1 + .25*Math.sin(time*37 + i*2)); m.scale.set(w, w, len*(1 + .05*Math.sin(time*29 + i))); m.rotation.z = time*3*(i + 1); });
  F.light.position.copy(to).setY(to.y + 1);
  if (R() < dt*25) particle([0xffa040, 0xff5a1f, 0xffe060][R()*3|0], to.clone().add(new THREE.Vector3((R() - .5)*1.5, 0, (R() - .5)*1.5)), new THREE.Vector3((R() - .5)*3, 2 + R()*3, (R() - .5)*3), .7, .35, {grow:.8, op:.85});
  if (R() < dt*10) particle(0x4a4a4a, to.clone().setY(to.y + 1), new THREE.Vector3((R() - .5), 2.5, (R() - .5)), 1.6, .5, {grow:1.2, op:.45});
}
function flapDragon(g, t, beat) {
  const P = g.parts || {}, f = Math.sin(t*beat)*.62;
  if (P.wingL) { P.wingL.rotation.z = -f; P.wingR.rotation.z = f; } else (g.wings || []).forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * f; });
  if (P.tail) P.tail.rotation.y = Math.sin(t*1.7)*.28;
}
// dragons over the land between attacks: one crosses the sky every few minutes, high up, now and then breathing fire
const SKYD = {t:240, g:null, u:0};
function updSkyDragon(dt) {
  if (!started) return;
  if (!SKYD.g) {
    if (BOSS.on || W.era < 2 || (SKYD.t -= dt) > 0) return;
    SKYD.g = dragonModel(.62) || makeBoss('dragon'); scene.add(SKYD.g); SKYD.u = 0; SKYD.fx = {};
    // it crosses just in front of you, low enough to see from the town
    const a = (R() - .5)*1.2 + (R() < .5 ? 0 : Math.PI), c = player.pos; SKYD.a = [c.x - Math.cos(a)*70, c.z + 4 - Math.sin(a)*40]; SKYD.b = [c.x + Math.cos(a)*70, c.z + 4 + Math.sin(a)*40]; SKYD.yaw = Math.atan2(SKYD.b[0] - SKYD.a[0], SKYD.b[1] - SKYD.a[1]);
    if (!W.flags.skyDragon) { W.flags.skyDragon = 1; banner('🐉 A dragon in the sky!', 'Dragons fly over the land. One day one will come for your town; walls and soldiers will help.'); }
  }
  const D = SKYD, g = D.g; D.u += dt/20;
  const x = D.a[0] + (D.b[0] - D.a[0])*D.u, z = D.a[1] + (D.b[1] - D.a[1])*D.u, y = 9.5 - Math.sin(D.u*Math.PI)*3 + Math.sin(time*1.4)*.6;
  g.position.set(x, y, z); g.rotation.set(0, D.yaw, Math.sin(time*.8)*.15); flapDragon(g, time, 4.2);
  const roar = Math.sin(D.u*Math.PI*3) > .93; g.updateMatrixWorld(true);
  const mouth = new THREE.Vector3(0, 1.5, 4.6).applyMatrix4(g.matrixWorld), ahead = mouth.clone().add(new THREE.Vector3(Math.sin(D.yaw)*7, -1.5, Math.cos(D.yaw)*7));
  flameJet(D.fx, mouth, ahead, roar, dt);
  if (D.u >= 1) { scene.remove(g); if (D.fx.g) { scene.remove(D.fx.g); scene.remove(D.fx.light); } D.g = null; D.t = 600 + R()*600; }
}
function makeBoss(kind) {
  const g = new THREE.Group(); scene.add(g);
  if (kind === 'dragon') {
    mesh(G.sph, 0xb8322a, [.9, .7, 2.2], [0, 0, 0], g); mesh(G.sph, 0xd9a52a, [.7, .5, 1.6], [0, -.25, .2], g);
    const neck = mesh(G.cyl, 0xb8322a, [.35, 1.6, .35], [0, .6, 2], g); neck.rotation.x = .9;
    mesh(G.box, 0xb8322a, [.6, .5, 1], [0, 1.2, 2.8], g); for (const x of [-.2, .2]) { mesh(G.cone, 0xf4f0e6, [.08, .4, .08], [x, 1.55, 2.5], g).rotation.x = -.6; bulb(g, x, 1.32, 3.3, 0xffe040, .07); }
    const tail = mesh(G.cone, 0xb8322a, [.4, 2.6, .4], [0, -.1, -2.8], g); tail.rotation.x = -Math.PI/2;
    g.wings = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s*.7, .4, .3); g.add(w);
      const m = new THREE.Mesh(new THREE.ConeGeometry(2.2, .05, 3), mat(0x8a1e1a, {side:THREE.DoubleSide})); m.scale.set(1, 1, .7); m.position.x = s*2; m.rotation.z = Math.PI/2; w.add(m); g.wings.push(w);
    }
    g.scale.setScalar(1.3);
  } else {
    mesh(G.cap, 0x3f6a3a, [4, 4.5, 3.4], [0, 3.2, 0], g); mesh(G.sph, 0x4a7a44, [1.1, .9, 1.2], [0, 6.2, .8], g); for (const x of [-.4, .4]) bulb(g, x, 6.4, 1.85, 0xffe040, .14);
    for (let i = 0; i < 6; i++) mesh(G.cone, 0xa8c8a8, [.35, .9, .35], [0, 4.6 - i*.6, -1.1 - i*.12], g).rotation.x = -.5;
    const tail = mesh(G.cone, 0x3f6a3a, [.9, 4, .9], [0, 1, -2.6], g); tail.rotation.x = -1.2;
    g.legs = []; for (const x of [-.8, .8]) { const l = new THREE.Group(); l.position.set(x, 1.6, 0); g.add(l); mesh(G.box, 0x3f6a3a, [.8, 1.8, .9], [0, -.8, 0], l); g.legs.push(l); }
    g.arms = []; for (const x of [-1.3, 1.3]) { const a = new THREE.Group(); a.position.set(x, 4.2, .5); g.add(a); mesh(G.box, 0x3f6a3a, [.35, 1.2, .35], [0, -.5, .2], a); g.arms.push(a); }
  }
  return g;
}
