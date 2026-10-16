// ------------------------------------------------------------------ fish species
// small minnows, trout, and big salmon that grill into two portions
const SPECIES = [
  {size:.75, body:0x8aa3b5, belly:0xe6eef2, fin:0x6f8798, spots:0},
  {size:1,   body:0x7a8a4a, belly:0xe8dcb0, fin:0x5f6e38, spots:0x3a4020},
  {size:1.35, body:0xd9785a, belly:0xf3c9b0, fin:0xb85a42, spots:0x8a3a2a},
];
function fishSpecies() { const r = R(); return r < BOOST.bigFish ? 2 : r < .5 ? 0 : 1; }

