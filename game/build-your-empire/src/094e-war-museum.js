// ------------------------------------------------------------------ the war museum: captured banners and the medals you have earned
// A columned hall on the military grounds. The banner of every rival city you have taken hangs across its front, and
// standing at its door opens the medal case: ten feats of arms, each lit once you have done it.
const MUSEUM = {g:null, flags:[], at:[-1.5, 42.5], shown:''};
const med = () => W.flags.med ||= {};
const medal = (k, n = 1) => { med()[k] = (med()[k] || 0) + n; };
const MEDALS = [
  {k:'landWins', icon:'⚔️', n:'First Blood', d:'Win a battle on land', need:1, v:() => W.flags.landWins || 0},
  {k:'conquer', icon:'🏴', n:'Conqueror', d:'Take a rival city', need:1, v:() => W.flags.conqueredRivals || 0},
  {k:'liberate', icon:'🕊️', n:'Liberator', d:'Free an occupied city', need:1, v:() => med().liberate || 0},
  {k:'assault', icon:'🏰', n:'Siege Master', d:'Storm a walled city', need:1, v:() => med().assault || 0},
  {k:'sea', icon:'⚓', n:'Admiral', d:'Win a battle at sea', need:1, v:() => med().sea || 0},
  {k:'air', icon:'✈️', n:'Ace', d:'Win a battle from the air', need:1, v:() => med().air || 0},
  {k:'gen', icon:'🎖️', n:'Generalissimo', d:'Have five generals', need:5, v:() => generals().length},
  {k:'spy', icon:'🕵️', n:'Spymaster', d:'Three successful spy missions', need:3, v:() => med().spy || 0},
  {k:'pact', icon:'📜', n:'Diplomat', d:'Sign three treaties with envoys', need:3, v:() => med().pact || 0},
  {k:'world', icon:'🌍', n:'Emperor of the World', d:'Every rival joins your empire', need:1, v:() => W.flags.worldEmperor ? 1 : 0},
];
function museumFx(anim) {
  if (MUSEUM.g) return;
  const [x, z] = MUSEUM.at, g = MUSEUM.g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI/2; scene.add(g);   // its front to the road
  // a stone hall: steps, columns along the front, a pediment
  mesh(G.box, 0xd8d2c4, [6.4, .3, 4.2], [0, .15, 0], g); mesh(G.box, 0xe8e2d4, [5.6, 2.8, 3.2], [0, 1.7, -.3], g);
  for (let k = 0; k < 6; k++) mesh(G.cyl, 0xf2ece0, [.22, 2.8, .22], [-2.5 + k, 1.7, 1.55], g);
  mesh(G.box, 0xd8d2c4, [6, .35, 3.8], [0, 3.25, -.1], g);
  const ped = mesh(G.cone4, 0xc8c2b4, [4.6, 1, 2.8], [0, 3.9, -.1], g); ped.rotation.y = Math.PI/4; ped.scale.set(4.4, 1, 2.8);
  mesh(G.box, 0x5a3418, [1.1, 1.8, .1], [0, 1.2, 1.32], g);
  const sign = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({map:signTex('MUSEUM', '#3a2a1a', '#f2c200'), toneMapped:false})); sign.scale.set(2.8, .5, 1); sign.position.set(0, 3.25, 1.82); g.add(sign);
  boxes.push({x0:x - 2.2, x1:x + 2.2, z0:z - 3.2, z1:z + 3.2});
  MUSEUM.zone = addZone({kind:'museum', x, z:z + 5.1, icon:'🏛️', tile:{alpha:1, size:84, label:'Medals'}});
  if (anim) { popIn(g); banner('🏛️ The war museum!', 'Captured banners hang on its front. Step on its tile to see your medals.'); }
  MUSEUM.shown = '';
}
// a captured banner between each pair of columns for every rival city that is yours
function updMuseum(dt) {
  if (!MUSEUM.g || (MUSEUM.chk = (MUSEUM.chk || 0) - dt) > 0) return; MUSEUM.chk = 2;
  const taken = EMP.list.filter(r => es(r).owned).map(r => r.id), key = taken.join(',');
  if (key === MUSEUM.shown) return; MUSEUM.shown = key;
  for (const f of MUSEUM.flags) MUSEUM.g.remove(f); MUSEUM.flags = [];
  taken.slice(0, 5).forEach((id, k) => { const f = new THREE.Mesh(US_FLAG.geo, flagMat(RIVAL_FLAG[id])); f.scale.set(.85, 1.25, 1); f.rotation.z = -Math.PI/2; f.position.set(-2 + k, 2.55, 1.6); MUSEUM.g.add(f); MUSEUM.flags.push(f); });
}
function openMuseum() {
  const m = $('modal'); m.hidden = false; m.dataset.panel = 'museum';
  const got = MEDALS.filter(q => q.v() >= q.need).length;
  m.innerHTML = `<div class="card"><h1 style="font-size:24px">🏛️ The war museum</h1><p>${got} of ${MEDALS.length} medals. Captured banners: ${EMP.list.filter(r => es(r).owned).map(r => r.icon).join(' ') || 'none yet'}.</p>
    <div class="votes">${MEDALS.map(q => { const v = q.v(), ok = v >= q.need; return `<button ${ok ? '' : 'style="opacity:.45"'}><b>${ok ? q.icon : '🔒'} ${q.n}</b><small>${q.d}${q.need > 1 ? ` · ${Math.min(v, q.need)}/${q.need}` : ''}</small></button>`; }).join('')}</div>
    <button class="ghost" id="muClose">Close</button></div>`;
  $('muClose').onclick = () => { m.hidden = true; };
}
