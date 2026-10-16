// ------------------------------------------------------------------ seasons and weather
const SEASONS = [
  {n:'Spring', icon:'🌸', farm:1.1, leaf:[0x4f9a3e, 0x74b25a], grass:[1, 1.05, .95], ground:0x648a3e},
  {n:'Summer', icon:'☀️', farm:1.3, leaf:[0x2f6e2c, 0x4a8a3a], grass:[1, 1, 1], ground:0x5f7a38},
  {n:'Autumn', icon:'🍂', farm:1.5, leaf:[0xc0662a, 0xd49a34], grass:[1.25, .95, .55], ground:0x857a3e},
  {n:'Winter', icon:'❄️', farm:.6, leaf:[0xdfe8ee, 0xf4f8fa], grass:[1.7, 1.75, 1.85], ground:0xdfe6ea},
];
const YEAR = 480;
const seasonIdx = () => Math.floor((W.playT % YEAR) / (YEAR/4));
const seasonFarm = () => SEASONS[seasonIdx()].farm * (W.weather === 'rain' ? 1.2 : 1);
const WX = {t:15, cur:new THREE.Color(), tmp:new THREE.Color()};
const precip = (() => {
  const n = MOBILE ? 500 : 1400, pos = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { pos[i*3] = (R() - .5)*44; pos[i*3 + 1] = R()*18; pos[i*3 + 2] = (R() - .5)*44; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:0xcfe4ff, size:.09, transparent:true, opacity:0, depthWrite:false}));
  p.frustumCulled = false; scene.add(p); return p;
})();
function updSeasons(dt) {
  const si = seasonIdx(), S = SEASONS[si], k = Math.min(1, dt*.5);
  if (W.lastSeason !== si) {
    if (W.lastSeason != null && started) banner(`${S.icon} ${S.n}`, ['Blossoms everywhere. Floods can come with the spring rains.', 'Long days: the farms grow fast.', 'Harvest time! Fields grow fastest of the year.', 'Snow falls. Farms slow down until spring.'][si]);
    W.lastSeason = si;
  }
  FOREST.meshes[1].material.color.lerp(WX.tmp.set(S.leaf[0]), k); FOREST.meshes[2].material.color.lerp(WX.tmp.set(S.leaf[1]), k);
  if (FX.blades) FX.blades.material.color.lerp(WX.tmp.setRGB(...S.grass), k);
  if (FX.grass) FX.grass.material.color.lerp(WX.tmp.set(S.ground).multiply(FX.grass.material.userData.inv || WX.one || (WX.one = new THREE.Color(1, 1, 1))), k);
  if (FX.flowers) FX.flowers.visible = si < 2;
  // the weather turns every half minute or so
  if ((WX.t -= dt) <= 0) {
    WX.t = 25 + R()*30;
    const was = W.weather;
    W.weather = si === 3 ? (R() < .6 ? 'snow' : 'clear') : (R() < [.4, .15, .35][si] ? 'rain' : 'clear');
    if (was !== W.weather && W.weather !== 'clear' && started) popText(W.weather === 'snow' ? '❄️ Snow' : '🌧️ Rain: crops grow faster', player.pos.clone().setY(3.2), '#e0f0ff');
  }
  const snow = W.weather === 'snow', on = W.weather !== 'clear';
  precip.material.opacity += ((on ? (snow ? .9 : .55) : 0) - precip.material.opacity) * k;
  precip.material.size = snow ? .32 : .12; precip.material.color.set(snow ? 0xffffff : 0xa8c8ff);
  if (precip.material.opacity > .01) {
    const a = precip.geometry.attributes.position, fall = snow ? 2.2 : 16, cx = player.pos.x, cz = player.pos.z;
    for (let i = 0; i < a.count; i++) {
      let y = a.getY(i) - fall*dt; if (y < 0) y += 18;
      a.setY(i, y); if (snow) a.setX(i, a.getX(i) + Math.sin(time + i)*dt*.4);
    }
    a.needsUpdate = true; precip.position.set(cx, 0, cz);
  }
  sun.intensity *= on ? .7 : 1;
  if ((si === 0 || si === 2) && !on && R() < dt*6) particle(si === 0 ? [0xffb8d0, 0xffffff][R()*2|0] : [0xd9772a, 0xe8b23a, 0xb8442e][R()*3|0], new THREE.Vector3(player.pos.x + (R() - .5)*18, 5, player.pos.z + (R() - .5)*18), new THREE.Vector3(.8 + R(), -.7, (R() - .5)*.6), 6, .06);
}

