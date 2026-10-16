// ------------------------------------------------------------------ fishing pose
function poseRod(e, on, dt) {
  const r = e.char.rod; if (!r) return;
  r.visible = on;
  if (!on) return;
  if (Math.hypot(e.vel.x, e.vel.z) < .1) {   // face the river while fishing
    let d = -Math.PI/2 - e.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); e.yaw += d * Math.min(1, dt*8); e.char.g.rotation.y = e.yaw;
  }
  e.rodJerk = Math.max(0, (e.rodJerk || 0) - dt);
  r.rotation.x = .9 + Math.sin(time*2.2 + e.pos.z)*.06 - e.rodJerk*1.2;
  e.char.armR.rotation.x = -1.15 - e.rodJerk*.8; e.char.armL.rotation.x = -.9;
}

