// ------------------------------------------------------------------ the beach: palms along the sand
if (MODELS.palm) for (const x of [-116, -107, -100, -82, -17, -5.5, 12.5, 60, 64, 80.5, 86]) {
  const p = model('palm', 3 + (Math.abs(x*7) % 10)/10, 'y'); p.position.set(x, -.2, -58.9 - (Math.abs(x*3) % 7)/10); p.rotation.y = x; scene.add(p);
}

