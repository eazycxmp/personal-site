// ------------------------------------------------------------------ photo mode: hide the HUD, orbit the camera, save a picture
const PHOTO = {on:false, yaw:CAM_YAW, pitch:.85, dist:22};
function togglePhoto(on) {
  PHOTO.on = on; stage.classList.toggle('photo', on); $('photoBar').hidden = !on;
  if (on) { PHOTO.yaw = CAM_YAW; PHOTO.pitch = .85; PHOTO.dist = 22; }
}
function photoCamera(dt, fx, fz) {
  const sx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x, sy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joy.y;
  PHOTO.yaw -= sx*dt*1.4; PHOTO.pitch = clamp(PHOTO.pitch + sy*dt*.8, .18, 1.35);
  const h = Math.sin(PHOTO.pitch)*PHOTO.dist, r = Math.cos(PHOTO.pitch)*PHOTO.dist;
  camera.position.set(fx + Math.sin(PHOTO.yaw)*r, h, fz + Math.cos(PHOTO.yaw)*r); camera.lookAt(fx, 1, fz);
}
function savePhoto() {
  renderFinal(0); const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = 'my-empire.png'; a.click();
  snd(1200, .05, 'square', .04);
}

