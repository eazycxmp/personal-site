// ------------------------------------------------------------------ every building level adds something you can see
const THEME = {library:'sci', grill:'food', spit:'food', oven:'food', oven2:'food', lodge:'farm', field:'farm', field2:'farm', field3:'farm',
  smelter:'metal', workshop:'metal', digger:'metal', smith:'metal', brewery:'drink'};
const ADDON_ANIM = [];
const glowMat = c => new THREE.MeshBasicMaterial({color:c, toneMapped:false});
const A = e => { e.id = addons.cur; ADDON_ANIM.push(e); };
function bulb(g, x, y, z, c, s = .06) { const b = new THREE.Mesh(G.sph, glowMat(c)); b.scale.setScalar(s); b.position.set(x, y, z); g.add(b); return b; }
function neon(g, text, fg, w = .9) {
  const p = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(text, '#14101a', fg), toneMapped:false})); p.scale.set(w, w*.31, 1); g.add(p); return p;
}
const KIT = {
  sci:[
    ['side', g => { mesh(G.cyl, 0x5e3f22, [.04, 1.6, .04], [0, .8, 0], g); mesh(G.box, 0x2f6fd0, [.5, .3, .02], [.26, 1.4, 0], g); }],
    ['top', g => { mesh(G.cyl, 0x3a3e44, [.05, .5, .05], [0, .25, 0], g); mesh(G.cyl, 0xd8dce2, [.09, .75, .09], [0, .6, .1], g, {metalness:.6}).rotation.x = .9; }],
    ['top', g => { mesh(G.cyl, 0x9aa0a8, [.03, .3, .03], [0, .15, 0], g); mesh(G.box, 0x1e3a6a, [.85, .04, .55], [0, .32, 0], g, {metalness:.5, roughness:.2}).rotation.x = -.5; }],
    ['top', g => {
      mesh(G.cyl, 0x9aa0a8, [.05, .45, .05], [0, .22, 0], g);
      const d = new THREE.Group(); d.position.y = .5; d.rotation.x = -.7; g.add(d);
      mesh(G.sph, 0xeef0f4, [.45, .14, .45], [0, 0, 0], d, {metalness:.3}); mesh(G.cyl, 0x5a5e66, [.02, .35, .02], [0, .17, 0], d);
      A({o:g, k:'spin', s:.35});
    }],
    ['top', g => {
      mesh(G.cyl, 0xb8bcc2, [.03, 1.8, .03], [0, .9, 0], g, {metalness:.6});
      for (const y of [.6, 1.1, 1.5]) mesh(G.box, 0xb8bcc2, [.5 - y*.2, .02, .02], [0, y, 0], g);
      A({o:bulb(g, 0, 1.83, 0, 0xff3030, .07), k:'blink'});
    }],
    ['side', g => {
      mesh(G.box, 0x2a2e36, [.5, 1.1, .4], [0, .55, 0], g, {metalness:.4});
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(G.box, glowMat([0x3aff9a, 0x3ac8ff][i % 2])); s.scale.set(.4, .04, .02); s.position.set(0, .3 + i*.2, .21); g.add(s); A({o:s, k:'flicker', ph:i}); }
    }],
    ['top', g => { mesh(G.cyl, 0x9aa0a8, [.06, .3, .06], [0, .15, 0], g); const r = new THREE.Group(); r.position.y = .36; g.add(r); mesh(G.box, 0xeef0f4, [.95, .22, .06], [0, .05, 0], r); A({o:r, k:'spin', s:2.2}); }],
    ['side', g => {
      const r = new THREE.Group(); g.add(r);
      mesh(G.box, 0xdfe4ea, [.4, .22, .5], [0, .25, 0], r);
      for (const x of [-.22, .22]) for (const z of [-.18, .18]) mesh(G.cyl, 0x2a2a2e, [.08, .06, .08], [x, .1, z], r).rotation.z = Math.PI/2;
      mesh(G.cyl, 0x9aa0a8, [.02, .35, .02], [.1, .55, 0], r); bulb(r, .1, .74, 0, 0x3ac8ff);
      A({o:r, k:'rove'});
    }],
    ['top', g => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.6, .05, 8, 32), glowMat(0x5af0ff)); ring.rotation.x = Math.PI/2; ring.position.y = 1.4; g.add(ring);
      const ring2 = new THREE.Mesh(ring.geometry, ring.material); ring2.rotation.x = Math.PI/2; ring2.scale.setScalar(.62); ring2.position.y = 1.75; g.add(ring2);
      const beam = new THREE.Mesh(G.cyl, new THREE.MeshBasicMaterial({color:0x5af0ff, transparent:true, opacity:.22, toneMapped:false, depthWrite:false})); beam.scale.set(.14, 2.6, .14); beam.position.y = 1.3; g.add(beam);
      const core = new THREE.Mesh(G.ico, glowMat(0xd8fdff)); core.scale.setScalar(.22); core.position.y = 1.58; g.add(core);
      A({o:ring, k:'tilt', s:1}); A({o:ring2, k:'tilt', s:-1.6}); A({o:core, k:'spinY', s:1.5});
    }],
  ],
  food:[
    ['side', g => { mesh(G.cyl, 0x3a3a3e, [.04, 1.4, .04], [0, .7, 0], g); mesh(G.box, 0x3a3a3e, [.2, .26, .2], [0, 1.45, 0], g); A({o:bulb(g, 0, 1.45, 0, 0xffc870, .08), k:'lamp'}); }],
    ['side', g => { for (const x of [-.45, .45]) mesh(G.cyl, 0x5e3f22, [.03, 1.3, .03], [x, .65, .35], g); for (let i = 0; i < 5; i++) mesh(G.box, i % 2 ? 0xf4f0e6 : 0xd9443a, [.2, .03, .6], [-.4 + i*.2, 1.25, .15], g).rotation.x = .35; }],
    ['top', g => { mesh(G.box, 0x9a4a32, [.32, .8, .32], [0, .4, 0], g); mesh(G.box, 0x6a3a28, [.38, .08, .38], [0, .82, 0], g); A({o:g, k:'smoke', y:.9}); }],
    ['side', g => { mesh(G.cyl, 0x5e3f22, [.04, 1.1, .04], [0, .55, 0], g); const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('EAT', '#6a3a1a', '#ffe8b0')})); s.scale.set(.7, .25, 1); s.position.set(0, 1, .03); g.add(s); }],
    ['side', g => { mesh(G.box, 0x7a4a2a, [.7, .25, .28], [0, .13, 0], g); for (let i = 0; i < 6; i++) { mesh(G.sph, [0xff6a8a, 0xffd84a, 0xffffff][i % 3], [.07, .07, .07], [-.28 + i*.11, .32, (i % 2 - .5)*.1], g); mesh(G.sph, 0x4a9a3a, [.06, .05, .06], [-.25 + i*.11, .27, 0], g); } }],
    ['top', g => { for (const x of [-.5, .5]) mesh(G.cyl, 0x3a3a3e, [.02, .5, .02], [x, .25, 0], g); for (let i = 0; i <= 8; i++) A({o:bulb(g, -.5 + i*.125, .5 - Math.sin(i/8*Math.PI)*.15, 0, [0xffd36b, 0xff9a5a, 0xfff2b0][i % 3], .04), k:'lamp'}); }],
    ['top', g => { mesh(G.cone, 0xc87a3a, [.35, .4, .35], [0, .2, 0], g, {metalness:.7, roughness:.3}); mesh(G.cyl, 0xc87a3a, [.1, .4, .1], [0, .55, 0], g, {metalness:.7, roughness:.3}); }],
    ['side', g => { mesh(G.box, 0x1a1a1e, [1, .38, .06], [0, 1.3, -.04], g); const n = neon(g, 'OPEN', '#ff4fb0'); n.position.set(0, 1.3, .0); A({o:n, k:'neon'}); for (const x of [-.4, .4]) mesh(G.cyl, 0x3a3a3e, [.03, 1.1, .03], [x, .55, -.05], g); }],
    ['top', g => { mesh(G.cyl, 0xe8e0cc, [.22, .3, .22], [0, .15, 0], g); const st = mesh(G.ico, 0xf2c200, [.25, .25, .25], [0, .55, 0], g, {metalness:.85, roughness:.2}); A({o:st, k:'spinY', s:1}); }],
  ],
  farm:[
    ['side', g => { mesh(G.cyl, 0x6b4526, [.04, 1.2, .04], [0, .6, 0], g); mesh(G.box, 0x6b4526, [.7, .04, .04], [0, .95, 0], g); mesh(G.box, 0x4a7ac0, [.3, .35, .16], [0, .85, 0], g); mesh(G.sph, 0xe8c48a, [.13, .13, .13], [0, 1.15, 0], g); mesh(G.cyl, 0xe0c070, [.22, .03, .22], [0, 1.26, 0], g); }],
    ['side', g => { for (const [x, y] of [[-.22, .18], [.22, .18], [0, .5]]) mesh(G.cyl, 0xe4bf55, [.2, .5, .2], [x, y, 0], g).rotation.z = Math.PI/2; }],
    ['side', g => { mesh(G.cyl, 0x7a5a3a, [.22, .55, .22], [0, .28, 0], g); mesh(G.cyl, 0x2b6f95, [.19, .02, .19], [0, .56, 0], g); for (const y of [.12, .42]) mesh(G.cyl, 0x3a3a3e, [.23, .03, .23], [0, y, 0], g); }],
    ['top', g => { mesh(G.cyl, 0x3a3a3e, [.02, .6, .02], [0, .3, 0], g); const v = new THREE.Group(); v.position.y = .6; g.add(v); mesh(G.box, 0x3a3a3e, [.5, .03, .03], [0, 0, 0], v); mesh(G.cone4, 0x3a3a3e, [.08, .14, .04], [.27, 0, 0], v).rotation.z = -Math.PI/2; A({o:v, k:'spinY', s:.3}); }],
    ['side', g => { mesh(G.cyl, 0x8a8f96, [.03, .5, .03], [0, .25, 0], g); mesh(G.cyl, 0x8a8f96, [.06, .06, .06], [0, .5, 0], g); A({o:g, k:'spray', y:.55}); }],
    ['side', g => {
      mesh(G.box, 0xc8302a, [.45, .3, .7], [0, .38, 0], g); mesh(G.box, 0xc8302a, [.35, .35, .3], [0, .65, -.15], g); mesh(G.box, 0x8fc6e8, [.36, .2, .02], [0, .68, .01], g);
      mesh(G.cyl, 0x2a2a2e, [.22, .14, .22], [.27, .22, -.18], g).rotation.z = Math.PI/2; mesh(G.cyl, 0x2a2a2e, [.22, .14, .22], [-.27, .22, -.18], g).rotation.z = Math.PI/2;
      mesh(G.cyl, 0x2a2a2e, [.13, .1, .13], [.25, .13, .22], g).rotation.z = Math.PI/2; mesh(G.cyl, 0x2a2a2e, [.13, .1, .13], [-.25, .13, .22], g).rotation.z = Math.PI/2;
      mesh(G.cyl, 0x2a2a2e, [.04, .25, .04], [.12, .75, .2], g);
    }],
    ['side', g => { mesh(G.cyl, 0xd8d4cc, [.38, 1.8, .38], [0, .9, 0], g, {metalness:.3}); mesh(G.sph, 0xc8302a, [.38, .25, .38], [0, 1.8, 0], g); for (const y of [.5, 1, 1.5]) mesh(G.cyl, 0xa8a49c, [.39, .03, .39], [0, y, 0], g); }],
    ['top', g => { mesh(G.cyl, 0x9aa0a8, [.03, .3, .03], [0, .15, 0], g); mesh(G.box, 0x1e3a6a, [.85, .04, .55], [0, .32, 0], g, {metalness:.5, roughness:.2}).rotation.x = -.5; }],
    ['top', g => {
      const d = new THREE.Group(); d.position.y = 1; g.add(d);
      mesh(G.box, 0x2a2e36, [.3, .08, .3], [0, 0, 0], d);
      for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) { const r = mesh(G.box, 0xdfe4ea, [.22, .01, .03], [x, .06, z], d); A({o:r, k:'spinY', s:30}); }
      bulb(d, 0, -.05, .16, 0x3aff9a, .03); A({o:d, k:'hover'});
    }],
  ],
  metal:[
    ['side', g => { for (const [x, y, s] of [[-.2, .2, .4], [.2, .2, .4], [0, .55, .32]]) mesh(G.box, 0x9a6b40, [s, s - .02, s], [x, y, 0], g); }],
    ['top', g => { mesh(G.cyl, 0x8a3a28, [.15, 1.1, .15], [0, .55, 0], g); mesh(G.cyl, 0x2a2a2e, [.18, .1, .18], [0, 1.1, 0], g); A({o:g, k:'smoke', y:1.2}); }],
    ['top', g => { mesh(G.cyl, 0x8a8f96, [.07, .8, .07], [0, .2, 0], g, {metalness:.7}).rotation.z = Math.PI/2; mesh(G.cyl, 0x8a8f96, [.07, .5, .07], [.4, .4, 0], g, {metalness:.7}); mesh(G.cyl, 0xc8302a, [.1, .06, .1], [.4, .66, 0], g); }],
    ['side', g => { mesh(G.cyl, 0xdfe4ea, [.35, .9, .35], [0, .45, 0], g, {metalness:.4, roughness:.3}); mesh(G.sph, 0xdfe4ea, [.35, .2, .35], [0, .9, 0], g, {metalness:.4, roughness:.3}); mesh(G.box, 0xf2c200, [.36, .08, .02], [0, .5, .35], g); }],
    ['top', g => { mesh(G.cyl, 0x3a3a3e, [.1, .15, .1], [0, .07, 0], g); const b = bulb(g, 0, .22, 0, 0xff9a1a, .12); A({o:b, k:'blink', s:4}); }],
    ['top', g => {
      mesh(G.box, 0xf2c200, [.12, 1.4, .12], [0, .7, 0], g);
      const j = new THREE.Group(); j.position.y = 1.4; g.add(j);
      mesh(G.box, 0xf2c200, [1.4, .1, .1], [.4, 0, 0], j); mesh(G.cyl, 0x2a2a2e, [.01, .6, .01], [1, -.3, 0], j); mesh(G.box, 0x3a3a3e, [.12, .1, .12], [1, -.6, 0], j);
      A({o:j, k:'spinY', s:.25});
    }],
    ['side', g => { mesh(G.box, 0x2a2a2e, [1, .1, .3], [0, .45, 0], g); for (const x of [-.4, .4]) mesh(G.box, 0x5a5e66, [.06, .45, .3], [x, .22, 0], g); for (let i = 0; i < 3; i++) { const b = mesh(G.box, 0x9aa0a8, [.14, .1, .14], [-.3 + i*.3, .55, 0], g, {metalness:.6}); A({o:b, k:'belt', ph:i}); } }],
    ['side', g => {
      mesh(G.cyl, 0xf2a21a, [.2, .2, .2], [0, .1, 0], g);
      const a1 = new THREE.Group(); a1.position.y = .2; g.add(a1); mesh(G.box, 0xf2a21a, [.1, .6, .1], [0, .3, 0], a1);
      const a2 = new THREE.Group(); a2.position.y = .6; a1.add(a2); mesh(G.box, 0xf2a21a, [.08, .5, .08], [0, .25, 0], a2); bulb(a2, 0, .52, 0, 0x3ac8ff, .05);
      A({o:a1, k:'arm', ph:0}); A({o:a2, k:'arm', ph:1.4});
    }],
    ['top', g => {
      const c = new THREE.Mesh(G.cyl, glowMat(0x5aff9a)); c.scale.set(.18, .7, .18); c.position.y = .5; g.add(c);
      for (const y of [.25, .5, .75]) mesh(G.cyl, 0x3a3e44, [.24, .05, .24], [0, y, 0], g, {metalness:.7});
      A({o:c, k:'pulse'});
    }],
  ],
  drink:[
    ['side', g => { for (const [x, y] of [[-.22, .2], [.22, .2], [0, .52]]) { mesh(G.cyl, 0x8a5a2b, [.2, .4, .2], [x, y, 0], g).rotation.z = Math.PI/2; mesh(G.cyl, 0x3a3a3e, [.21, .03, .21], [x, y, 0], g).rotation.z = Math.PI/2; } }],
    ['side', g => { mesh(G.cyl, 0xb8bcc2, [.2, .45, .2], [0, .23, 0], g, {metalness:.7, roughness:.25}); mesh(G.box, 0x3a3a3e, [.04, .1, .12], [0, .4, .2], g); }],
    ['side', g => { mesh(G.cyl, 0x5e3f22, [.04, 1.1, .04], [0, .55, 0], g); const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('ALE', '#3a2410', '#ffd36b')})); s.scale.set(.7, .25, 1); s.position.set(0, 1, .03); g.add(s); }],
    ['top', g => { mesh(G.cyl, 0xc87a3a, [.25, .4, .25], [0, .2, 0], g, {metalness:.7, roughness:.3}); mesh(G.cyl, 0xc87a3a, [.06, .5, .06], [0, .6, 0], g, {metalness:.7}); A({o:g, k:'smoke', y:.9}); }],
    ['top', g => { for (const x of [-.5, .5]) mesh(G.cyl, 0x3a3a3e, [.02, .5, .02], [x, .25, 0], g); for (let i = 0; i <= 8; i++) A({o:bulb(g, -.5 + i*.125, .5 - Math.sin(i/8*Math.PI)*.15, 0, [0xffd36b, 0xff9a5a, 0xfff2b0][i % 3], .04), k:'lamp'}); }],
    ['side', g => { mesh(G.cyl, 0x5e3f22, [.3, .05, .3], [0, .45, 0], g); mesh(G.cyl, 0x5e3f22, [.03, 1.2, .03], [0, .6, 0], g); mesh(G.cone, 0x2f8a5a, [.5, .3, .5], [0, 1.25, 0], g); }],
    ['side', g => { for (const x of [-.3, .3]) mesh(G.cyl, 0x6b4526, [.03, 1.3, .03], [x, .65, 0], g); for (let i = 0; i < 8; i++) mesh(G.sph, 0x4a9a3a, [.12, .14, .08], [-.3 + (i % 3)*.3, .3 + i*.13, 0], g); }],
    ['side', g => { mesh(G.box, 0x1a1a1e, [1, .38, .06], [0, 1.3, -.04], g); const n = neon(g, 'BEER', '#ffb02e'); n.position.set(0, 1.3, 0); A({o:n, k:'neon'}); for (const x of [-.4, .4]) mesh(G.cyl, 0x3a3a3e, [.03, 1.1, .03], [x, .55, -.05], g); }],
    ['top', g => { mesh(G.cyl, 0xe8e0cc, [.2, .25, .2], [0, .12, 0], g); const m = new THREE.Group(); m.position.y = .55; g.add(m); mesh(G.cyl, 0xf2c200, [.18, .35, .18], [0, 0, 0], m, {metalness:.85, roughness:.2}); mesh(G.sph, 0xfffbe8, [.19, .08, .19], [0, .18, 0], m); A({o:m, k:'spinY', s:.8}); }],
  ],
};
function addons(id) {
  const st = ST[id], b = st && st.body, theme = THEME[id]; if (!b || !theme) return;
  for (let i = ADDON_ANIM.length; i--;) if (ADDON_ANIM[i].id === id) ADDON_ANIM.splice(i, 1);
  if (b.userData.addG) { b.remove(b.userData.addG); b.userData.addG = null; }
  const L = lvl(id);
  if (id === 'library' && W.unlocked.has('labs') && MODELS.b2) { b.children.forEach(c => { if (c !== b.userData.addG) c.visible = true; }); return; }
  // measure the original building once, in its own units
  if (!b.userData.bb0) {
    const sc = b.scale.x || 1, bb = new THREE.Box3().setFromObject(b), p = b.position;
    const x0 = (bb.min.x - p.x)/sc, x1 = (bb.max.x - p.x)/sc, z0 = (bb.min.z - p.z)/sc, z1 = (bb.max.z - p.z)/sc;
    b.userData.bb0 = {cx:(x0 + x1)/2, cz:(z0 + z1)/2, w:clamp(x1 - x0, 1.6, 4.6), d:clamp(z1 - z0, 1.6, 4.6), top:(bb.max.y - p.y)/sc};
  }
  // from the shop on, the old structure is replaced by the new building (farms keep their crops)
  const keep = theme === 'farm' || L < 3;
  b.children.forEach(c => { if (c !== b.userData.addG) c.visible = keep; });
  if (L < 2) return;
  const g = new THREE.Group(); b.add(g); b.userData.addG = g;
  addons.cur = id;
  tierBuild(g, theme, L, b.userData.bb0, id);
}
let smokeAddT = 0;
function updAddons(dt, night) {
  const emit = (smokeAddT -= dt) <= 0; if (emit) smokeAddT = .45;
  for (const e of ADDON_ANIM) {
    const o = e.o;
    switch (e.k) {
      case 'spin': o.rotation.y += dt * e.s; break;
      case 'spinY': o.rotation.y += dt * e.s; break;
      case 'tilt': o.rotation.z += dt * e.s * .7; break;
      case 'blink': o.visible = Math.sin(time * (e.s || 3)) > 0; break;
      case 'flicker': o.visible = Math.sin(time * 7 + e.ph * 2.3) > -.6; break;
      case 'lamp': o.scale.setScalar((o.userData.s ||= o.scale.x) * (.8 + night*.6)); break;
      case 'neon': o.material.color.setScalar(.75 + night*.45 + (Math.sin(time*23) > .97 ? -.4 : 0)); break;
      case 'rove': o.position.x = Math.sin(time*.6) * .35; o.rotation.y = Math.cos(time*.6) > 0 ? Math.PI/2 : -Math.PI/2; break;
      case 'hover': o.position.y = 1 + Math.sin(time*2.2)*.12; o.position.x = Math.sin(time*.7)*.3; break;
      case 'arm': o.rotation.z = Math.sin(time*1.3 + e.ph) * .7; break;
      case 'belt': o.position.x = -.4 + ((time*.3 + e.ph/3) % 1) * .8; break;
      case 'pulse': o.scale.set(.18 + Math.sin(time*4)*.03, .7, .18 + Math.sin(time*4)*.03); break;
      case 'smoke': if (emit && o.parent) { const w = o.getWorldPosition(new THREE.Vector3()); w.y += e.y; particle(0xd8d8d8, w, new THREE.Vector3(.2, .9, -.1), 1.8, .14, {grow:.3, op:.35}); } break;
      case 'spray': if (R() < dt*20 && o.parent) { const w = o.getWorldPosition(new THREE.Vector3()); w.y += e.y; const a = R()*Math.PI*2; particle(0xcfefff, w, new THREE.Vector3(Math.cos(a)*1.4, 1.2, Math.sin(a)*1.4), .5, .04, {grav:1}); } break;
    }
  }
}

