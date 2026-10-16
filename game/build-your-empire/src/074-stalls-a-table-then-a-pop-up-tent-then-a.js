// ------------------------------------------------------------------ stalls: a table, then a pop-up tent, then a proper store
const STALL = {
  main:{at:[4, 1], w:2, d:6, alongZ:true, sign:'STORE', groups:null},
  hall:{at:[52, 7], w:6, d:2.4, alongZ:false, sign:'MARKET', groups:null},
};
const STALL_FX = [{serve:1, max:0, mult:1}, {serve:1.4, max:3, mult:1.2}, {serve:2, max:6, mult:1.5}];
function stallStage(id, n, anim) {
  const S = STALL[id], L = LINES[id]; if (!L) return;
  L.baseMult ??= L.mult; L.baseMax ??= L.max;
  const F = STALL_FX[n]; L.mult = L.baseMult * F.mult; L.max = L.baseMax + F.max; L.serve = F.serve;
  if (S.g) { scene.remove(S.g); const i = FADERS.findIndex(f => f.g === S.g); if (i >= 0) FADERS.splice(i, 1); }
  const [cx, cz] = S.at, hw = S.w/2, hd = S.d/2, g = S.g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
  const corners = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
  if (n === 1) {
    // a striped pop-up tent with bunting lights
    for (const [x, z] of corners) mesh(G.cyl, 0xdfe4ea, [.05, 2.3, .05], [x, 1.15, z], g, {metalness:.5});
    const stripes = 8;
    for (let i = 0; i < stripes; i++) {
      const t = -1 + (i + .5)*2/stripes, sz = S.alongZ ? [S.w + .3, .06, S.d/stripes] : [S.w/stripes, .06, S.d + .3];
      mesh(G.box, i % 2 ? 0xf4f0e6 : 0xd9443a, sz, S.alongZ ? [0, 2.35, t*hd] : [t*hw, 2.35, 0], g);
    }
    for (let i = 0; i <= 10; i++) { const t = -1 + i/5; bulb(g, S.alongZ ? hw + .1 : t*hw, 2.2 - Math.abs(Math.sin(i))*.1, S.alongZ ? t*hd : hd + .1, [0xffd36b, 0xff9a5a, 0xfff2b0][i % 3], .05); }
  } else if (n === 2) {
    // a proper store: pillars, a roof, a lit sign, shelves of goods
    for (const [x, z] of corners) mesh(G.box, 0x3a3e44, [.16, 2.6, .16], [x, 1.3, z], g, {metalness:.5});
    mesh(G.box, 0xeef1f4, [S.w + .5, .22, S.d + .5], [0, 2.7, 0], g); mesh(G.box, 0x1f5fb8, [S.w + .52, .14, S.d + .52], [0, 2.52, 0], g);
    const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex(S.sign, '#1f5fb8', '#ffffff'), toneMapped:false}));
    sign.scale.set(1.6, .45, 1); if (S.alongZ) { sign.rotation.y = Math.PI/2; sign.position.set(hw + .27, 3.05, 0); } else sign.position.set(0, 3.05, hd + .27); g.add(sign);
    mesh(G.box, 0x1f5fb8, S.alongZ ? [.06, .5, 1.8] : [1.8, .5, .06], S.alongZ ? [hw + .25, 3.05, 0] : [0, 3.05, hd + .25], g);
    for (const e of [-1, 1]) {
      const sx = S.alongZ ? 0 : e*(hw + .1), sz = S.alongZ ? e*(hd + .1) : 0;
      mesh(G.box, 0x8a5a2b, S.alongZ ? [1.6, 1.4, .3] : [.3, 1.4, 1.6], [sx, .7, sz], g);
      for (let k = 0; k < 6; k++) mesh(G.box, [0xd9443a, 0xf2c200, 0x3f9a6a, 0x3f7cc0][k % 4], [.18, .2, .18], [sx + (S.alongZ ? -.55 + (k % 3)*.55 : 0), .55 + Math.floor(k / 3)*.45, sz + (S.alongZ ? 0 : -.55 + (k % 3)*.55)], g);
    }
    for (let i = 0; i < 12; i++) { const t = -1 + i/5.5; bulb(g, S.alongZ ? hw + .28 : t*(hw + .2), 2.45, S.alongZ ? t*(hd + .2) : hd + .28, 0xfff2c8, .04); }
  }
  for (const [x, z] of corners) circles.push({x:cx + x, z:cz + z, r:.14});
  if (n === 2) fader(g, S.w + .5, 3);
  if (anim) { popIn(g); banner(n === 1 ? '⛺ Pop-up tent!' : '🏪 A proper store!', `Serves ${F.serve}× faster, room for ${F.max} more in line, and ${Math.round((F.mult - 1)*100)}% more per meal.`); }
}

