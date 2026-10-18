// ------------------------------------------------------------------ helpers
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(1, 12, 9),   // round enough for fruit, heads and foliage, at half the triangles
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  cone: new THREE.ConeGeometry(1, 1, 12),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cap: new THREE.CapsuleGeometry(0.3, 0.42, 4, 10),
  plane: new THREE.PlaneGeometry(1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0),
};
const matCache = {};
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  return matCache[k] ||= Object.assign(new THREE.MeshStandardMaterial({color, roughness:.72, ...o}), {userData:{shared:true}});
}
// ------------------------------------------------------------------ real surfaces for buildings
// Anything put up while BLD.on (every unlock) gets a photo surface chosen from its colour and shape: wood planks,
// brick, plaster, stone or roof tiles. The photo is projected in world space from all three sides, so a long wall
// and a short post show the same size of plank or brick, and it only tints the colour the builder chose.
const BLD = {on:0, cache:{}};
const BLD_SIZE = {wood_planks:1.4, red_brick_03:1.6, plastered_wall_02:2.6, rock_face_03:2.4, roof_tiles_14:1.5};
function bldFamily(geo, color, s, o) {
  if (o && (o.transparent || o.emissive || (o.metalness || 0) > .35 || o.map)) return null;
  if (Math.max(Math.abs(s[0]), Math.abs(s[1]), Math.abs(s[2])) < .45) return null;      // small trims and details stay plain
  const h = {}; new THREE.Color(color).getHSL(h, THREE.SRGBColorSpace); const deg = h.h*360;
  if (h.l < .14 || (h.s > .78 && h.l > .3)) return null;                              // dark trim, bright paint and signs
  const roofy = geo === G.cone4 || geo === G.cone || geo === G.roof;
  if (roofy && h.l < .7 && (deg < 40 || deg > 330 || h.s < .2)) return 'roof_tiles_14';
  if (deg >= 14 && deg <= 48 && h.s >= .22 && h.l <= .58) return 'wood_planks';
  if ((deg < 14 || deg > 340) && h.s >= .3 && h.l >= .22 && h.l <= .56) return 'red_brick_03';
  if (h.s < .16 && h.l >= .3 && h.l < .64) return 'rock_face_03';
  if (h.l >= .64 && (h.s < .3 || (deg >= 25 && deg <= 65 && h.s < .6))) return 'plastered_wall_02';
  return null;
}
function bldMat(color, id, o) {
  const k = color + id + JSON.stringify(o || {});
  if (BLD.cache[k]) return BLD.cache[k];
  const T = TEX[id], m = new THREE.MeshStandardMaterial({color, roughness:id === 'plastered_wall_02' ? .92 : .85, ...o});
  m.onBeforeCompile = sh => {
    sh.uniforms.bldMap = {value:T.map}; sh.uniforms.bldAvg = {value:T.avg.clone()}; sh.uniforms.bldScale = {value:1/BLD_SIZE[id]};
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBldP; varying vec3 vBldN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  { vec4 bp = vec4(transformed, 1.0);\n  #ifdef USE_INSTANCING\n  bp = instanceMatrix * bp;\n  #endif\n  vBldP = (modelMatrix * bp).xyz; vBldN = normalize(mat3(modelMatrix) * objectNormal); }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D bldMap; uniform vec3 bldAvg; uniform float bldScale; varying vec3 vBldP; varying vec3 vBldN;')
      .replace('#include <map_fragment>', `#include <map_fragment>
  { vec3 bw = pow(abs(normalize(vBldN)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
    vec3 p = vBldP * bldScale;
    vec3 t = texture2D(bldMap, p.zy).rgb * bw.x + texture2D(bldMap, p.xz).rgb * bw.y + texture2D(bldMap, p.xy).rgb * bw.z;
    diffuseColor.rgb *= clamp(mix(vec3(1.0), t / max(bldAvg, vec3(0.04)), 0.85), 0.0, 2.2); }`);
  };
  m.customProgramCacheKey = () => 'bld';
  // textured from world position, so static batching (which bakes meshes into world space) draws it the same
  m.userData.bakeSafe = true; m.userData.bld = id;
  m.userData.shared = true; return BLD.cache[k] = m;
}
function mesh(geo, color, s, p, parent, o) {
  if (geo === G.ico || geo === G.cone4) o = {flatShading:true, ...o};
  const fam = BLD.on > 0 && !Array.isArray(color) && typeof color === 'number' && bldFamily(geo, color, s, o), id = fam && phOkBld(fam) ? fam : null;
  const m = new THREE.Mesh(geo, Array.isArray(color) ? color : id ? bldMat(color, id, o) : mat(color, o));
  m.scale.set(...s); m.position.set(...(p || [0, 0, 0]));
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
// a speckled, mottled texture that makes flat ground read as earth and stone
// a copy of a texture with its own repeat that shares the uploaded image: three's clone() marks the shared image as changed,
// which re-uploads it (with mipmaps) for every texture using it, and with dozens of tiled walls that froze the game for seconds
function texClone(t) { const v = t.source.version, c = t.clone(); t.source.version = v; return c; }
function groundTex(rep) {
  if (!groundTex.base) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#efefef'; g.fillRect(0, 0, 256, 256);
    let sd = 3; const r = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 60; i++) {
      const x = r()*256, y = r()*256, rad = 10 + r()*36, v = 205 + r()*50 | 0;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, `rgba(${v},${v},${v},.45)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad*2, rad*2);
      }
    }
    for (let i = 0; i < 2600; i++) { const v = 185 + r()*70 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(r()*256, r()*256, 1 + r()*2, 1 + r()*2); }
    const t = groundTex.base = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4;
  }
  const t = texClone(groundTex.base); t.repeat.set(...rep); return t;
}
const SLAB_TOPS = [];
// open building land: the camp's from the start, each region's when it opens
const LAND = {camp:[{x0:14.6, x1:30, z0:-22, z1:-1}, {x0:14.6, x1:30, z0:4.6, z1:26}, {x0:-9.4, x1:.4, z0:15.2, z1:28}, {x0:5.6, x1:14, z0:15.2, z1:28}, {x0:-5.2, x1:13.4, z0:-24, z1:-14.2}], open:new Set(), rects:[]};
const ZOOPARK = {x0:74, x1:120, z0:22, z1:50, path:{x0:78.6, x1:81.4, z0:3.2, z1:22.4}};
const WORLD = {w:960, cx0:-270, cx1:240, cz0:-79.6, cz1:218, islands:[{x:280, z:50, r:30}, {x:-310, z:50, r:30}],
  roads:[{x0:68.6, x1:232, z0:.4, z1:3.4}, {x0:-262, x1:-39, z0:10.6, z1:13.6}]};
const wrapX = x => ((x + WORLD.w/2) % WORLD.w + WORLD.w) % WORLD.w - WORLD.w/2;
const FOG = {cell:6, nx:160, nz:100, z0:-320, data:new Uint8Array(160*100), dirty:false, t:0, tex:null};
FOG.tex = new THREE.DataTexture(FOG.data, FOG.nx, FOG.nz, THREE.RedFormat); FOG.tex.magFilter = FOG.tex.minFilter = THREE.LinearFilter; FOG.tex.wrapS = THREE.RepeatWrapping; FOG.tex.needsUpdate = true;
function fogCell(x, z) { const i = Math.floor((wrapX(x) + 480) / FOG.cell), j = Math.floor((z - FOG.z0) / FOG.cell); return j < 0 || j >= FOG.nz ? -1 : ((i % FOG.nx) + FOG.nx) % FOG.nx + j*FOG.nx; }
function seen(x, z) { const k = fogCell(x, z); return k >= 0 && FOG.data[k] > 0; }
function reveal(x, z, r) {
  const c = FOG.cell, n = Math.ceil(r / c);
  for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
    if (Math.hypot(di, dj)*c > r) continue;
    const k = fogCell(x + di*c, z + dj*c); if (k >= 0 && !FOG.data[k]) { FOG.data[k] = 255; FOG.dirty = true; }
  }
}
function fogLoad() {
  const f = W.flags.fog;
  if (f) { const bin = atob(f); for (let k = 0; k < FOG.data.length; k++) FOG.data[k] = (bin.charCodeAt(k >> 3) >> (k & 7)) & 1 ? 255 : 0; }
  else for (let x = -150; x <= 116; x += 6) for (let z = -86; z <= 156; z += 6) reveal(x, z, 6);   // the home country is known from the start
  FOG.tex.needsUpdate = true;
}
function fogSave() {
  let bin = ''; for (let b = 0; b < FOG.data.length; b += 8) { let v = 0; for (let k = 0; k < 8; k++) if (FOG.data[b + k]) v |= 1 << k; bin += String.fromCharCode(v); }
  W.flags.fog = btoa(bin);
}
function updFog(dt) {
  if ((FOG.t -= dt) > 0) return; FOG.t = .25;
  if (!FOG.loaded) { FOG.loaded = true; fogLoad(); }
  reveal(player.pos.x, player.pos.z, TRIP.on && TRIP.g && TRIP.g.position.y > 3 ? 40 : 24);
  if (typeof WATCH !== 'undefined' && WATCH.on && W.camp) { const f = warFocus(); if (f) reveal(f[0], f[1], 20); }
  if (FOG.dirty) { FOG.dirty = false; FOG.tex.needsUpdate = true; fogSave(); }
}
const onIsland = (x, z, pad = 0) => WORLD.islands.some(I => Math.hypot(wrapX(x - I.x), z - I.z) < I.r + pad);
const phOkBld = id => TEX[id] && TEX[id].map && TEX[id].avg;
const phOk = id => TEX[id] && TEX[id].map && TEX[id].normalMap && TEX[id].roughnessMap && TEX[id].inv;
function phPick(color) {
  const h = {}; new THREE.Color(color).getHSL(h, THREE.SRGBColorSpace); const deg = h.h*360;
  if (h.l < .3) return null;                                          // asphalt and dark floors keep their own look
  if (h.s < .14) return h.l > .5 ? 'cobblestone_floor_01' : null;     // pale grey paving
  if (deg > 70 && deg < 160) return 'aerial_grass_rock';
  if (deg >= 12 && deg <= 70) return h.l > .64 ? 'coast_sand_01' : 'forrest_ground_01';
  return null;
}
function phDress(m, color, w, d, id, size = 4, contrast = .8) {
  id ||= phPick(color); if (!id || !phOk(id)) return m;
  const T = TEX[id], rep = t => { const c = texClone(t); c.repeat.set(Math.max(1, w/size), Math.max(1, d/size)); return c; };
  m.map = rep(T.map); m.normalMap = rep(T.normalMap); m.roughnessMap = rep(T.roughnessMap); m.normalScale.set(.85, .85);
  m.color.set(color).multiply(T.inv); m.roughness = 1; m.userData.inv = T.inv; m.needsUpdate = true;
  // pull the photo's contrast toward its own average, so tiles don't read as a repeating pattern
  const avg = T.avg.clone(), k = contrast.toFixed(2);
  m.onBeforeCompile = sh => { sh.uniforms.phAvg = {value:avg};
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 phAvg;').replace('#include <map_fragment>', `#include <map_fragment>\n  ${contrast < .6 ? 'diffuseColor.rgb = mix(diffuseColor.rgb, diffuse * texture2D(map, vMapUv * .37 + vec2(.31, .17)).rgb, .5);' : ''}\n  diffuseColor.rgb = mix(diffuse * phAvg, diffuseColor.rgb, ${k});`); };
  m.customProgramCacheKey = () => 'ph' + k; m.userData.bakeSafe = true;   // works on the mesh's own uvs, which batching keeps
  return m;
}   // every ground top, so rain can make them shine
// a raised slab of ground with darker sides, so the camp sits above the grass like a diorama
function slab(color, w, d, x, z, top = 0, h = .26) {
  const c = new THREE.Color(color), side = mat(c.clone().multiplyScalar(.72).getHex()), topM = phDress(new THREE.MeshStandardMaterial({color, roughness:.95, map:groundTex([Math.max(1, w/5), Math.max(1, d/5)])}), color, w, d); SLAB_TOPS.push(topM);
  const m = new THREE.Mesh(G.box, [side, side, topM, side, side, side]);
  m.scale.set(w, h, d); m.position.set(x, top - h/2, z); m.receiveShadow = true; m.castShadow = false;
  scene.add(m); return m;
}
function ground(color, w, d, x, z, y = 0.01) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshStandardMaterial({color, roughness:1}));
  if (color === 0xe8d49a) phDress(m.material, color, w, d, 'coast_sand_01', 5);    // the beaches and river sand
  m.rotation.x = -Math.PI/2; m.scale.set(w, d, 1); m.position.set(x, y, z); m.receiveShadow = true;
  scene.add(m); return m;
}
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

