// ------------------------------------------------------------------ levels are real rebuilds: a stall, a shop, a brick hall, then a flagship
const TIER_PAL = {
  food:{wall:0xf4e6c8, wall2:0xb8503a, roof:0xc8502a, trim:0x6a3a22, awn:0xd9443a, sign:'#d9443a', neon:'#ff4fb0', chimney:true},
  drink:{wall:0xead8b0, wall2:0x8a5a34, roof:0x5a3a22, trim:0x3a2410, awn:0x2f8a5a, sign:'#2f6a3a', neon:'#ffb02e', chimney:true},
  metal:{wall:0xb8b2a6, wall2:0x8a4a32, roof:0x4a4e56, trim:0x2a2e36, awn:0xf2a21a, sign:'#2a2e36', neon:'#5af0ff', chimney:true},
  sci:{wall:0xf4f0e6, wall2:0xd8d0c0, roof:0x3f6a9a, trim:0x2a3a5a, awn:0x3f7cc0, sign:'#1f4f8a', neon:'#5af0ff'},
  farm:{wall:0xc8402e, wall2:0xf4f0e6, roof:0x5a5048, trim:0xf4f0e6, awn:0x3f9a3a, sign:'#3f6a2a', neon:'#7af07a'}};
const TIER_NAME = ['', '', 'Market stall', 'Timber shop', 'Brick hall', 'Flagship'];
function tierBuild(g, theme, L, f, id) {
  const P = TIER_PAL[theme], part = (k, fb) => PART[k] || fb, M = (geo, c, s, p, o) => mesh(geo, c, s, p, g, o);
  const farm = theme === 'farm';
  // farms keep their crops: the buildings go up at one end
  const w = farm ? Math.min(2, f.w*.4) : f.w, d = farm ? Math.min(2.2, f.d) : f.d, cx = farm ? f.cx - f.w/2 + w/2 : f.cx, cz = f.cz;
  const sign = (txt, x, y, z, sw = 1.2) => { const s = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(txt, P.sign, '#ffffff'), toneMapped:false})); s.scale.set(sw, sw*.3, 1); s.position.set(x, y, z); g.add(s); return s; };
  const label = (ST[id]?.name || id).toUpperCase().slice(0, 12);
  if (L === 2) {
    // a market stall: posts, a peaked tent roof, a counter, lanterns and crates
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) M(G.cyl, P.trim, [.05, 1.9, .05], [cx + sx*w*.48, .95, cz + sz*d*.48]);
    M(part('tent', G.cone4), P.awn, [w*1.08, .7, d*1.08], [cx, 2.2, cz]);
    M(G.box, P.wall2, [w*.9, .55, .3], [cx, .3, cz + d*.42]);
    for (const sx of [-1, 1]) { M(part('lantern', G.box), 0x3a3a3e, [.16, .22, .16], [cx + sx*w*.48, 1.75, cz + d*.48]); A({o:bulb(g, cx + sx*w*.48, 1.72, cz + d*.48, 0xffc870, .06), k:'lamp'}); }
    M(part('barrel', G.cyl), 0x8a5a2b, [.32, .42, .32], [cx - w*.42, .21, cz - d*.3]);
    sign(label, cx, 1.9, cz + d*.5 + .02, Math.min(1.6, w*.7));
    return;
  }
  // a building fills the plot from tier 3 on
  const H1 = L === 3 ? 1.5 : 1.35, H2 = L >= 4 ? 1.15 : 0, top = H1 + H2;
  if (L === 3) {
    M(G.box, P.wall, [w*.92, H1, d*.92], [cx, H1/2, cz]);
    for (const sx of [-1, 1]) M(G.box, P.trim, [.1, H1, .1], [cx + sx*w*.46, H1/2, cz + d*.46]);
    M(part('gable', G.cone4), P.roof, [w*1.04, .8, d*1.04], [cx, H1 + .4, cz]);
    if (P.chimney) { const ch = M(part('chimney', G.box), 0x9a5a42, [.3, .9, .3], [cx + w*.28, H1 + .55, cz - d*.15]); A({o:ch, k:'smoke', y:.5}); }
    M(part('awning', G.box), P.awn, [w*.85, .45, .5], [cx, H1*.72, cz + d*.46 + .22]);
    for (const sx of [-.28, .28]) M(G.box, 0x2a3a4a, [w*.2, .45, .04], [cx + sx*w, H1*.42, cz + d*.46 + .01], {metalness:.4, roughness:.2});
    M(G.box, 0x4a2a14, [.38, .8, .05], [cx, .4, cz + d*.46 + .01]);
    sign(label, cx, H1 + .1, cz + d*.52 + .05, Math.min(1.5, w*.7));
    return;
  }
  if (L === 4) {
    // a two-storey brick hall: brick below, plaster above, a cornice and a parapet
    M(G.box, P.wall2, [w*.94, H1, d*.94], [cx, H1/2, cz]);
    M(G.box, P.wall, [w*.94, H2, d*.94], [cx, H1 + H2/2, cz]);
    M(G.box, P.trim, [w*.98, .1, d*.98], [cx, H1, cz]); M(G.box, P.trim, [w*.98, .14, d*.98], [cx, top + .05, cz]);
    for (let i = 0; i < 3; i++) for (const y of [H1*.5, H1 + H2*.5]) M(part('arch', G.box), 0x2a3a4a, [w*.18, .5, .03], [cx + (i - 1)*w*.3, y, cz + d*.47 + .02], {metalness:.4, roughness:.2});
    if (theme === 'sci') { M(part('dome', G.sph), 0x3f7a6a, [w*.6, .8, w*.6], [cx, top + .4, cz], {metalness:.5, roughness:.35}); for (const sx of [-1, 1]) M(part('column', G.cyl), 0xf8f4ec, [.22, H1, .22], [cx + sx*w*.3, H1/2, cz + d*.5 + .15]); }
    else if (theme === 'metal') for (const sx of [-1, 1]) { const st = M(G.cyl, 0x8a3a28, [.18, 2.4, .18], [cx + sx*w*.3, top + 1.2, cz - d*.2]); A({o:st, k:'smoke', y:1.25}); }
    else if (theme === 'drink') for (const sx of [-1, 1]) { M(G.cyl, 0xc87a3a, [.32, 1.6, .32], [cx + sx*w*.32, top + .8, cz - d*.25], {metalness:.7, roughness:.3}); M(part('dome', G.sph), 0xc87a3a, [.66, .3, .66], [cx + sx*w*.32, top + 1.65, cz - d*.25], {metalness:.7, roughness:.3}); }
    else if (farm) { for (let i = 0; i < 4; i++) { const h = new THREE.Mesh(new THREE.TorusGeometry(.6, .03, 4, 12, Math.PI), mat(0xdfe4ea)); h.position.set(f.cx + f.w*.1 + i*.6, 0, cz); h.rotation.y = Math.PI/2; g.add(h); } const cover = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 2, 12, 1, true, -Math.PI/2, Math.PI), mat(0xe8f4ff, {transparent:true, opacity:.35, roughness:.1})); cover.rotation.z = Math.PI/2; cover.position.set(f.cx + f.w*.1 + .9, 0, cz); g.add(cover); }
    else { M(part('awning', G.box), P.awn, [w*.9, .5, .55], [cx, H1*.8, cz + d*.47 + .25]); for (const sx of [-1, 1]) { M(G.cyl, 0x3a3a3e, [.02, .7, .02], [cx + sx*w*.3, .35, cz + d*.5 + .7]); M(part('tent', G.cone4), sx < 0 ? 0xf4f4f4 : P.awn, [.7, .25, .7], [cx + sx*w*.3, .75, cz + d*.5 + .7]); } }
    if (P.chimney && theme === 'food') { const ch = M(part('chimney', G.box), 0x7a3a2a, [.3, .9, .3], [cx - w*.3, top + .45, cz - d*.2]); A({o:ch, k:'smoke', y:.5}); }
    sign(label, cx, H1 + .02, cz + d*.5 + .05, Math.min(1.8, w*.8));
    return;
  }
  // tier 5: a glass-and-steel flagship with a rooftop and a neon sign
  const GL = new THREE.MeshStandardMaterial({color:0x8fc6e8, metalness:.6, roughness:.08, transparent:true, opacity:.55});
  const box = new THREE.Mesh(G.box, GL); box.scale.set(w*.94, top + .3, d*.94); box.position.set(cx, (top + .3)/2, cz); g.add(box);
  M(G.box, 0x2a2e36, [w*.6, top + .2, d*.6], [cx, (top + .2)/2, cz]);
  for (let i = 0; i <= 4; i++) for (const sz of [-1, 1]) M(G.box, 0xd8dce2, [.05, top + .3, .05], [cx - w*.47 + i*w*.235, (top + .3)/2, cz + sz*d*.47], {metalness:.7, roughness:.3});
  for (const y of [H1, top + .3]) M(G.box, 0xd8dce2, [w*.98, .08, d*.98], [cx, y, cz], {metalness:.7, roughness:.3});
  // the rooftop
  if (theme === 'metal' || theme === 'sci') for (let i = 0; i < 3; i++) M(G.box, 0x1e3a6a, [w*.25, .04, d*.5], [cx + (i - 1)*w*.28, top + .45, cz], {metalness:.5, roughness:.2}).rotation.x = -.4;
  else { M(G.box, 0x5aa83c, [w*.8, .08, d*.8], [cx, top + .36, cz]); for (const [sx, sz] of [[-1, -1], [1, 1], [1, -1]]) M(G.cone, 0x3f9a3a, [.22, .55, .22], [cx + sx*w*.28, top + .65, cz + sz*d*.25]); }
  const n = neon(g, label, P.neon, Math.min(2, w*.8)); n.position.set(cx, top - .1, cz + d*.48 + .03); A({o:n, k:'neon'});
  for (const [sx, sz] of [[-1, 1], [1, 1]]) A({o:bulb(g, cx + sx*w*.47, top + .3, cz + sz*d*.47, 0x5af0ff, .06), k:'blink', s:2});
}

