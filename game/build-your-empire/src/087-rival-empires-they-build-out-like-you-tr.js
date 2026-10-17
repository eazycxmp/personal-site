// ------------------------------------------------------------------ rival empires: they build out like you, trade, ally, declare war and besiege your castle
const EMP = {list:[
  {id:'ostberg', amb:.7, n:'Ostberg', icon:'🏰', land:true, sea:false, base:14, grow:1.1, temper:-60, start:-45, min:2, look:3, style:'austria', at:[2.5, 104.5], bf:[3, 88], via:'south'},
  {id:'azul', amb:.85, n:'Port Azul', icon:'⚓', land:true, sea:true, base:24, grow:1.2, temper:-10, start:0, min:3, look:2, style:'brazil', at:[120, -112], bf:[120, -72], via:'sea', coast:true},
  {id:'kumo', amb:.9, n:'Kumo', icon:'🏯', land:true, sea:false, base:26, grow:1.25, temper:10, start:15, min:5, look:4, style:'china', at:[-100, 12.1], bf:[-81, 6.7], via:'west'},
  {id:'nile', amb:1, n:'the Nile Kingdom', icon:'🐪', land:true, sea:false, base:34, grow:1.3, temper:-20, start:-5, min:5, look:3, style:'egypt', at:[150, 1.9], bf:[131, -3.5], via:'east'},
  {id:'aztlan', amb:1.05, n:'Aztlan', icon:'🌵', land:true, sea:false, base:38, grow:1.35, temper:-35, start:-20, min:5, look:3, style:'mexico', at:[-160, 12.1], bf:[-141, 6.7], via:'west'},
  {id:'hellas', amb:1.1, n:'Hellas', icon:'🏛️', land:true, sea:true, base:46, grow:1.4, temper:5, start:10, min:5, look:4, style:'greece', at:[195, 1.9], bf:[176, -3.5], via:'east'},
  {id:'rajpur', amb:1.2, n:'Rajpur', icon:'🐘', land:true, sea:true, base:56, grow:1.5, temper:0, start:5, min:5, look:4, style:'india', at:[280, 52], bf:[262, 46], via:'sea'},
  {id:'nordheim', amb:1.3, n:'the Sky Citadel', icon:'🛸', sky:true, land:true, sea:true, base:60, grow:1.6, temper:-40, start:-25, min:5, look:4, style:'norway', at:[-310, 52], bf:[-292, 46], via:'sea'}], tick:0, loaded:false, revoltCd:0, ostLv:-1};
function es(r) {
  const all = W.flags.emp ||= {};
  if (!all[r.id]) all[r.id] = {pow:r.base + .2*r.amb*(W.flags.peakPow || 0), seenPeak:W.flags.peakPow || 0, rel:r.id === 'ostberg' && W.rivalAlly ? 70 : r.start, stance:r.id === 'ostberg' && W.rivalAlly ? 'ally' : 'peace', atkT:300, owned:false};
  return all[r.id];
}
const TIERS = [[25, 'village'], [50, 'town'], [90, 'city'], [150, 'kingdom'], [1e9, 'empire']];
const tierOf = p => TIERS.find(t => p < t[0])[1];
const ostLevel = () => { const s = (W.flags.emp || {}).ostberg; return s ? Math.min(4, 1 + Math.floor((s.pow - 14) / 20)) : 0; };
const ostOurs = () => { const s = (W.flags.emp || {}).ostberg; return !!s && (s.owned || s.stance === 'ally'); };
function powerParts() {
  const troop = 1 + .25*(W.troop || 0), guns = W.unlocked.has('guns') ? 1.4 : 1;
  const sci = PADS.filter(p => p.sci && W.unlocked.has(p.id)).length*2 + (W.unlocked.has('labs') ? 6 : 0) + (W.unlocked.has('aiLab') ? 12 : 0);
  const allies = EMP.list.filter(r => W.flags.emp?.[r.id]?.stance === 'ally').reduce((a, r) => a + es(r).pow*.3, 0);
  return {army:Math.round(W.army*troop*guns), castle:[0, 6, 14, 24, 36][W.castle || 0], science:sci, air:planesBuilt()*6, navy:W.unlocked.has('warship') ? 6 : 0, allies:Math.round(allies)};
}
const myPower = () => Object.values(powerParts()).reduce((a, b) => a + b, 0);
// walls count twice when you are the one defending them
const defPower = () => myPower() + [0, 6, 14, 24, 36][W.castle || 0];
const giftCost = () => 500 + 400*W.era;
const peaceCost = r => Math.round(es(r).pow * 60);
function spend(c) { W.coins -= c; W.upSpent += c; }
