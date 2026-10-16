// ------------------------------------------------------------------ the realistic people kit
const HAIR_PART = {short:'Short', buzz:'Buzz', sidepart:'Sidepart', afro:'Afro', long:'Long', bun:'Bun', ponytail:'Ponytail', bangs:'Bangs', mohawk:'Mohawk'};
function buildBodyReal(o, P) {
  const L = MODELS.people, {g, legL, legR, armL, armR} = P;
  const fem = o.top === 'dress' || ['long', 'bun', 'ponytail', 'bangs'].includes(o.hair);
  const skin = o.skin || 0xf1c9a5, top = o.body ?? 0x3f6fb5, top2 = o.body2 ?? shade(top, .8), pants = o.pants || 0x3b3b4a, hairC = o.hairCol ?? 0x2a1a10, shoe = o.shoe ?? 0x2a1d12;
  const add = (name, col, grp, opt) => { const src = L.getObjectByName(name); if (!src || !src.geometry) return null; const m = new THREE.Mesh(src.geometry, mat(col, opt)); m.position.copy(src.position); m.quaternion.copy(src.quaternion); m.scale.copy(src.scale); m.userData.real = true; grp.add(m); return m; };
  const addM = (...a) => { const m = mesh(...a); m.userData.real = true; return m; };
  const metal = o.metal ? {metalness:.6, roughness:.35} : undefined, dress = o.top === 'dress';
  // the body and the clothes on it
  add(fem ? 'pp_torsoF_top' : 'pp_torsoM_top', top, g, metal);
  if (!dress) { add(fem ? 'pp_hipsF_pants' : 'pp_hipsM_pants', pants, g); add('pp_belt_sole', o.trim ?? 0x2a1d12, g); }
  else add('pp_dress_top', top, g);
  if (o.belly) add('pp_belly_top', top, g, metal);
  if (o.top === 'shirt') add('pp_placket_top2', shade(top, .8), g);
  if (o.top === 'jacket') add('pp_jacket_top2', top2, g);
  if (o.top === 'suit') { add('pp_jacket_top2', 0x1e1e26, g); add('pp_placket_top2', 0xf4f4f4, g); add('pp_tie_lip', 0xb8322a, g); }
  if (o.top === 'stripes') add('pp_stripes_top2', top2, g);
  if (o.top === 'hawaii') add('pp_hawaii_top2', top2, g);
  if (o.top === 'hoodie' || o.hat === 'hood') add('pp_hoodie_top', o.hat === 'hood' ? (o.hatCol || top) : top, g);
  if (o.apron) add('pp_apron_top2', o.apron, g);
  add('pp_neck_skin', skin, g);
  // the head and face
  add('pp_head_skin', skin, g); add('pp_eyes_white', 0xf4f2ee, g); add('pp_iris_iris', 0x2a2018, g); add('pp_brows_hair', hairC, g); add('pp_mouth_lip', shade(skin, .62), g);
  // under a hat only longer hair shows (it hangs below the brim); otherwise the hat sits on a close crop
  const hatted = o.hat && o.hat !== 'hood', hs0 = o.hair ?? 'short', hs = hatted && !['long', 'ponytail', 'bun', 'bangs'].includes(hs0) ? 'buzz' : hs0;
  if (HAIR_PART[hs]) add('pp_hair' + HAIR_PART[hs] + '_hair', hairC, g);
  if (o.face === 'beard' || o.face === 'mustache' || o.face === 'goatee') add('pp_' + o.face + '_hair', hairC, g);
  if (o.acc === 'sunglasses') { for (const sx of [-1, 1]) addM(G.box, 0x111114, [.05, .026, .01], [sx*.042, 1.91, .122], g); addM(G.box, 0x111114, [.035, .008, .008], [0, 1.915, .122], g); }
  if (o.acc === 'glasses') for (const sx of [-1, 1]) { addM(G.box, 0x2a2a2e, [.05, .006, .006], [sx*.042, 1.925, .122], g); addM(G.box, 0x2a2a2e, [.05, .006, .006], [sx*.042, 1.898, .122], g); }
  if (o.acc === 'cap') { addM(G2.sph, top2, [.128, .07, .14], [0, 1.99, .005], g); addM(G.box, top2, [.13, .012, .09], [0, 1.965, .14], g); }
  if (o.acc === 'bucket') { addM(G2.flare, top2, [.14, .08, .14], [0, 2.0, 0], g); addM(G2.cyl, top2, [.18, .012, .18], [0, 1.96, 0], g); }
  if (o.acc === 'necklace') { const n = addM(G2.ring, 0xf2c200, [.06, .06, .06], [0, 1.64, .06], g, {metalness:.8, roughness:.25}); n.rotation.x = Math.PI/2.4; }
  if (o.acc === 'earrings') for (const sx of [-1, 1]) addM(G2.sphS, 0xf2c200, [.012, .012, .012], [sx*.118, 1.86, .01], g, {metalness:.8});
  // arms: sleeves, forearms and hands
  const bare = o.top === 'tank' || dress, long = ['hoodie', 'jacket', 'suit'].includes(o.top) || o.long;
  const sleeve = o.top === 'jacket' ? top2 : o.top === 'suit' ? 0x1e1e26 : top;
  for (const [k, arm] of [['L', armL], ['R', armR]]) {
    add(`pp_arm${k}Up_top`, bare ? skin : sleeve, arm, metal); add(`pp_arm${k}Fore_skin`, long ? sleeve : skin, arm); add(`pp_arm${k}Hand_skin`, skin, arm);
  }
  // legs: trousers, shorts or bare under a dress, and shoes
  for (const [k, leg] of [['L', legL], ['R', legR]]) {
    add(`pp_leg${k}Thigh_pants`, dress ? skin : pants, leg); add(`pp_leg${k}Shin_pants`, dress || o.shorts ? skin : pants, leg);
    add(`pp_leg${k}Shoe_shoe`, shoe, leg); add(`pp_leg${k}Sole_sole`, 0x1a120c, leg);
  }
}
// hats, helmets, armour, shields and weapons were made for the old figures (big head at 1.6, short limbs): move and
// resize them onto the realistic body
function remapKit(P) {
  const fix = (grp, f) => grp.children.forEach(m => { if (!m.userData.real) f(m); });
  fix(P.g, m => {
    const y = m.position.y;
    if (y > 1.4) { m.position.set(m.position.x*.5, 1.9 + (y - 1.6)*.62, m.position.z*.5); m.scale.multiplyScalar(.5); }
    else if (y > .6) { m.position.set(m.position.x*.8, 1.08 + (y - .65)*.88, m.position.z*.62); m.scale.set(m.scale.x*.8, m.scale.y*.9, m.scale.z*.62); }
    else { m.position.y *= 1.7; m.scale.y *= 1.6; }
  });
  for (const a of [P.armL, P.armR]) fix(a, m => { m.position.y *= 1.25; m.position.x *= .8; m.position.z *= .8; m.scale.set(m.scale.x*.75, m.scale.y*1.1, m.scale.z*.75); });
  for (const l of [P.legL, P.legR]) fix(l, m => { m.position.y *= 2; m.scale.y *= 1.6; });
}
