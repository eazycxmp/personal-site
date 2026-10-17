// ------------------------------------------------------------------ items drawn in batches
// Every fish, log and loaf is its own mesh, so it can fly, stack and be carried. Drawn one by one that was hundreds
// of draw calls a frame (three for an outlined item: itself, its outline and its shadow). The item meshes now sit on a
// layer the camera skips; once a frame, just before drawing, each kind of item is drawn in one go from wherever its
// meshes are. Nothing about how items move changes.
const ITEMI = {all:new Set(), kinds:new Map(), far:95, on:true, LAYER:3};
function itemInst(m, key, outline) {
  m.userData.ik = key; m.userData.io = outline || null;
  m.layers.set(ITEMI.LAYER); if (outline) outline.layers.set(ITEMI.LAYER);
  ITEMI.all.add(m);
  m.addEventListener('added', () => ITEMI.all.add(m));          // back in the world after being set down elsewhere
}
function itemKind(key) {
  let k = ITEMI.kinds.get(key); if (k) return k;
  k = {key, cap:0, body:null, line:null, n:0, nl:0, outlined:false};
  ITEMI.kinds.set(key, k); itemGrow(k, 32); return k;
}
// room for more items of a kind: a bigger instanced mesh replaces the old one
function itemGrow(k, cap) {
  const mk = (mat, old) => {
    const im = new THREE.InstancedMesh(itemCache[k.key], mat, cap); im.count = 0; im.frustumCulled = false;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.userData.noBake = true;
    if (old) { im.instanceMatrix.array.set(old.instanceMatrix.array.subarray(0, old.instanceMatrix.array.length)); scene.remove(old); old.dispose(); }
    scene.add(im); return im;
  };
  k.body = mk(itemMat, k.body); k.body.castShadow = true;    // like the item meshes: they cast shadows but take none (no striping)
  if (k.outlined || k.line) k.line = mk(OUTLINE_MAT, k.line);
  k.cap = cap;
}
const ITEM_M4 = new THREE.Matrix4();
function drawItems() {
  scene.updateMatrixWorld();
  for (const k of ITEMI.kinds.values()) k.n = k.nl = 0;
  const cx = camera.position.x, cz = camera.position.z, F2 = ITEMI.far*ITEMI.far;
  for (const m of ITEMI.all) {
    // shown only if it and everything holding it is visible and it is in the world
    let p = m, shown = m.visible;
    while (p.parent) { p = p.parent; if (!p.visible) shown = false; }
    if (p !== scene) { if (!m.parent) ITEMI.all.delete(m); continue; }   // eaten, sold or binned (comes back if re-added)
    if (!shown) continue;
    const e = m.matrixWorld.elements, dx = e[12] - cx, dz = e[14] - cz;
    if (dx*dx + dz*dz > F2) continue;
    const k = itemKind(m.userData.ik), o = m.userData.io;
    if (o && !k.outlined) { k.outlined = true; itemGrow(k, k.cap); }
    if (k.n >= k.cap || (o && k.nl >= k.cap)) itemGrow(k, k.cap*2);
    k.body.setMatrixAt(k.n++, m.matrixWorld);
    if (o && o.visible) k.line.setMatrixAt(k.nl++, o.matrixWorld);
  }
  for (const k of ITEMI.kinds.values()) {
    k.body.count = k.n; k.body.instanceMatrix.needsUpdate = true; k.body.visible = k.n > 0;
    if (k.line) { k.line.count = k.nl; k.line.instanceMatrix.needsUpdate = true; k.line.visible = k.nl > 0; }
  }
}
// Hidden things (people past the draw distance, closed-up buildings, parked vehicles) skip the per-frame matrix update
// with everything under them: nothing reads a hidden object's world matrix, and the frame it shows again it is
// brought up to date before it is drawn (updateMatrix marks it dirty, and its children follow).
{
  const UMW = THREE.Object3D.prototype.updateMatrixWorld;
  THREE.Object3D.prototype.updateMatrixWorld = function (force) {
    if (!this.visible && this.parent) { if (force) this.matrixWorldNeedsUpdate = true; return; }
    return UMW.call(this, force);
  };
}
