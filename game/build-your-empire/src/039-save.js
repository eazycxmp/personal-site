// ------------------------------------------------------------------ save
const SAVE_KEY = 'buildyourempire.v1';
// carry over games saved while this was called River Feast
try { if (!localStorage.getItem(SAVE_KEY) && localStorage.getItem('riverfeast.v2')) localStorage.setItem(SAVE_KEY, localStorage.getItem('riverfeast.v2')); } catch (e) {}
