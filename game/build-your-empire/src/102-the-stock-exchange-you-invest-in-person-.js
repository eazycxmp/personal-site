// ------------------------------------------------------------------ the stock exchange: you invest in person, on the steps
let investZone = null;
function investTile() {
  if (investZone) return;
  // on the steps beside the exchange, or behind it while the flight research plot there is still unbuilt
  const at = W.unlocked.has('sciFlight') ? [42.4, -9.2] : [40.2, -32];
  investZone = addZone({kind:'invest', x:at[0], z:at[1], icon:'📈', tile:{alpha:1, size:84, label:'Invest', fill:'rgba(30,110,70,.65)'}});
}
function updInvestTile() {
  if (investZone && player.zone !== investZone) investZone.open = false;
}

