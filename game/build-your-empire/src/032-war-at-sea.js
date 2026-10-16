// ------------------------------------------------------------------ war at sea
const pirates = [];
const ballMat = new THREE.MeshBasicMaterial({color:0x15151a});
let seaFireT = 0;
function skullTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#16141a'; g.fillRect(0, 0, 128, 128); g.font = `84px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☠️', 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let skull = null;
function makePirate(x, z) {
  const g = new THREE.Group(); scene.add(g);
  galleon(g, SHIPS.pirate());
  g.position.set(x, -.26, z);
  return {g, x, z, sink:0};
}
function addCrew(b) {
  if (b.crew && b.crewTier !== (W.troop || 0)) { b.g.remove(b.crew); b.crew = null; }
  if (!b.crew) {
    b.crew = new THREE.Group(); b.g.add(b.crew); b.crewTier = W.troop || 0;
    for (const [x, z] of [[-.35, -.9], [.35, -.3], [-.35, .4], [.35, 1]]) {
      const c = makeChar(ARMS()); c.g.scale.setScalar(.6); c.g.position.set(x, .5, z); b.crew.add(c.g);
    }
  }
  b.crew.visible = true;
}
function fleet() { return boats.filter(b => b.inFleet); }
