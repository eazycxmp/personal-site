// ------------------------------------------------------------------ models: CC0 kits by Kenney (kenney.nl) and our own Blender-built parts, loaded before the world is built.
// Anything that fails to load falls back to the shapes built in code.
const MODELS = {}, PART = {}, TEX = {};
const PH_IDS = ['aerial_grass_rock', 'forrest_ground_01', 'coast_sand_01', 'cobblestone_floor_01', 'red_brick_03', 'plastered_wall_02', 'roof_tiles_14', 'rock_face_03', 'wood_planks'];
function texAvg(img) {
  // the average colour of a photo, in linear light, so a tint can bring it to any target colour
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 16, 16);
  const d = g.getImageData(0, 0, 16, 16).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
  const n = d.length/4; return new THREE.Color().setRGB(r/n/255, gg/n/255, b/n/255, THREE.SRGBColorSpace);
}
await (async () => {
  const L = new GLTFLoader(), list = {
    shipL:'pirate/ship-large.glb', shipM:'pirate/ship-medium.glb', shipP:'pirate/ship-pirate-large.glb', shipS:'pirate/ship-small.glb', palm:'pirate/palm-straight.glb',
    ram:'castle/siege-ram.glb', siegeTower:'castle/siege-tower.glb', catapult:'castle/siege-catapult.glb',
    pineA:'nature/tree_pineRoundA.glb', pineC:'nature/tree_pineRoundC.glb', pineE:'nature/tree_pineRoundE.glb', pineF:'nature/tree_pineRoundF.glb', treeD:'nature/tree_default.glb', rockA:'nature/rock_largeA.glb',
    parts:'parts.glb', airliner2:'airliner2.glb', airliner4:'airliner4.glb', amph:'venue/venue_amph.glb', bowl:'venue/venue_bowl.glb', roof:'venue/venue_roof.glb', kaiju:'kaiju.glb', tank:'tank.glb', fighter:'fighter.glb', styles:'styles.glb', spacekit:'spacekit.glb', animals:'animals.glb', car:'car.glb', b2:'buildings2.glb', aqua:'aquarium.glb', road:'roadkit.glb', castles:'castles.glb', trees:'trees2.glb', speedboat:'speedboat.glb', styles2:'styles2.glb', hero:'hero.glb', dragon:'dragon.glb', props3:'props3.glb', people:'people.glb', qn_male:'qn_male.glb', regt:'regt_soldier.glb', qo_male_peasant:'qo_male_peasant.glb', qo_female_peasant:'qo_female_peasant.glb', qo_male_ranger:'qo_male_ranger.glb', qo_female_ranger:'qo_female_ranger.glb', qn_female:'qn_female.glb', qn_anims:'qn_anims.glb'};
  const TL = new THREE.TextureLoader(), texJobs = PH_IDS.flatMap(id => ['diff', 'nor_gl', 'rough'].map(k => TL.loadAsync(`./tex/${id}_${k}_1k.jpg`).then(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (k === 'diff') t.colorSpace = THREE.SRGBColorSpace;
    const T = TEX[id] ||= {}; T[{diff:'map', nor_gl:'normalMap', rough:'roughnessMap'}[k]] = t;
    if (k === 'diff') { T.avg = texAvg(t.image); T.inv = new THREE.Color(1/Math.max(.02, T.avg.r), 1/Math.max(.02, T.avg.g), 1/Math.max(.02, T.avg.b)); }
  }).catch(() => {})));
  texJobs.push(new HDRLoader().loadAsync('./tex/kloofendal_48d_partly_cloudy_puresky_1k.hdr').then(h => { TEX.sky = h; }).catch(() => {}));
  const all = Promise.all([...texJobs, ...Object.entries(list).map(([k, u]) => L.loadAsync('./models/' + u).then(g => {
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    MODELS[k] = g.scene; if (g.animations && g.animations.length) g.scene.userData.anims = g.animations;
  }).catch(() => {}))]);
  await Promise.race([all, new Promise(r => setTimeout(r, 9000))]);
  // the Blender parts become unit-sized geometries, sized and coloured like any built-in shape
  if (MODELS.parts) MODELS.parts.traverse(o => {
    if (!o.isMesh) return;
    o.updateWorldMatrix(true, false);
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    if (o.name === 'shoe' || o.name === 'head') g.rotateY(Math.PI);
    g.computeBoundingBox(); const b = g.boundingBox, c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    g.translate(-c.x, -c.y, -c.z); g.scale(1/(s.x || 1), 1/(s.y || 1), 1/(s.z || 1)); g.computeVertexNormals();
    PART[o.name] = g;
  });
  if (MODELS.trees) { for (const k of ['pineR', 'spruceR', 'oakR']) { const o = MODELS.trees.getObjectByName((matchMedia('(pointer: coarse)').matches || innerWidth < 700) && k === 'oakR' ? 'oakL' : k); if (o) MODELS[k] = o; } const l = MODELS.trees.getObjectByName('oakL'); if (l) MODELS.oakL = l; }
})();
const MODEL_BB = {};
// a copy of a model, scaled so its size along one axis is `size`, standing on its base and centred
function model(k, size, axis = 'z') {
  const src = MODELS[k]; if (!src) return null;
  const bb = MODEL_BB[k] ||= new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3()), s = size / sz[axis];
  const m = src.clone(true), g = new THREE.Group();
  m.position.set(-(bb.min.x + bb.max.x)/2, -bb.min.y, -(bb.min.z + bb.max.z)/2); g.add(m); g.scale.setScalar(s);
  return g;
}

