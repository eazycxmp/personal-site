// ------------------------------------------------------------------ zones (dashed tiles)
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x+r, y); g.arcTo(x+w, y, x+w, y+h, r); g.arcTo(x+w, y+h, x, y+h, r); g.arcTo(x, y+h, x, y, r); g.arcTo(x, y, x+w, y, r); g.closePath(); }
function tileCanvas(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return {c, g, t};
}
const EMO = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const NUMF = '900 54px ui-rounded,"Trebuchet MS",sans-serif';
function drawTile(g, icon, opt = {}) {
  g.clearRect(0, 0, 256, 256);
  if (opt.dashed) {
    roundRect(g, 18, 18, 220, 220, 28); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill();
    g.setLineDash([26, 16]); g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke(); g.setLineDash([]);
  } else if (!opt.slate) {
    roundRect(g, 16, 16, 224, 224, 34); g.fillStyle = opt.fill ? opt.fill.replace(/[\d.]+\)$/, '.55)') : 'rgba(44,40,40,.52)'; g.fill();
    g.setLineDash([30, 18]); g.lineWidth = 10; g.lineCap = 'round'; roundRect(g, 18, 18, 220, 220, 32); g.strokeStyle = 'rgba(255,255,255,.92)'; g.stroke(); g.setLineDash([]);
  } else {
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
    roundRect(g, 14, 14, 228, 228, 30);
    const gr = g.createLinearGradient(0, 14, 0, 242); gr.addColorStop(0, opt.fill ? opt.fill : 'rgba(92,98,110,.93)'); gr.addColorStop(1, opt.fill ? opt.fill : 'rgba(60,64,74,.93)');
    g.fillStyle = gr; g.fill(); g.restore();
    roundRect(g, 20, 20, 216, 216, 25); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.16)'; g.stroke();
  }
  if (opt.prog) {
    g.save(); roundRect(g, 14, 14, 228, 228, 30); g.clip();
    g.fillStyle = 'rgba(80,205,100,.62)'; g.fillRect(14, 242 - 228*opt.prog, 228, 228*opt.prog); g.restore();
  }
  // corner brackets (only on the old slate tiles)
  g.strokeStyle = opt.stroke || 'rgba(255,255,255,.96)'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
  const L = 56, A = 24, B = 232;
  if (opt.slate || opt.dashed) for (const [x, y, dx, dy] of [[A, A, 1, 1], [B, A, -1, 1], [A, B, 1, -1], [B, B, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y + dy*L); g.lineTo(x, y + dy*14); g.quadraticCurveTo(x, y, x + dx*14, y); g.lineTo(x + dx*L, y); g.stroke();
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // turn the icon and text to face the diagonal camera; the tile itself stays square to the ground
  g.save(); g.translate(128, 128); g.rotate(-CAM_YAW); g.translate(-128, -128);
  if (opt.cost != null) {
    if (opt.title) {
      g.font = '900 54px ui-rounded,"Trebuchet MS",sans-serif'; g.lineWidth = 9; g.strokeStyle = 'rgba(20,24,36,.85)'; g.fillStyle = '#b8f59a';
      g.strokeText(opt.title, 128, 94); g.fillText(opt.title, 128, 94);
    } else { g.font = `88px ${EMO}`; g.fillText(icon, 128, 94); }
    // the price sits in a white pill, like a coin tag
    g.font = NUMF; const tw = g.measureText(String(opt.cost)).width, iw = 46, pw = iw + 14 + tw + 30, x0 = 128 - pw/2;
    g.save(); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 6; g.shadowOffsetY = 3; roundRect(g, x0, 152, pw, 66, 33); g.fillStyle = '#ffffff'; g.fill(); g.restore();
    g.font = `40px ${EMO}`; g.fillText(opt.cur, x0 + 16 + iw/2, 186);
    g.font = NUMF; g.fillStyle = '#2a2e36'; g.fillText(String(opt.cost), x0 + 16 + iw + 10 + tw/2, 188);
  } else {
    g.globalAlpha = opt.alpha ?? .95; g.font = `${opt.size || 104}px ${EMO}`; g.fillText(icon, 128, opt.label ? 105 : 130); g.globalAlpha = 1;
    if (opt.label) {
      g.font = '900 34px ui-rounded,"Trebuchet MS",sans-serif'; g.lineWidth = 8; g.strokeStyle = 'rgba(20,24,36,.85)'; g.fillStyle = '#fff';
      g.strokeText(opt.label, 128, 196); g.fillText(opt.label, 128, 196);
    }
  }
  g.restore();
}
const zones = [];
function addZone(o) {
  const z = {w:1.9, d:1.9, active:true, ...o};
  z.tc = tileCanvas(g => drawTile(g, z.icon, z.tile));
  z.mesh = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:z.tc.t, transparent:true, depthWrite:false, toneMapped:false}));
  z.mesh.rotation.x = -Math.PI/2; z.mesh.scale.set(z.w, z.d, 1); z.mesh.position.set(z.x, .05, z.z); z.mesh.renderOrder = 1;
  scene.add(z.mesh); zones.push(z);
  return z;
}
function removeZone(z) { scene.remove(z.mesh); z.tc.t.dispose(); zones.splice(zones.indexOf(z), 1); }
const zoneAt = (x, z) => { const hit = zones.filter(zn => zn.active && Math.abs(x - zn.x) < zn.w/2 && Math.abs(z - zn.z) < zn.d/2); return hit.find(z => z.kind === 'repair' || z.kind === 'rebuild') || hit[0]; };

