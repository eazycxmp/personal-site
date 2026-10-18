// ------------------------------------------------------------------ weapons: swords, then bows and arrows, muskets, rifles and semi-automatic rifles
// Military technology you buy, separate from the soldiers' outfits: every tier re-arms the whole army, changes how it
// fights (archers and riflemen hold the line and shoot; semi-automatics fire in bursts) and makes it stronger.
const WEAPONS = [{n:'Swords', icon:'🗡️'}, {n:'Bows and arrows', icon:'🏹'}, {n:'Muskets', icon:'🔫'}, {n:'Rifles', icon:'🎯'}, {n:'Semi-automatic rifles', icon:'💥'}];
const wepLvl = () => W.unlocked.has('semiAuto') ? 4 : W.unlocked.has('rifles') ? 3 : W.unlocked.has('guns') ? 2 : W.unlocked.has('bows') ? 1 : 0;
// army strength, how many soldiers a campaign needs, and power against monsters, by weapon
const WEP_POW = [1, 1.15, 1.4, 1.6, 1.85], WEP_NEED = [1, .92, .8, .74, .68], WEP_BOSS = [1, 1.15, 1.5, 1.7, 1.9];
// the outfit of the age with the weapon you have bought
function armed(o) {
  const w = wepLvl(); if (!w) return o;
  const a = {...o, sword:false, axe:false};
  return w === 1 ? {...a, gun:false, bow:true} : {...a, bow:false, gun:true, scope:o.scope || w >= 3, auto:w >= 4};
}
// a longbow in the left hand: a curved stave and its string
function bowProp(arm) {
  const g = new THREE.Group(); g.position.set(0, -.55, .06); arm.add(g);
  const b = new THREE.Mesh(new THREE.TorusGeometry(.34, .02, 4, 16, Math.PI), mat(0x6b4526)); b.rotation.set(0, Math.PI/2, Math.PI/2); g.add(b);
  mesh(G.box, 0xe8e0c8, [.008, .68, .008], [0, 0, 0], g);
  return g;
}
// a magazine under the rifle for the semi-automatic
function magazine(gun) { if (gun) mesh(G.box, 0x111114, [.045, .16, .07], [0, -.12, .06], gun); }
function weaponStage(n, anim) {
  troopStage(W.troop || 0, false);
  if (anim) { const W0 = WEAPONS[n]; banner(`${W0.icon} ${W0.n}!`, n === 1 ? 'Your soldiers shoot arrows from the line before the armies close.' : n === 3 ? 'Faster, longer shots: your riflemen thin the enemy before they reach you.' : 'Bursts of fire: your army is stronger than ever.'); }
}
