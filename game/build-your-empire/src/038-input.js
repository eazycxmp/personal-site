// ------------------------------------------------------------------ input
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
const joy = {on:false, ox:0, oy:0, x:0, y:0, id:null};
addEventListener('blur', () => { for (const k in keys) keys[k] = false; joy.on = false; joy.x = joy.y = 0; $('joy').style.display = 'none'; });
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('button') || !$('overlay').hidden) return;
  const r = stage.getBoundingClientRect();
  joy.on = true; joy.id = e.pointerId; joy.ox = e.clientX - r.left; joy.oy = e.clientY - r.top; joy.x = joy.y = 0; joy.t0 = performance.now(); joy.moved = 0;
  const j = $('joy'); j.style.display = 'block'; j.style.left = joy.ox + 'px'; j.style.top = joy.oy + 'px'; $('knob').style.transform = '';
  renderer.domElement.focus({preventScroll:true});
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
});
stage.addEventListener('pointermove', e => {
  if (!joy.on || e.pointerId !== joy.id) return;
  const r = stage.getBoundingClientRect();
  let dx = e.clientX - r.left - joy.ox, dy = e.clientY - r.top - joy.oy;
  const d = Math.hypot(dx, dy), max = 45;
  joy.moved = Math.max(joy.moved || 0, d);
  if (d > max) { dx *= max/d; dy *= max/d; }
  joy.x = dx / max; joy.y = dy / max;
  $('knob').style.transform = `translate(${dx}px,${dy}px)`;
});
const endJoy = e => { if (e.pointerId !== joy.id) return; if (joy.on && performance.now() - joy.t0 < 300 && (joy.moved || 0) < 8) tapAt(joy.ox, joy.oy); joy.on = false; joy.x = joy.y = 0; $('joy').style.display = 'none'; };
stage.addEventListener('pointerup', endJoy); stage.addEventListener('pointercancel', endJoy);

