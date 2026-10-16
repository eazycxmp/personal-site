// ------------------------------------------------------------------ the hero dresses the part: villager, merchant, noble, king, tycoon, then galactic emperor
const HERO_STAGES = [
  {era:0, n:'Villager', o:{body:0xd23c2c, trim:0xf3eadb, hat:'fur', pants:0x4a3a2a}},
  {era:2, n:'Merchant', o:{body:0x2f8a7a, body2:0xf2c200, top:'shirt', trim:0xf2c200, hat:'beanie', hatCol:0x8a3a8a, pants:0x5a4030}},
  {era:4, n:'Noble', o:{body:0xf4ecd8, body2:0x2d4fa8, top:'jacket', trim:0xf2c200, hat:'feather', hatCol:0x1e2a5a, pants:0xf4ecd8, shoe:0x1a1a1e, cape:0xb8322a, noPack:true}},
  {era:6, n:'King', o:{body:0x6a2a8a, trim:0xf2c200, pants:0x3a1e4a, shoe:0x1a1a1e, cape:0xb8322a, capeIn:0xf4f4f4, fur:true, chain:true, noPack:true, crown:true}},
  {era:8, n:'Tycoon', o:{body:0xf4f4f4, top:'suit', pants:0x1e1e26, shoe:0x111114, hat:'tophat', acc:'sunglasses', chain:true, watch:true, noPack:true}},
  {era:10, n:'Galactic emperor', o:{body:0xeef0f4, trim:0xf2c200, metal:true, pants:0xd8dce2, shoe:0xd8dce2, cape:0x1f2a6a, capeIn:0xf2c200, chain:true, noPack:true, crown:true, glow:true}}];
const HERO = {i:0, t:0};
const heroStage = () => HERO_STAGES.reduce((k, s, i) => W.era >= s.era ? i : k, 0);
function swapHero(i, anim) {
  HERO.i = i;
  const S = HERO_STAGES[i], old = player.char, c = makeChar({hero:true, stage:i, ...S.o});
  c.g.position.copy(old.g.position); c.g.rotation.copy(old.g.rotation);
  if (typeof mountG !== 'undefined' && mountG && mountG.parent === old.g) { old.g.remove(mountG); c.g.add(mountG); }
  scene.remove(old.g); player.char = c;
  if (anim) {
    puff(player.pos.x, player.pos.z);
    for (let k = 0; k < 24; k++) particle([0xffd84a, 0xffffff, 0xff9ec0][k % 3], player.pos.clone().setY(1.2), new THREE.Vector3((R() - .5)*4, 2 + R()*3, (R() - .5)*4), 1, .08, {grav:1});
    banner(`✨ You dress as a ${S.n}!`, ['', 'A merchant\'s colours for a growing town.', 'A noble\'s jacket, feathered hat and cape.', 'Robes, ermine and the crown of a king.', 'A white suit, a top hat and a gold watch: business is booming.', 'White and gold armour and a halo crown: ruler of the stars.'][i]);
    [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => snd(f, .18, 'triangle', .05), k*110));
  }
}
function updHero(dt) {
  if (player.char.halo) player.char.halo.rotation.y += dt*1.5;
  if ((HERO.t -= dt) > 0) return; HERO.t = 1;
  const i = heroStage(); if (i !== HERO.i) swapHero(i, started);
}

