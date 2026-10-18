// ------------------------------------------------------------------ ground: dirt, then cobblestones, gravel and a grand promenade
function groundCanvas(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  let sd = 17; const r = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  if (kind === 1) {
    // rounded cobbles in loose rows
    g.fillStyle = '#5e5850'; g.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 11; row++) for (let k = -1; k < 12; k++) {
      const x = k*24 + (row % 2)*12 + (r() - .5)*4, y = row*24 + (r() - .5)*4, w = 10 + r()*2, h = 9 + r()*2, v = r();
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        const gr = g.createRadialGradient(x + ox - 3, y + oy - 3, 1, x + ox, y + oy, w + 2);
        gr.addColorStop(0, `rgb(${178 + v*30 | 0},${168 + v*28 | 0},${150 + v*26 | 0})`); gr.addColorStop(1, `rgb(${120 + v*25 | 0},${112 + v*22 | 0},${100 + v*20 | 0})`);
        g.fillStyle = gr; g.beginPath(); g.ellipse(x + ox, y + oy, w, h, r()*.6, 0, Math.PI*2); g.fill();
      }
    }
  } else if (kind === 2) {
    // packed gravel: fine pebbles of many tones
    g.fillStyle = '#b8ae9a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5200; i++) {
      const v = r(), s = 1 + r()*3.2; g.fillStyle = `rgba(${150 + v*90 | 0},${142 + v*84 | 0},${124 + v*76 | 0},.9)`;
      g.beginPath(); g.ellipse(r()*256, r()*256, s, s*.75, r()*3, 0, Math.PI*2); g.fill();
    }
  } else {
    // a herringbone promenade in warm brick with pale stone bands
    g.fillStyle = '#d8cfc0'; g.fillRect(0, 0, 256, 256);
    const BW = 28, BH = 14;
    for (let i = -12; i < 24; i++) for (let j = -12; j < 24; j++) {
      const x = i*BW/2 + j*BH/2, y = j*BH/2 - i*BH/2 + i*BW/2*0, v = r();
      g.save(); g.translate(x*1.0, (i + j)*BH/2 + (i - j)*0);
      g.restore();
    }
    // large pale paving slabs, softly varied, with faint joints
    g.fillStyle = '#b9bcc4'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) { const v = r(); g.fillStyle = `rgb(${178 + v*16 | 0},${181 + v*16 | 0},${190 + v*14 | 0})`; g.fillRect(x + 2, y + 2, 60, 60); }
    g.fillStyle = 'rgba(90,96,110,.18)'; for (let k = 0; k < 256; k += 64) { g.fillRect(0, k, 256, 2); g.fillRect(k, 0, 2, 256); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r()*.07})`; g.fillRect(r()*256, r()*256, 2, 2); }
  }
  return c;
}
const GROUND_SIZE = [0, 5.5, 4, 6];
function pave(m) {
  const kind = Math.max(1, W.ground || 1);
  pave.base ||= {};
  if (!pave.base[kind]) { const t = pave.base[kind] = new THREE.CanvasTexture(groundCanvas(kind)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
  const t = texClone(pave.base[kind]); t.repeat.set(m.scale.x / GROUND_SIZE[kind], m.scale.z / GROUND_SIZE[kind]);
  const top = m.material[0]; if (top.map && top.map !== groundTex.base) top.map.dispose(); top.map = t; top.color.set(0xffffff); top.needsUpdate = true;
}
const PAVED = r => r !== REGIONS.farm && r !== REGIONS.airfield && r !== REGIONS.north && r !== REGIONS.ranch;
function groundStage(n, anim) {
  W.ground = n; W.flags.roads = true;
  player.speed = Math.max(player.speed, 7 + (n - 1)*.4);
  pave(campSlab);
  for (const r of Object.values(REGIONS)) if (r.slab && PAVED(r)) pave(r.slab);
  if (n === 3 && !groundStage.lamps) {
    // the promenade gets planters and lamp posts
    groundStage.lamps = true;
    for (const [x, z] of [[-1.2, -10.6], [5.4, -10.6], [12.6, -4], [12.6, 6.6], [-9.6, -4.6], [-9.6, 9.6], [2.8, 13.2], [12.4, 13.2]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      mesh(G.cyl, 0x2a2e36, [.05, 2.2, .05], [0, 1.1, 0], g, {metalness:.6}); mesh(G.box, 0x2a2e36, [.5, .04, .04], [.22, 2.18, 0], g, {metalness:.6});
      bulb(g, .44, 2.1, 0, 0xfff2c8, .09); lampMats.push(g.children[g.children.length - 1].material);
      mesh(G.box, 0x8a8f96, [.6, .35, .6], [0, .17, .9], g); mesh(G.sph, 0x4a9a3a, [.3, .25, .3], [0, .45, .9], g);
      if (anim) popIn(g);
    }
  }
  if (anim) banner(['', '🧱 Cobblestone streets!', '🪨 Gravel paths!', '✨ The grand promenade!'][n], 'Everyone in town walks faster on better ground.');
}

