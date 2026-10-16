// ------------------------------------------------------------------ realistic people (Quaternius CC0 bodies, rigged and animated)
const QN = {smooth:true, ready:false, list:[], tex:{}, clips:{}, S:2.0/1.84, tmpQ:new THREE.Quaternion(), tmpQ2:new THREE.Quaternion(), tmpV:new THREE.Vector3(), sphere:new THREE.Sphere(), frustum:new THREE.Frustum(), pm:new THREE.Matrix4()};
// which part of the body each vertex belongs to, from the bone that moves it most: 0 skin, 1 torso, 2 upper arm, 3 forearm, 4 hips and thighs, 5 calves, 6 feet
const QN_REGION = n => /^(spine|clavicle)/.test(n) ? 1 : /^upperarm/.test(n) ? 2 : /^lowerarm/.test(n) ? 3 : /^(pelvis|thigh)/.test(n) ? 4 : /^calf/.test(n) ? 5 : /^(foot|ball)/.test(n) ? 6 : 0;
function qnInit() {
  if (QN.ready || QN.failed) return QN.ready;
  if (!MODELS.qn_male || !MODELS.qn_female || !MODELS.qn_anims) return false;
  for (const k of ['qn_male', 'qn_female']) MODELS[k].traverse(o => {
    if (!o.isSkinnedMesh || !/Super[hH]ero/.test(o.name) || o.geometry.attributes.qnr) return;
    const g = o.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = o.skeleton.bones, r = new Float32Array(si.count);
    for (let i = 0; i < si.count; i++) { let best = 0, bw = -1; for (let j = 0; j < 4; j++) { const w = sw.getComponent(i, j); if (w > bw) { bw = w; best = si.getComponent(i, j); } } r[i] = QN_REGION(bones[best] ? bones[best].name : ''); }
    g.setAttribute('qnr', new THREE.BufferAttribute(r, 1));
  });
  for (const c of MODELS.qn_anims.userData.anims || []) QN.clips[c.name] = c;
  const TL = new THREE.TextureLoader();
  for (const k of ['male_light', 'male_dark', 'female_light', 'female_dark']) TL.load(`./models/qn_${k}.jpg`, t => { t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; QN.tex[k] = t; for (const c of QN.list) if (c.skinKey === k && c.bodyMat) { c.bodyMat.map = t; c.bodyMat.needsUpdate = true; } });
  QN.ready = !!QN.clips.Walk_Loop && !!QN.clips.Idle_Loop;
  if (!QN.ready) QN.failed = true;
  return QN.ready;
}
function qnBodyMat(src, regions, tint) {
  const m = src.clone(), U = {uQN:{value:regions}, uTint:{value:tint}};
  m.normalScale = new THREE.Vector2(.55, .55);
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float qnr; varying float vQnr;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvQnr = qnr;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uQN[7]; uniform vec3 uTint; varying float vQnr;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  { int ri = int(vQnr + .5); vec4 rc = uQN[0]; for (int k = 1; k < 7; k++) if (k == ri) rc = uQN[k];
    if (rc.a > .5) discard;
    diffuseColor.rgb *= uTint; }`);
  };
  m.customProgramCacheKey = () => 'qn2';
  return m;
}
const qnCol = c => new THREE.Color(c ?? 0x888888);
function qnHat(o, top) {
  // hats sized for a real head (the crown of the skull is at about 1.78 on the 1.84 body)
  const g = new THREE.Group(), y = 1.95, M = {metalness:.6, roughness:.35};
  const hc = o.hatCol, add = (geo, col, s, p, opt) => mesh(geo, col, s, p, g, opt);
  switch (o.hat) {
    case 'chef': add(G.cyl, 0xffffff, [.11, .16, .11], [0, y + .04, 0]); add(G.sph, 0xffffff, [.13, .07, .13], [0, y + .13, 0]); break;
    case 'beanie': add(G.sph, hc || 0xd9443a, [.125, .1, .13], [0, y - .03, -.005]); add(G.sph, 0xffffff, [.035, .035, .035], [0, y + .07, 0]); break;
    case 'straw': add(G.cyl, 0xe0c070, [.22, .012, .22], [0, y - .05, 0]); add(G.cyl, 0xe0c070, [.11, .09, .11], [0, y, 0]); break;
    case 'fur': add(G.cyl, hc || 0x7a4a2a, [.13, .12, .13], [0, y, 0]); add(G.cyl, 0xf3eadb, [.135, .035, .135], [0, y - .06, 0]); break;
    case 'helmet': case 'roman': case 'viking': case 'tactical':
      add(G.sph, o.hat === 'tactical' ? 0x4a5440 : hc || 0x9aa0a8, [.13, .1, .135], [0, y - .03, -.005], M);
      if (o.hat === 'roman') add(G.box, 0xc8302a, [.03, .09, .19], [0, y + .07, 0]);
      if (o.hat === 'viking') for (const sx of [-1, 1]) { const h = add(G.cone, 0xf0e8d0, [.03, .12, .03], [sx*.13, y + .03, 0]); h.rotation.z = -sx*.9; }
      break;
    case 'greathelm': add(G.cyl, 0xc8ccd2, [.13, .2, .13], [0, y - .07, 0], M); add(G.box, 0x111114, [.16, .02, .02], [0, y - .06, .125]); break;
    case 'tricorne': add(G.cyl, 0x1a1a1e, [.17, .02, .17], [0, y - .01, 0]); add(G.cone4, 0x1a1a1e, [.15, .1, .15], [0, y + .05, 0]); break;
    case 'tophat': add(G.cyl, 0x1a1a1e, [.17, .015, .17], [0, y - .02, 0]); add(G.cyl, 0x1a1a1e, [.11, .2, .11], [0, y + .08, 0]); break;
    case 'feather': add(G.cyl, hc || 0x1e2a5a, [.18, .015, .18], [0, y - .02, 0]); add(G.cyl, hc || 0x1e2a5a, [.11, .08, .11], [0, y + .02, 0]); add(G.sph, 0xf4f0e8, [.02, .09, .02], [.06, y + .09, -.03]); break;
    case 'hood': add(G.sph, hc || top, [.14, .14, .15], [0, y - .06, -.02]); break;
  }
  if (o.acc === 'cap') { add(G.sph, o.body2 ?? 0x2a5aa8, [.12, .065, .13], [0, y - .015, 0]); add(G.box, o.body2 ?? 0x2a5aa8, [.12, .01, .08], [0, y - .04, .12]); }
  if (o.acc === 'bucket') { add(G2.flare, o.body2 ?? 0xd8c8a0, [.13, .07, .13], [0, y, 0]); add(G2.cyl, o.body2 ?? 0xd8c8a0, [.17, .01, .17], [0, y - .04, 0]); }
  if (o.acc === 'sunglasses') { for (const sx of [-1, 1]) add(G.box, 0x111114, [.05, .024, .01], [sx*.037, 1.8, .118]); }
  return g.children.length ? g : null;
}
// a person who has left: stop their animations and free what they held on the GPU (materials, and the bone texture
// every skinned body gets the first time it is drawn)
function qnShared() {
  // geometry every person borrows (the body models, the shared primitives): never freed with one person
  if (!QN.shared) { QN.shared = new Set(Object.values(G).concat(Object.values(typeof G2 !== 'undefined' ? G2 : {}))); for (const k of ['qn_male', 'qn_female']) MODELS[k] && MODELS[k].traverse(m => { if (m.geometry) QN.shared.add(m.geometry); }); }
  return QN.shared;
}
function qnDrop(c) {
  c.mixer.stopAllAction(); c.mixer.uncacheRoot(c.root); const sh = qnShared();
  c.g.traverse(m => {
    if (m.isSkinnedMesh && m.skeleton) m.skeleton.dispose();
    if (m.isMesh && m.material) [].concat(m.material).forEach(q => { if (q !== BLOB.mat && !q.userData.shared) q.dispose(); });
    if (m.isMesh && m.geometry && !sh.has(m.geometry)) m.geometry.dispose();
  });
}
function makeQN(o) {
  // people who have left the world are let go here too (not only while animating)
  if (QN.list.length > 300) for (let i = QN.list.length - 1; i >= 0; i--) { const q = QN.list[i]; if (!q.g.parent) { qnDrop(q); QN.list.splice(i, 1); } }
  const fem = o.top === 'dress' || ['long', 'bun', 'ponytail', 'bangs'].includes(o.hair) || o.fem;
  const src = MODELS[fem ? 'qn_female' : 'qn_male'], root = skClone(src), g = new THREE.Group(), c = {g, bob:0, real:true, qn:true};
  root.scale.setScalar(QN.S); g.add(root);
  // the skin: light or dark texture, nudged towards this person's own tone
  const skin = new THREE.Color(o.skin || 0xf1c9a5), dark = skin.getHSL({}).l < .5;
  c.skinKey = (fem ? 'female' : 'male') + (dark ? '_dark' : '_light');
  const top = o.metal ? 0xb8bcc4 : (o.body ?? 0x3f6fb5), pants = o.pants ?? 0x3b3b4a, shoe = o.shoe ?? 0x2a1d12, dress = o.top === 'dress';
  const bare = o.top === 'tank' || dress, long = ['hoodie', 'jacket', 'suit'].includes(o.top) || o.long || o.metal;
  const sleeve = o.top === 'jacket' ? (o.body2 ?? top) : o.top === 'suit' ? 0x1e1e26 : top;
  const R4 = (col, a) => { const v = qnCol(col); return new THREE.Vector4(v.r, v.g, v.b, a); };
  const wearTop = long ? 'ShirtLong' : 'Shirt', wearLeg = dress ? '' : o.shorts ? 'Shorts' : 'Pants';
  const regions = [R4(0, 0), R4(0, 1), R4(0, 1), R4(0, long ? 1 : 0), R4(0, 1), R4(0, wearLeg === 'Pants' ? 1 : 0), R4(0, 1)];
  const topCol = o.top === 'suit' ? 0x1e1e26 : o.top === 'jacket' ? (o.body2 ?? top) : top;
  const tex = QN.tex[c.skinKey], base = skin.clone().multiplyScalar(1/Math.max(.2, dark ? .42 : .82));
  const tint = new THREE.Vector3(Math.min(1.25, base.r), Math.min(1.25, base.g), Math.min(1.25, base.b));
  // which hair to show (under a hat only longer hair, which hangs below the brim)
  const hs = o.hair ?? 'short', hatted = o.hat && o.hat !== 'hood';
  const hairName = fem ? ({long:'Long', bangs:'Long', ponytail:'Long', bun:'Buns', sidepart:'SimpleParted', short:'SimpleParted', afro:'Buns'}[hs] || 'BuzzedFemale') : ({long:'Long', sidepart:'SimpleParted', short:'SimpleParted', afro:'SimpleParted', mohawk:'Buzzed', buzz:'Buzzed'}[hs] || (hs === 'bald' ? '' : 'Buzzed'));
  const hairShow = hatted && !['Long', 'Buns'].includes(hairName) ? (fem ? 'BuzzedFemale' : 'Buzzed') : hairName;
  root.traverse(m => {
    if (!m.isSkinnedMesh) return;
    // a fixed bound round the whole body, so off-screen people are skipped (the skinned pose never leaves it)
    if (!m.geometry.userData.qnBound) { m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .9, 0), 1.3); m.geometry.userData.qnBound = true; }
    m.computeBoundingSphere = () => { m.boundingSphere = m.geometry.boundingSphere.clone(); return m.boundingSphere; };
    m.boundingSphere = m.geometry.boundingSphere.clone(); m.frustumCulled = true;
    m.castShadow = /Super[hH]ero/.test(m.name); m.receiveShadow = true;
    if (/Super[hH]ero/.test(m.name)) { c.bodyMat = m.material = qnBodyMat(m.material, regions, tint); if (tex) c.bodyMat.map = tex; c.body = m; }
    else if (/Wear_/.test(m.name)) {
      const k = m.name.replace(/^QN_Wear_/, '').replace(/\.\d+$/, '');
      m.visible = k === wearTop || k === wearLeg || k === 'Shoes';
      if (m.visible) { m.material = new THREE.MeshStandardMaterial({color:k === 'Shoes' ? shoe : k === wearLeg ? pants : topCol, roughness:o.metal && k === wearTop ? .35 : .85, metalness:o.metal && k === wearTop ? .6 : 0}); m.castShadow = true; }
    }
    else if (/Hair_/.test(m.name)) {
      const k = m.name.replace(/^QN_Hair_/, '').replace(/\.\d+$/, '');
      m.visible = k === hairShow || (k === 'Beard' && !fem && ['beard', 'goatee', 'mustache'].includes(o.face));
      if (m.visible) { m.material = m.material.clone(); m.material.color = qnCol(o.hairCol ?? 0x2a1a10).multiplyScalar(2.2); }
    } else if (/Eyebrows/.test(m.name)) { m.material = m.material.clone(); m.material.color = qnCol(o.hairCol ?? 0x2a1a10).multiplyScalar(2); }
  });
  // the bones the game poses directly, and stand-ins at the old pivots for the code that hangs things on arms and legs
  const B = n => root.getObjectByName(n);
  c.bones = {armL:B('upperarm_l'), armR:B('upperarm_r'), head:B('Head'), handR:B('hand_r'), handL:B('hand_l'), spine:B('spine_03')};
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  legL.position.set(-.12, 1.0, 0); legR.position.set(.12, 1.0, 0); armL.position.set(-.25, 1.62, 0); armR.position.set(.25, 1.62, 0);
  g.add(legL, legR, armL, armR); Object.assign(c, {legL, legR, armL, armR});
  // hats on the head, gear in the hands
  const hat = qnHat(o, top); if (hat && c.bones.head) { hat.children.forEach(q => { q.position.y = 1.9 + (q.position.y - 1.9)*.8; q.position.x *= .8; q.position.z *= .8; q.scale.multiplyScalar(.8); }); root.updateMatrixWorld(true); hat.scale.setScalar(1/QN.S); hat.position.multiplyScalar(1/QN.S); root.add(hat); c.bones.head.attach(hat); }
  if (o.apron) { const ap = mesh(G.box, o.apron, [.3, .5, .02], [0, 1.0, .14], g); }
  if (dress) { const pel = B('pelvis'); if (pel) { g.updateMatrixWorld(true); const sk = new THREE.Mesh(new THREE.CylinderGeometry(.17, .3, .62, 24, 1, true), new THREE.MeshStandardMaterial({color:top, roughness:.8, side:THREE.DoubleSide})); sk.position.set(0, .8, 0); sk.castShadow = true; g.add(sk); g.updateMatrixWorld(true); pel.attach(sk); } }
  if (o.gun) c.gun = rifle(armR, o.scope);
  if (o.sword) mesh(G.box, 0xe4e8ee, [.04, .6, .08], [0, -.85, .1], armR, {metalness:.7, roughness:.25});
  if (o.axe) { mesh(G.cyl, 0x6b4526, [.025, .65, .025], [0, -.85, .08], armR); mesh(G.box, 0x9aa0a8, [.035, .17, .15], [0, -1.12, .14], armR, {metalness:.6}); }
  if (o.shield) { const sh = mesh(G.cyl, o.shield === 'round' ? 0x8a5a2b : o.trim || 0xb8322a, [.28, .04, .28], [-.08, -.45, .14], armL); sh.rotation.z = Math.PI/2; }
  if (o.tabard) mesh(G.box, o.tabard, [.3, .5, .02], [0, 1.25, .15], g);
  if (o.cape) { const cp = mesh(G.box, o.cape, [.5, 1.05, .03], [0, 1.08, -.18], g); cp.rotation.x = .12; }
  if (o.hero) {
    c.crown = new THREE.Group(); c.crown.position.y = 2.0; g.add(c.crown); c.crown.visible = !!o.crown; c.wantCrown = !!o.crown;
    mesh(G.cyl, 0xf2c200, [.14, .09, .14], [0, 0, 0], c.crown, {metalness:.7, roughness:.3});
    for (let i = 0; i < 5; i++) { const a = i/5*Math.PI*2; mesh(G.cone, 0xf2c200, [.035, .1, .035], [Math.cos(a)*.11, .09, Math.sin(a)*.11], c.crown, {metalness:.7, roughness:.3}); }
    if (o.glow) { c.halo = new THREE.Mesh(new THREE.TorusGeometry(.2, .018, 6, 32), new THREE.MeshBasicMaterial({color:0x8fe8ff, toneMapped:false})); c.halo.rotation.x = Math.PI/2.2; c.halo.position.y = 2.2; g.add(c.halo); }
  }
  if (o.hero || o.rod) {
    c.rod = new THREE.Group(); c.rod.position.set(.36, 1.15, .25); c.rod.rotation.x = .9; c.rod.visible = false; g.add(c.rod);
    mesh(G.cyl, 0x6b4526, [.028, 2.2, .028], [0, 1.1, 0], c.rod); mesh(G.cyl, 0x3a2a1a, [.05, .3, .05], [0, .15, 0], c.rod);
    const tip = new THREE.Group(); tip.position.y = 2.2; tip.rotation.x = -.9; c.rod.add(tip);
    const line = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xf4f4f4})); line.scale.set(.008, 2.35, .008); line.position.y = -1.18; tip.add(line);
    mesh(G.sph, 0xe03a2a, [.07, .07, .07], [0, -2.35, 0], tip); mesh(G.sph, 0xffffff, [.05, .04, .05], [0, -2.29, 0], tip);
  }
  if (!MOBILE) { const sh = new THREE.Mesh(G.plane, BLOB.mat); sh.rotation.x = -Math.PI/2; sh.position.y = .035; sh.scale.set(.8, .8, 1); sh.renderOrder = 1; g.add(sh); }
  // animation: one mixer, the clips started as they are first needed
  c.mixer = new THREE.AnimationMixer(root); c.acts = {}; c.state = ''; c.last = new THREE.Vector3(); c.spd = 0; c.ph = R();
  c.root = root;
  QN.list.push(c); scene.add(g);
  return c;
}
function qnPlay(c, name, fade = .25, once = false) {
  if (c.state === name) return c.acts[name];
  const clip = QN.clips[name]; if (!clip) return null;
  const a = c.acts[name] ||= c.mixer.clipAction(clip);
  if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
  a.reset().setEffectiveWeight(1).fadeIn(fade).play();
  const prev = c.acts[c.state]; if (prev) prev.fadeOut(fade);
  c.state = name; return a;
}
// raise an arm forward by an angle (for carrying, aiming, holding a rod), on top of the animation
function qnRaise(c, bone, ang) {
  if (!bone || !ang) return;
  bone.parent.updateWorldMatrix(true, false);
  const pq = bone.parent.getWorldQuaternion(QN.tmpQ), wq = QN.tmpQ2.copy(pq).multiply(bone.quaternion);
  const ax = QN.tmpV.set(1, 0, 0).applyQuaternion(c.g.quaternion), rot = new THREE.Quaternion().setFromAxisAngle(ax, ang);
  wq.premultiply(rot); bone.quaternion.copy(pq.invert().multiply(wq));
}
// work: the game says what someone is doing and for how long; the animation follows
const QN_ACT = {chop:['Sword_Attack', 1.35], mine:['Fixing_Kneeling', 1.6], swing:['Sword_Attack', 2.1], pick:['PickUp_Table', 1.3], serve:['Interact', 1.6],
  fix:['Fixing_Kneeling', 1.4], cook:['Interact', 1.1], punch:['Punch_Jab', 1.4]};
// (the free pack's Punch_Cross, Push_Loop, Crouch_*, Idle_Talking_Loop and Pistol_Aim_* are empty T-poses: don't use them)
function qnAct(c, act, dur, restart = false) {
  if (!c || !c.mixer) return;
  const same = c.act === act && c.actT > 0;
  if (restart || !same) c.actNew = true;
  c.act = act; c.actT = same ? Math.max(c.actT, dur) : dur;
}
const QN_LOCO = new Set(['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop']);
function updQN(dt) {
  if (!QN.list.length) return;
  QN.frame = (QN.frame || 0) + 1;
  QN.pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); QN.frustum.setFromProjectionMatrix(QN.pm);
  for (let i = QN.list.length - 1; i >= 0; i--) {
    const c = QN.list[i], g = c.g;
    if (!g.parent) { if ((c.gone = (c.gone || 0) + dt) > 5) { qnDrop(c); QN.list.splice(i, 1); } continue; }
    c.gone = 0;
    const p = g.getWorldPosition(QN.tmpV), moved = Math.min(9, Math.hypot(p.x - c.last.x, p.z - c.last.z) / Math.max(dt, 1e-3)); c.last.copy(p);   // a teleport is not a sprint
    c.spd += (moved - c.spd) * Math.min(1, dt*(QN.smooth ? 4 : 8));
    let vis = g.visible; for (let o = g.parent; vis && o && o !== scene; o = o.parent) vis = o.visible;
    QN.sphere.center.copy(p).setY(p.y + 1); QN.sphere.radius = 1.4;
    if (!vis || !QN.frustum.intersectsSphere(QN.sphere)) continue;
    c.seen = QN.frame;
    // what are they doing? the game poses the stand-in limbs; read the pose and pick the animation
    const aR = c.armR.rotation.x, aL = c.armL.rotation.x, lg = c.legL.rotation.x, lgR = c.legR.rotation.x, fall = g.rotation.x;
    let st, rate = 1;
    const act = (c.actT -= dt) > 0 && c.spd < 1.2 ? QN_ACT[c.act] : null;
    if (fall < -.3) { st = 'Death01'; g.rotation.x = 0; }
    else if (act) { st = act[0]; rate = act[1]; if (c.actNew && c.state === st) c.acts[st].reset().play(); c.actNew = false; }
    // seated (both legs bent forward together); a walking stride swings them opposite ways, so one bent leg is not a seat
    else if (lg < -1.2 && lgR < -1.2) st = 'Sitting_Idle_Loop';
    else if (lg < -.7 && lgR < -.7) st = 'Driving_Loop';
    else if (aR < -2 && aL < -2) st = 'Dance_Loop';
    else if (c.gun && aR < -1.35 && c.spd < .5) st = 'Pistol_Shoot';
    else if (QN.smooth) {
      // walking, jogging and running: separate thresholds up and down, and a short stay in each, so nobody flickers
      // between clips; the clip's pace follows the ground speed so feet don't slide
      const v = c.spd, cur = c.loco || 'Idle_Loop';
      let nx = cur;
      if (cur === 'Idle_Loop') { if (v > .45) nx = 'Walk_Loop'; }
      else if (cur === 'Walk_Loop') { if (v < .2) nx = 'Idle_Loop'; else if (v > 3.1) nx = 'Jog_Fwd_Loop'; }
      else if (cur === 'Jog_Fwd_Loop') { if (v < 2.3) nx = 'Walk_Loop'; else if (v > 5.2) nx = 'Sprint_Loop'; }
      else if (v < 4.3) nx = 'Jog_Fwd_Loop';
      if (nx !== cur && (c.locoT || 0) < .35 && cur !== 'Idle_Loop') nx = cur;
      if (nx !== cur) c.locoT = 0; c.locoT = (c.locoT || 0) + dt; c.loco = st = nx;
      rate = st === 'Sprint_Loop' ? clamp(v/6.5, .85, 1.4) : st === 'Jog_Fwd_Loop' ? clamp(v/3.6, .8, 1.45) : st === 'Walk_Loop' ? clamp(v/1.45, .7, 1.55) : 1;
    }
    else if (c.spd > 4.6) { st = 'Sprint_Loop'; rate = c.spd/6.5; }
    else if (c.spd > 2.6) { st = 'Jog_Fwd_Loop'; rate = c.spd/3.6; }
    else if (c.spd > .25) { st = 'Walk_Loop'; rate = Math.max(.6, c.spd/1.5); }
    else st = 'Idle_Loop';
    if (!QN_LOCO.has(st)) c.loco = null;
    const prev = c.state, prevA = c.acts[prev], a = qnPlay(c, st, QN.smooth && QN_LOCO.has(st) && QN_LOCO.has(prev) ? .32 : .2, st === 'Death01');
    // walk, jog and run blend in step: the new clip starts at the same point of the stride
    if (QN.smooth && a && prev !== st && prevA && QN_LOCO.has(st) && QN_LOCO.has(prev) && st !== 'Idle_Loop' && prev !== 'Idle_Loop') a.time = (prevA.time / prevA.getClip().duration) * a.getClip().duration;
    if (a) { const want = Math.min(act ? 2.4 : 1.8, rate); a.timeScale = QN.smooth && prev === st ? a.timeScale + (want - a.timeScale)*Math.min(1, dt*6) : want; }
    // turning: the body eases round to where the game points it (about a tenth of a second) instead of snapping
    if (QN.smooth) {
      const target = g.rotation.y; if (c.yawVis == null) c.yawVis = target;
      let d = target - c.yawVis; d = Math.atan2(Math.sin(d), Math.cos(d));
      c.yawVis = Math.abs(d) > 2.6 || st === 'Death01' ? target : c.yawVis + d*Math.min(1, dt*11);
      c.root.rotation.y = c.yawVis - target;
    }
    c.mixer.update(dt);
    // carrying, holding and aiming: lift the arms forward on top of the animation
    if ((!act || act[2]) && st !== 'Sitting_Idle_Loop' && st !== 'Driving_Loop' && st !== 'Dance_Loop' && st !== 'Death01') {
      if (aR < -.75) qnRaise(c, c.bones.armR, -aR*.95);
      if (aL < -.75) qnRaise(c, c.bones.armL, -aL*.95);
    }
  }
}
function makeChar(o) {
  if (!o.noQN && qnInit()) return makeQN(o.civ ? {...civLook(o.civ === true ? R()*60|0 : o.civ), ...o, civ:0} : o);
  if (o.hero && MODELS.hero && MODELS.hero.getObjectByName('hero0_body')) return makeHero(o);
  if (o.civ) o = {...civLook(o.civ === true ? R()*60|0 : o.civ), ...o, civ:0};
  const key = JSON.stringify(o) + (MODELS.people ? '|R' : '');
  if (!CHAR_GEO[key]) {
    // build the figure once from parts, then merge each limb into a single mesh
    const P = {g:new THREE.Group(), legL:new THREE.Group(), legR:new THREE.Group(), armL:new THREE.Group(), armR:new THREE.Group()};
    const REAL = !o.hero && MODELS.people && MODELS.people.getObjectByName('pp_head_skin');
    if (REAL) buildBodyReal(o, P); else buildBody(o, P);
    const {g, armL, armR} = P;
    if (o.hero && !o.noPack) { mesh(G.box, 0x6a4422, [.42, .5, .2], [0, .98, -.3], g); mesh(G.box, 0x8a5a2b, [.36, .14, .22], [0, 1.12, -.31], g); }
    // finery for the hero as the empire grows
    if (o.hat === 'feather') { mesh(G.cyl, o.hatCol, [.4, .04, .4], [0, 1.86, 0], g); mesh(G.cyl, o.hatCol, [.24, .16, .24], [0, 1.95, 0], g); mesh(G.cyl, 0xf2c200, [.245, .03, .245], [0, 1.9, 0], g, {metalness:.7, roughness:.3}); const f = mesh(G.box, 0xf4f4f4, [.04, .42, .1], [.17, 2.06, -.06], g); f.rotation.z = -.5; }
    if (o.hat === 'tophat') { mesh(G.cyl, 0x1a1a1e, [.38, .04, .38], [0, 1.86, 0], g); mesh(G.cyl, 0x1a1a1e, [.24, .42, .24], [0, 2.08, 0], g); mesh(G.cyl, 0xb8322a, [.245, .06, .245], [0, 1.93, 0], g); }
    if (o.cape) { const cp = mesh(G.box, o.cape, [.6, 1.05, .05], [0, .86, -.25], g); cp.rotation.x = .14; mesh(G.box, o.capeIn || 0xf2c200, [.62, .07, .08], [0, 1.36, -.2], g); mesh(G.box, o.capeIn || 0xf2c200, [.6, .04, .06], [0, .34, -.32], g); }
    if (o.chain) { const n = mesh(G2.ring, 0xf2c200, [.15, .15, .15], [0, 1.2, .1], g, {metalness:.8, roughness:.25}); n.rotation.x = Math.PI/2.4; mesh(G2.sphS, 0xf2c200, [.055, .055, .025], [0, 1.07, .24], g, {metalness:.8, roughness:.25}); }
    if (o.watch) mesh(G.box, 0xf2c200, [.13, .05, .14], [0, -.42, 0], armL, {metalness:.8, roughness:.2});
  switch (o.hat) {
    case 'fur': { const hy = o.hero ? .1 : 0; mesh(G.cyl, o.hatCol || 0x7a4a2a, [.3, .26, .3], [0, 1.8 + hy, 0], g); mesh(G.cyl, 0xf3eadb, [.32, .08, .32], [0, 1.69 + hy, 0], g); break; }
    case 'straw': mesh(G.cyl, 0xe0c070, [.45, .04, .45], [0, 1.78, 0], g); mesh(G.cyl, 0xe0c070, [.22, .2, .22], [0, 1.88, 0], g); break;
    case 'chef': mesh(G.cyl, 0xffffff, [.22, .35, .22], [0, 1.95, 0], g); mesh(G.sph, 0xffffff, [.26, .14, .26], [0, 2.12, 0], g); break;
    case 'beanie': mesh(G.sph, o.hatCol || 0xd9443a, [.27, .2, .27], [0, 1.75, 0], g); mesh(G.sph, 0xffffff, [.07, .07, .07], [0, 1.96, 0], g); break;
  }
  if (o.hat === 'helmet') {
    mesh(G.sph, o.hatCol || 0x9aa0a8, [.28, .2, .28], [0, 1.74, 0], g, {metalness:.5, roughness:.4});
    mesh(G.box, o.hatCol || 0x9aa0a8, [.05, .18, .05], [0, 1.62, .25], g, {metalness:.5});
  }
  // soldiers through the ages: helmets, shields, weapons and kit
  const M = {metalness:.6, roughness:.35};
  if (o.hat === 'roman') { mesh(G.sph, 0xb8bcc4, [.28, .21, .28], [0, 1.74, 0], g, M); mesh(G.box, 0xc8302a, [.07, .2, .4], [0, 1.98, 0], g); mesh(G.box, 0xb8bcc4, [.05, .14, .05], [-.2, 1.6, .1], g, M); mesh(G.box, 0xb8bcc4, [.05, .14, .05], [.2, 1.6, .1], g, M); }
  if (o.hat === 'viking') { mesh(G.sph, 0x8a8f96, [.28, .22, .28], [0, 1.74, 0], g, M); for (const sx of [-1, 1]) { const h = mesh(G.cone, 0xf0e8d0, [.06, .26, .06], [sx*.28, 1.88, 0], g); h.rotation.z = -sx*.9; } mesh(G.box, 0x8a8f96, [.04, .16, .04], [0, 1.6, .26], g, M); mesh(G.sph, 0xd9a050, [.2, .14, .1], [0, 1.43, .18], g); }
  if (o.hat === 'greathelm') { mesh(G.cyl, 0xc8ccd2, [.27, .4, .27], [0, 1.66, 0], g, M); mesh(G.box, 0x111114, [.34, .04, .04], [0, 1.69, .26], g); mesh(G.cone, 0xc8ccd2, [.27, .1, .27], [0, 1.91, 0], g, M); mesh(G.box, o.trim || 0x2d4fa8, [.05, .2, .3], [0, 2.05, 0], g); }
  if (o.hat === 'tricorne') { mesh(G.cyl, 0x1a1a1e, [.36, .05, .36], [0, 1.82, 0], g); mesh(G.cone4, 0x1a1a1e, [.33, .22, .33], [0, 1.94, 0], g); mesh(G.cyl, 0xd9a52a, [.37, .02, .37], [0, 1.85, 0], g); }
  if (o.hat === 'tactical') {
    mesh(G.sph, 0x4a5440, [.29, .22, .29], [0, 1.75, 0], g); mesh(G.box, 0x2a2e26, [.5, .06, .3], [0, 1.66, 0], g);
    for (const x of [-.06, .06]) mesh(G.cyl, 0x111114, [.04, .14, .04], [x, 1.78, .3], g).rotation.x = Math.PI/2;
    mesh(G.box, 0x2a2e26, [.36, .14, .1], [0, 1.53, .2], g);
  }
  if (o.belts) for (const sx of [-1, 1]) { const b = mesh(G.box, 0xf4f4f4, [.07, .7, .02], [0, 1, .27], g); b.rotation.z = sx*.5; }
  if (o.vest) { mesh(G.box, 0x2a2e26, [.5, .45, .5], [0, 1.02, 0], g); for (const x of [-.12, 0, .12]) mesh(G.box, 0x3a3e34, [.1, .14, .06], [x, .9, .27], g); }
  if (o.tabard) { mesh(G.box, o.tabard, [.38, .6, .04], [0, .85, .27], g); mesh(G.box, 0xf2c200, [.14, .14, .02], [0, 1, .3], g); }
  if (o.fur) mesh(G.cyl, 0xd9c8a8, [.34, .1, .32], [0, 1.36, 0], g);
  if (o.shield === 'scutum') { mesh(G.box, 0xb8322a, [.07, .62, .42], [-.1, -.3, .12], armL); mesh(G.sph, 0xd9a52a, [.06, .06, .03], [-.14, -.3, .12], armL, M); mesh(G.box, 0xd9a52a, [.075, .04, .36], [-.1, -.1, .12], armL); }
  if (o.shield === 'round') { const r = mesh(G.cyl, 0x8a5a2b, [.3, .05, .3], [-.12, -.32, .1], armL); r.rotation.z = Math.PI/2; const p = mesh(G.cyl, 0xd9443a, [.18, .055, .18], [-.12, -.32, .1], armL); p.rotation.z = Math.PI/2; mesh(G.sph, 0x8a8f96, [.05, .05, .05], [-.16, -.32, .1], armL, M); }
  if (o.shield === 'heater') { mesh(G.box, o.trim || 0x2d4fa8, [.06, .4, .36], [-.1, -.25, .12], armL); const t = mesh(G.cone4, o.trim || 0x2d4fa8, [.25, .25, .04], [-.1, -.55, .12], armL); t.rotation.set(Math.PI, Math.PI/2, 0); mesh(G.box, 0xf2c200, [.065, .16, .06], [-.1, -.25, .12], armL); }
  if (o.axe) { mesh(G.cyl, 0x6b4526, [.03, .7, .03], [0, -.72, .06], armR); mesh(G.box, 0x9aa0a8, [.04, .2, .18], [0, -1.02, .14], armR, M); }
  if (o.sword) mesh(G.box, 0xe4e8ee, [.05, .62, .1], [0, -.82, .06], armR, {metalness:.7, roughness:.25});
    if (REAL) remapKit(P);
    CHAR_GEO[key] = Object.fromEntries(Object.entries(P).map(([k, grp]) => [k, mergeParts(grp)])); CHAR_GEO[key].real = !!REAL;
  }
  const geo = CHAR_GEO[key];
  const g = new THREE.Group(), c = {g, bob:0};
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group();
  if (geo.real) { legL.position.set(-.12, 1.0, 0); legR.position.set(.12, 1.0, 0); armL.position.set(-.25, 1.64, 0); armR.position.set(.25, 1.64, 0); c.real = true; }
  else { legL.position.set(-.13, .5, 0); legR.position.set(.13, .5, 0); armL.position.set(-.38*(o.bw || 1), 1.22, 0); armR.position.set(.38*(o.bw || 1), 1.22, 0); }
  g.add(legL, legR, armL, armR);
  for (const [k, part] of Object.entries({g, legL, legR, armL, armR})) (geo[k] || []).forEach((gm, i) => {
    if (!gm) return;
    const m = new THREE.Mesh(gm, i ? CHAR_METAL : CHAR_MAT); m.castShadow = true; m.receiveShadow = true; part.add(m);
  });
  if (o.hero) {
    c.crown = new THREE.Group(); c.crown.position.y = 2.16; g.add(c.crown); c.crown.visible = !!o.crown; c.wantCrown = !!o.crown;
    mesh(G.cyl, 0xf2c200, [.21, .13, .21], [0, 0, 0], c.crown, {metalness:.7, roughness:.3});
    for (let i = 0; i < 5; i++) { const a = i/5*Math.PI*2; mesh(G.cone, 0xf2c200, [.05, .14, .05], [Math.cos(a)*.17, .13, Math.sin(a)*.17], c.crown, {metalness:.7, roughness:.3}); }
    if (o.glow) { c.halo = new THREE.Mesh(new THREE.TorusGeometry(.3, .025, 6, 32), new THREE.MeshBasicMaterial({color:0x8fe8ff, toneMapped:false})); c.halo.rotation.x = Math.PI/2.2; c.halo.position.y = 2.42; g.add(c.halo); }
  }
  if (o.gun) c.gun = rifle(armR, o.scope);
  if (o.hero || o.rod) {
    // rod held out over the water, with a line and bobber hanging straight down
    c.rod = new THREE.Group(); c.rod.position.set(.36, 1.0, .25); c.rod.rotation.x = .9; c.rod.visible = false; g.add(c.rod);
    mesh(G.cyl, 0x6b4526, [.028, 2.2, .028], [0, 1.1, 0], c.rod);
    mesh(G.cyl, 0x3a2a1a, [.05, .3, .05], [0, .15, 0], c.rod);
    const tip = new THREE.Group(); tip.position.y = 2.2; tip.rotation.x = -.9; c.rod.add(tip);
    const line = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0xf4f4f4})); line.scale.set(.008, 2.35, .008); line.position.y = -1.18; tip.add(line);
    mesh(G.sph, 0xe03a2a, [.07, .07, .07], [0, -2.35, 0], tip); mesh(G.sph, 0xffffff, [.05, .04, .05], [0, -2.29, 0], tip);
  }
  if (!MOBILE) { const sh = new THREE.Mesh(G.plane, BLOB.mat); sh.rotation.x = -Math.PI/2; sh.position.y = .035; sh.scale.set(.95, .95, 1); sh.renderOrder = 1; g.add(sh); }
  Object.assign(c, {legL, legR, armL, armR});
  scene.add(g);
  return c;
}
const PADOBJ = {}, ENTS = [], CHARS = new WeakSet();
function entity(charOpts, x, z, speed, cap) {
  const e = {pos:new THREE.Vector3(x, 0, z), vel:new THREE.Vector3(), svel:new THREE.Vector3(), yaw:0, walk:0, speed, cap, tick:0,
    char:makeChar(charOpts)};
  ENTS.push(e); CHARS.add(e.char.g);
  e.stack = newStack((i, it, y) => {
    const s = Math.sin(e.yaw), c = Math.cos(e.yaw), lag = i * .03;
    return {x:e.pos.x - .42*s - e.svel.x*lag, y:1.0 + y + ITEM[it.type].h/2 + e.char.g.position.y, z:e.pos.z - .42*c - e.svel.z*lag, ry:e.yaw};
  });
  return e;
}
function animEntity(e, dt) {
  e.svel.lerp(e.vel, Math.min(1, dt*6));
  const sp = Math.hypot(e.vel.x, e.vel.z);
  if (sp > .1) {
    let d = Math.atan2(e.vel.x, e.vel.z) - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    e.yaw += d * Math.min(1, dt*12);
  }
  e.walk += dt * sp * 2.6;
  const k = Math.min(1, sp / 2.5), c = e.char;
  c.legL.rotation.x = Math.sin(e.walk) * .8 * k; c.legR.rotation.x = -Math.sin(e.walk) * .8 * k;
  const carrying = e.stack.length > 0;
  c.armL.rotation.x = carrying ? -.5 : -Math.sin(e.walk) * .7 * k; c.armR.rotation.x = carrying ? -.5 : Math.sin(e.walk) * .7 * k;
  c.bob = Math.abs(Math.sin(e.walk)) * .07 * k;
  c.g.position.set(e.pos.x, c.bob + elevAt(e.pos.x, e.pos.z) + (e.rideY || 0) + (e === player && IHW.open && e.pos.x > -49.4 && e.pos.x < -40.6 ? ihwH(e.pos.z) : 0), e.pos.z); c.g.rotation.y = e.yaw;
}
function collide(p, prev, fly) {
  const r = .38;
  if (!fly) for (const b of boxes) {
    if (p.x > b.x0 - r && p.x < b.x1 + r && p.z > b.z0 - r && p.z < b.z1 + r) {
      const dx0 = p.x - (b.x0 - r), dx1 = (b.x1 + r) - p.x, dz0 = p.z - (b.z0 - r), dz1 = (b.z1 + r) - p.z, m = Math.min(dx0, dx1, dz0, dz1);
      if (m === dx0) p.x = b.x0 - r; else if (m === dx1) p.x = b.x1 + r; else if (m === dz0) p.z = b.z0 - r; else p.z = b.z1 + r;
    }
  }
  if (!fly) for (const c of circles) {
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), min = c.r + r;
    if (d < min && d > 1e-4) { p.x = c.x + dx/d*min; p.z = c.z + dz/d*min; }
  }
  // stay on open ground: slide along the edge, or stop
  if (!inArea(p.x, p.z)) {
    if (inArea(p.x, prev.z)) p.z = prev.z;
    else if (inArea(prev.x, p.z)) p.x = prev.x;
    else { p.x = prev.x; p.z = prev.z; }
  }
}

