// ------------------------------------------------------------------ the port: a container yard, cargo ships and cruise liners
function cargoYard(anim) {
  clearForest({x0:-29, x1:-22, z0:-15, z1:-10});
  const g = new THREE.Group(); scene.add(g);
  slab(0x8a8f96, 4.4, 3.6, -25, -12.3, .005);
  const cols = [0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a, 0x8a3a8a, 0xf4f4f4];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 1 + ((i + j) % 3); k++)
    mesh(G.box, cols[(i*3 + j*5 + k) % cols.length], [.9, .5, .45], [-26.4 + i*1, .25 + k*.5, -12.6 + j*.6], g);
  // a gantry crane on the bank
  for (const z of [-13.6, -11]) mesh(G.box, 0xf2a21a, [.15, 3, .15], [-23.2, 1.5, z], g, {metalness:.4});
  mesh(G.box, 0xf2a21a, [.2, .2, 2.8], [-23.2, 3, -12.3], g, {metalness:.4}); const jib = mesh(G.box, 0xf2a21a, [4, .18, .25], [-21.6, 3.1, -12.3], g, {metalness:.4});
  if (anim) popIn(g);
}
function modernShip(g, kind) {
  if (kind === 'cargo') {
    steelHull(g, 6.4, 1.5, 0x2a3a5a, 0xf4f4f4, .45);
    const cols = [0xd9443a, 0x3f7cc0, 0xf2a21a, 0x3f9a6a, 0xf4f4f4];
    for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) mesh(G.box, cols[(i + k*2) % 5], [1.2, .38, .7], [0, .7 + k*.38, 1.9 - i*.72], g);
    mesh(G.box, 0xf4f4f4, [1.2, 1.2, .8], [0, 1.1, -2.2], g); mesh(G.box, 0x1a2a3a, [1.22, .2, .82], [0, 1.45, -2.2], g); mesh(G.cyl, 0x2a2a2e, [.16, .6, .16], [0, 1.9, -2.4], g);
  } else {
    steelHull(g, 7, 1.6, 0x1f3a7a, 0xf2c200, .5);
    for (let d = 0; d < 3; d++) { mesh(G.box, 0xf4f6f8, [1.3 - d*.15, .42, 4.6 - d*.9], [0, .8 + d*.42, -.2 - d*.15], g); for (let i = 0; i < 8 - d*2; i++) for (const sx of [-1, 1]) mesh(G.box, WIN, [.02, .12, .22], [sx*(.66 - d*.075), .82 + d*.42, -2.2 + d*.6 + i*.55], g); }
    mesh(G.cyl, 0x1f5fb8, [.25, .6, .25], [0, 2.3, -1.2], g); mesh(G.cyl, 0x1a1a1a, [.26, .1, .26], [0, 2.6, -1.2], g);
    mesh(G.box, 0x3a9ad0, [.6, .02, .9], [0, 2.04, .6], g);
  }
}

