// ------------------------------------------------------------------ graphics: sky light, water, clouds, grass and life
const FX = {t:{value:0}, day:{value:1}}, ENVK = {v:1};
// the sky is reflected in metal, glass and water
{
  const envScene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(50, 32, 16), col = [], c = new THREE.Color(), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const h = p.getY(i) / 50;
    if (h > 0) c.setRGB(.32 + (1 - h)*.45, .55 + (1 - h)*.32, .95, THREE.SRGBColorSpace); else c.setRGB(.36, .42, .3, THREE.SRGBColorSpace);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  envScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide})));
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({color:new THREE.Color(5, 4.4, 3.6)}));
  sunBall.position.set(20, 38, 15); envScene.add(sunBall);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(envScene, .02).texture;
  if (TEX.sky) { TEX.sky.mapping = THREE.EquirectangularReflectionMapping; scene.environment = pm.fromEquirectangular(TEX.sky).texture; ENVK.v = .7; TEX.sky.dispose(); }
  pm.dispose();
  scene.environmentIntensity = .5;
  hemi.intensity = 1;
}
sun.shadow.radius = MOBILE ? 1 : 2.5; sun.shadow.normalBias = .02;
renderer.toneMappingExposure = 1.02;

// the river: rippling normals, foam along the banks and glints of sun
water.material = new THREE.MeshStandardMaterial({color:0xffffff, roughness:.17, metalness:.1}); water.material.defines = {NO_GRIME:''}; water.material.envMapIntensity = .55;
water.material.onBeforeCompile = sh => {
  sh.uniforms.uT = FX.t; sh.uniforms.uDay = FX.day;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;\nuniform float uT, uDay;')
    .replace('#include <color_fragment>', `#include <color_fragment>
      float edge = abs(vWP.x + 15.1)*.667;   // scaled so the 9-wide river reads like the old 6-wide one
      // a dark channel in the middle, teal shallows over sand at the banks; out at sea, deeper the further from the beach
      vec2 cq = vWP.xz; float wrapx = mod(cq.x + 480., 960.) - 480.;
      float rectD = max(max(-79.6 - cq.y, cq.y - 218.), max(cq.x - 240., -270. - cq.x));
      float islD = min(length(vec2(wrapx - 280., cq.y - 50.)) - 34., length(vec2(wrapx + 310., cq.y - 50.)) - 34.);
      float shoreD = min(rectD, islD); bool seaW = shoreD > -.5;   // the open sea: outside the continent and the islands
      float deep = seaW ? smoothstep(-.5, 16., shoreD) : 1. - smoothstep(.5, 2.7, edge);
      diffuseColor.rgb = mix(vec3(.24, .62, .62), vec3(.03, .2, .34), deep);
      float foam = seaW ? (1. - smoothstep(0., .9 + .35*sin((vWP.x + vWP.z)*.9 + uT*1.1), shoreD)) * (.6 + .4*sin((vWP.x - vWP.z)*2.7 - uT*1.6)) : smoothstep(2.35, 2.95, edge) * (.55 + .45 * sin(vWP.z * 2.7 + uT * 2.2 + sin(vWP.z * .7) * 2.));
      float streak = smoothstep(.93, 1., sin(vWP.z * 1.3 - uT * 3.1 + sin(vWP.x * 2.3) * 1.5)) * (1. - smoothstep(.5, 2.4, edge)) * .35;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.92, .96, 1.), clamp(foam * .5 + streak * .4, 0., 1.));`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { vec2 sq = vWP.xz; float sp = sin(sq.x*7.3 + uT*2.1 + sin(sq.y*1.7))*sin(sq.y*9.1 - uT*1.6 + sin(sq.x*2.3))*sin((sq.x - sq.y)*5.3 + uT*1.2);
        totalEmissiveRadiance += vec3(1., .95, .82) * pow(max(sp, 0.), 40.) * .8 * uDay; }`)
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec2 q = vWP.xz; float tt = uT;
      vec3 nW = normalize(vec3(sin(q.x * 2.1 + tt * 1.3) * .07 + sin(q.y * 1.3 - tt * 1.7 + q.x * .5) * .07 + sin((q.x + q.y) * 4.7 + tt * 2.6) * .03,
        1., cos(q.y * 1.9 - tt * 2.1) * .09 + sin(q.x * 3.3 - tt * 1.9 + q.y * .3) * .05 + sin(q.y * 6.1 + tt * 3.3) * .025));
      normal = normalize((viewMatrix * vec4(nW, 0.)).xyz);`)
    .replace('#include <opaque_fragment>', `{ // water seen from above is mostly its own colour; the sky shows only at grazing angles (Fresnel), plus a capped sun glint
        vec3 V = normalize(vViewPosition); float fr = .025 + .6*pow(1. - max(dot(normal, V), 0.), 5.);
        vec3 body = diffuseColor.rgb * (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse);
        outgoingLight = mix(body, vec3(.7, .82, .95)*(.35 + .65*uDay), fr) + min(reflectedLight.directSpecular*.3, vec3(.12)) + totalEmissiveRadiance; }
      #include <opaque_fragment>`);
};
ripples.forEach(r => { r.material.opacity = .22; });
if (self.SEA_MESH) self.SEA_MESH.material = water.material; for (const m of self.SEA_MORE || []) m.material = water.material;

// grass that sways in the wind, and wildflowers
{
  const N = MOBILE ? 900 : 2600, tuft = new THREE.ConeGeometry(.05, .22, 3); tuft.translate(0, .11, 0);
  const blades = new THREE.InstancedMesh(tuft, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.9}), N * 3);
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshStandardMaterial({color:0xffffff, roughness:.6}), N / 6 | 0);
  const o = new THREE.Object3D(), c = new THREE.Color();
  seed = 123; let k = 0, f = 0;
  for (let n = 0; n < N * 4 && k < N * 3; n++) {
    const x = -130 + rnd()*240, z = -70 + rnd()*210;
    if (x > -17.4 && x < -9.9) continue;                          // the river and its sand
    if (x > -10.6 && x < 33.6 && z > -31.2 && z < 62.2) continue;  // the camp
    for (let b = 0; b < 3 && k < N * 3; b++, k++) {
      o.position.set(x + (rnd() - .5)*.22, GY, z + (rnd() - .5)*.22); o.rotation.set((rnd() - .5)*.5, rnd()*6, (rnd() - .5)*.5); o.scale.setScalar(.7 + rnd()*.7);
      o.updateMatrix(); blades.setMatrixAt(k, o.matrix);
      blades.setColorAt(k, c.setHSL(.2 + rnd()*.08, .32 + rnd()*.18, .28 + rnd()*.14, THREE.SRGBColorSpace));
    }
    if (f < flowers.count && rnd() < .2) {
      o.position.set(x + .15, GY + .16, z); o.rotation.set(0, 0, 0); o.scale.setScalar(.8 + rnd()*.6); o.updateMatrix(); flowers.setMatrixAt(f, o.matrix);
      flowers.setColorAt(f++, c.set([0xffffff, 0xffe066, 0xff8fb8, 0xb78cff, 0xff6a5a][rnd()*5|0]));
    }
  }
  blades.count = k; flowers.count = f;
  blades.material.onBeforeCompile = sh => {
    sh.uniforms.uT = FX.t;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 ip = instanceMatrix * vec4(0., 0., 0., 1.);
        transformed.x += sin(uT * 2.1 + ip.x * .6 + ip.z * .4) * position.y * .55;
        transformed.z += cos(uT * 1.7 + ip.x * .3) * position.y * .3;`);
  };
  blades.receiveShadow = true; flowers.receiveShadow = true;
  scene.add(blades, flowers); FX.blades = blades; FX.flowers = flowers; FX.grass = grassPlane;
}

// clouds overhead: never seen, only their shadows drifting across the land
const clouds = [];
if (!MOBILE) {
  const cm = new THREE.MeshBasicMaterial({colorWrite:false, depthWrite:false});
  seed = 91;
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const m = new THREE.Mesh(G.sph, cm); m.scale.set(2 + rnd()*1.6, .8, 1.6 + rnd()*1.2);
      m.position.set((k - 2)*1.9 + rnd(), rnd()*.4, (rnd() - .5)*1.8); m.castShadow = true; g.add(m);
    }
    g.position.set(-50 + rnd()*100, 27 + rnd()*3, -40 + rnd()*80); scene.add(g); clouds.push(g);
  }
}
// a soft glow around every fire, brighter at night
const GLOW = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,190,110,1)'); r.addColorStop(.35, 'rgba(255,140,60,.45)'); r.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const glows = [];
function addGlows() {
  for (const l of fireLights) {
    if (l.glow) continue;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, toneMapped:false}));
    s.scale.setScalar(2.4); l.add(s); l.glow = s; glows.push(s);
  }
}
// fireflies over the meadows at night
const flies = (() => {
  const n = MOBILE ? 40 : 90, pos = new Float32Array(n*3), base = [];
  seed = 55;
  for (let i = 0; i < n; i++) { const x = -130 + rnd()*240, z = -70 + rnd()*220; if (x > -11 && x < 14 && z > -13 && z < 14) { i--; continue; } base.push([x, .4 + rnd()*1.2, z, rnd()*6]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:0xfff27a, size:.16, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false}));
  p.frustumCulled = false; scene.add(p); p.base = base; return p;
})();
// our flag: the Stars and Stripes on a soft cloth that ripples from the pole outward
const US_FLAG = (() => {
  const c = document.createElement('canvas'); c.width = 380; c.height = 200; const g = c.getContext('2d'), sh = c.height/13;
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i*sh, c.width, sh + 1); }
  const cw = c.width*.4, ch = sh*7; g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, cw, ch);
  g.fillStyle = '#ffffff';
  for (let r = 0; r < 9; r++) for (let k = 0; k < (r % 2 ? 5 : 6); k++) {
    const x = (k*2 + (r % 2 ? 2 : 1)) * cw/12, y = (r + 1) * ch/10, R5 = 4.4;
    g.beginPath(); for (let p = 0; p < 10; p++) { const a = -Math.PI/2 + p*Math.PI/5, rr = p % 2 ? R5*.42 : R5; g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); } g.fill();
  }
  // a little shading so the folds read
  const gr = g.createLinearGradient(0, 0, c.width, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i/6, i % 2 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.06)');
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({map:t, side:THREE.DoubleSide, roughness:.85});
  m.onBeforeCompile = sh2 => {
    sh2.uniforms.uT = FX.t;
    sh2.vertexShader = 'uniform float uT;\n' + sh2.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float flu = position.x + .5; objectNormal.x -= cos(position.x*7.0 - uT*5.5 + position.y*1.5) * .55 * flu;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fl = position.x + .5; transformed.z += sin(position.x*7.0 - uT*5.5 + position.y*1.5) * .09 * fl + sin(position.x*13.0 - uT*8.0) * .02 * fl;
        transformed.y -= fl*fl*.04;`);
  };
  m.customProgramCacheKey = () => 'usflag';
  return {mat:m, geo:new THREE.PlaneGeometry(1, 1, 20, 10)};
})();
function ourFlag(o) { if (!o || o.material === US_FLAG.mat) return o; o.geometry = US_FLAG.geo; o.material = US_FLAG.mat; o.scale.z = 1; o.castShadow = true; return o; }
// any flag that turns to our colours becomes the real thing (a thin yellow plate the size of a flag)
let flagScanT = 0;
function scanFlags(dt) {
  if ((flagScanT -= dt) > 0) return; flagScanT = 1;
  const gold = mat(0xf2c200);
  scene.traverse(o => { if (o.isMesh && o.material === gold && o.geometry === G.box && o.scale.z <= .04 && o.scale.y >= .3 && o.scale.x > o.scale.y*1.2) ourFlag(o); });
}
const FLOCKS = [];
function makeFlocks() {
  if (FLOCKS.length || !MODELS.animals) return;
  for (const [cx, cz, kind, n, r, h] of [[-13.6, -40, 'gull', 6, 9, 9], [-13.6, 45, 'gull', 5, 8, 8], [-45, -30, 'sparrow', 7, 6, 7], [45, 40, 'sparrow', 6, 7, 7], [-40, 50, 'sparrow', 5, 5, 6], [40, -40, 'gull', 5, 9, 10]]) {
    const birds = [];
    for (let i = 0; i < n; i++) { const b = beast(kind, kind === 'gull' ? .38 : .26); if (!b) return; scene.add(b); birds.push({g:b, ph:R()*6, off:i*.35 + R()*.2, rr:r + (R() - .5)*2.5, hh:h + R()*2}); }
    FLOCKS.push({cx, cz, birds, sp:.22 + R()*.08, dir:R() < .5 ? 1 : -1});
  }
}
function updFlocks(dt) {
  makeFlocks();
  for (const F of FLOCKS) for (const b of F.birds) {
    const a = time*F.sp*F.dir + b.off, x = F.cx + Math.cos(a)*b.rr, z = F.cz + Math.sin(a)*b.rr;
    b.g.position.set(x, b.hh + Math.sin(time*.9 + b.off*3)*.6, z); b.g.rotation.y = Math.atan2(-Math.sin(a)*F.dir, Math.cos(a)*F.dir); b.g.rotation.z = -.25*F.dir;
    // flap, then glide
    const flap = Math.sin(time*13 + b.off*5) * (Math.sin(time*.7 + b.off) > -.2 ? .75 : .08);
    const w = b.g.userData.wings; if (w && w.length === 2) { w[0].rotation.z = flap; w[1].rotation.z = -flap; }
  }
}
function updFx(dt, dk) {
  updFlocks(dt);
  scanFlags(dt);
  FX.t.value = time;
  const night = clamp((.5 - dk) * 2.4, 0, 1);
  scene.environmentIntensity = (.18 + .42*dk) * ENVK.v;
  for (const c of clouds) { c.position.x += dt * .9; if (c.position.x > 90) c.position.x = -120; }
  if (glows.length !== fireLights.length) addGlows();
  for (const s of glows) { s.material.opacity = .35 + night*.55 + Math.sin(time*13 + s.id)*.05; }
  flies.material.opacity = night * .95;
  if (night > 0) {
    const a = flies.geometry.attributes.position;
    flies.base.forEach(([x, y, z, ph], i) => a.setXYZ(i, x + Math.sin(time*.7 + ph)*.8, y + Math.sin(time*1.3 + ph*2)*.3, z + Math.cos(time*.6 + ph)*.8));
    a.needsUpdate = true;
  }
}


// ambient occlusion under buildings, rebuilt whenever something new is built
const AO = {n:-1, rect:null, round:null};
function updAO() {
  if (MOBILE || boxes.length + circles.length === AO.n) return;
  AO.n = boxes.length + circles.length;
  for (const k of ['rect', 'round']) if (AO[k]) { scene.remove(AO[k]); AO[k].dispose(); }
  const o = new THREE.Object3D();
  const big = boxes.filter(b => (b.x1 - b.x0) * (b.z1 - b.z0) < 140);
  AO.rect = new THREE.InstancedMesh(G.plane, BLOB.rect, Math.max(1, big.length));
  big.forEach((b, i) => { o.position.set((b.x0 + b.x1)/2, .022, (b.z0 + b.z1)/2); o.rotation.set(-Math.PI/2, 0, 0); o.scale.set((b.x1 - b.x0)*1.55 + .8, (b.z1 - b.z0)*1.55 + .8, 1); o.updateMatrix(); AO.rect.setMatrixAt(i, o.matrix); });
  AO.rect.count = big.length;
  AO.round = new THREE.InstancedMesh(G.plane, BLOB.round, Math.max(1, circles.length));
  circles.forEach((c, i) => { o.position.set(c.x, .022, c.z); o.rotation.set(-Math.PI/2, 0, 0); o.scale.set(c.r*3.2 + .4, c.r*3.2 + .4, 1); o.updateMatrix(); AO.round.setMatrixAt(i, o.matrix); });
  AO.round.count = circles.length;
  for (const k of ['rect', 'round']) { AO[k].renderOrder = 1; AO[k].frustumCulled = false; scene.add(AO[k]); }
}
// the sun swings across the sky: long golden shadows at dawn and dusk, blue moonlight at night
const SUNC = {noon:new THREE.Color(0xfff2dc), gold:new THREE.Color(0xffa860), moon:new THREE.Color(0x8aa8ff), skyD:new THREE.Color(0xdcefff), skyG:new THREE.Color(0xffd4b0), skyN:new THREE.Color(0x3a4a7a), tmp:new THREE.Color()};
const SNAP = {f:new THREE.Vector3(), r:new THREE.Vector3(), u:new THREE.Vector3(), d:new THREE.Vector3(), Y:new THREE.Vector3(0, 1, 0)};
function lightAt(fx, fz, dk) {
  const a = time / 240 * Math.PI * 2, az = 3.45 + Math.sin(a*.5) * .45, el = 6 + 11*dk;
  sun.position.set(fx + Math.cos(az)*13, el, fz + Math.sin(az)*13); sun.target.position.set(fx, 0, fz);
  // slide the shadow map in whole texels so shadow edges hold still as the camera follows you
  {
    const S = SNAP, tex = (sun.shadow.camera.right - sun.shadow.camera.left) / sun.shadow.mapSize.x;
    S.f.subVectors(sun.target.position, sun.position).normalize(); S.r.crossVectors(S.f, S.Y).normalize(); S.u.crossVectors(S.r, S.f);
    const r = sun.target.position.dot(S.r), u = sun.target.position.dot(S.u);
    S.d.copy(S.r).multiplyScalar(Math.round(r / tex)*tex - r).addScaledVector(S.u, Math.round(u / tex)*tex - u);
    sun.position.add(S.d); sun.target.position.add(S.d);
  }
  const gold = clamp((.78 - dk) * 2.6, 0, 1), moon = clamp((.32 - dk) * 3.4, 0, 1);
  sun.color.copy(SUNC.noon).lerp(SUNC.gold, gold * (1 - moon)).lerp(SUNC.moon, moon);
  hemi.color.copy(SUNC.skyD).lerp(SUNC.skyG, gold * .6 * (1 - moon)).lerp(SUNC.skyN, moon);
  return gold * (1 - moon);
}
