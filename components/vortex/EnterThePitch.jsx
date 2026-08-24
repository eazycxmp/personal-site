"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import RiggedPlayer from "./RiggedPlayer.jsx";

import * as THREE from "three";

/* ---------- tokens ----------
   pitch-black bg for UI chrome. club plays in black and white; the opposition
   in green and gold.
   world scale: 1 unit = 1 metre. player is ~1.85 tall.
------------------------------- */

// continuous steering — no lanes. the carrier holds a real x position and
// velocity; defenders reason about distances in metres.
let STEER_HALF = 2.6; // widened to the full field at mount on desktop
const TACKLE_REACH = 2.4; // how far a defender can dive from where he stands
const CONTACT_RADIUS = 1.0;

// support runners hold these lines either side of the carrier. Q/E finds the
// nearest one on that side.
const TEAM_SLOTS = [-5.0, -2.4, 2.4, 5.0];

// where each support runner celebrates, relative to the scorer. all four had
// been collapsing onto two points (one per side), so it read as two players.
const CELEBRATE_OFFSET = [-2.3, -0.95, 0.95, 2.3];

// the uprights stand here; nudge anyone whose path would clip a post
const POST_X = 2.8;
const POST_CLEAR = 0.55;
function clearOfPosts(x) {
  for (const p of [-POST_X, POST_X]) {
    const d = x - p;
    if (Math.abs(d) < POST_CLEAR) return p + (d >= 0 ? POST_CLEAR : -POST_CLEAR);
  }
  return x;
}

// squad selection. every body shares the 24-bone skeleton, so the same clips
// drive all of them. player 2 fields women throughout — carrier, support and
// opposition.
const SQUADS = {
  p1: { carrier: "a", mate: "a", defender: "b" },
  p2: { carrier: "f", mate: "f", defender: "f" },
};
function passTarget(cx, side) {
  const base = cx * 0.4;
  let bestI = -1;
  let bestD = Infinity;
  TEAM_SLOTS.forEach((slot, i) => {
    if (Math.sign(slot) !== side) return;
    const d = Math.abs(base + slot - cx);
    if (d < bestD) { bestD = d; bestI = i; }
  });
  return { idx: bestI, x: base + (TEAM_SLOTS[bestI] ?? side * 3.4) };
} // how close the shot must land to bring him down
// a kick-receipt defence: one flat line of five advancing to meet him, a
// sweeper behind it, and the fullback as the last man. ANY of them will
// tackle if he runs within reach; the rest turn and chase.
const TRY_LINE_Z = -68;
const DEAD_BALL_Z = -80;
const PITCH_HALF_W = 12;
// forwards are heavier and slower off the mark; the fullback is the last line
// of defence — lighter, quicker feet, and he waits on his toes
const ROLES = [
  { kit: "defender", number: 4, height: 1.06, girth: 1.24, cadence: 6.2, scrumCap: true },
  { kit: "defender", number: 8, height: 1.05, girth: 1.19, cadence: 6.5 },
  { kit: "fullback", number: 15, height: 0.98, girth: 0.92, cadence: 3.4 },
];

const LAUNCH_DIST = 7; // metres out where a defender commits and leaves the ground
const CONTACT_Z = 0.9; // where the tackle resolves
const DIVE_TRIGGER = 3.4;

// the try celebration, on one shared clock (seconds since the ball is grounded)
const TRY_SEQ = {
  ground: 0.7, // lying over the ball
  up: 2.1, // rolling to his feet
  gather: 3.4, // on his feet, team-mates walking in
  flipEnd: 6.0, // the scorer's backflip lands
  disperse: 8.0, // everyone heads back, still celebrating
}; // metres short of the line where the carrier launches

// Three club palettes. Whichever you pick, the opposition takes another, and
// the stands fill with both sets of supporters.
const PALETTES = {
  blue: {
    label: "Blue",
    jersey: "#1B3F8C", sleeve: "#12295C", trim: "#F4F1E8", shorts: "#12295C",
    socks: "#1B3F8C", boots: "#F4F1E8", bootAccent: "#1B3F8C",
    fans: ["#1B3F8C", "#2A55B0", "#E8E4DA", "#0E1F47"],
  },
  black: {
    label: "Black",
    jersey: "#141416", sleeve: "#141416", trim: "#F4F1E8", shorts: "#141416",
    socks: "#141416", boots: "#F4F1E8", bootAccent: "#141416",
    fans: ["#141416", "#2A2A2E", "#E8E4DA", "#3A3A40"],
  },
  green: {
    label: "Green",
    jersey: "#1B7A3C", sleeve: "#12592B", trim: "#F2C230", shorts: "#12592B",
    socks: "#F2C230", boots: "#0E0F10", bootAccent: "#F2C230",
    fans: ["#1B7A3C", "#F2C230", "#12592B", "#D9B02A"],
  },
};
const COLOUR_KEYS = ["blue", "black", "green"];
// the opposition runs out in the next colour along
const opponentOf = (home) => COLOUR_KEYS[(COLOUR_KEYS.indexOf(home) + 1) % COLOUR_KEYS.length];

const SKIN = ["#5E3A24", "#9A6A48", "#6B4226", "#C89A70", "#8A5A3B", "#7A5A44"];

function buildKits(home, away) {
  const H = PALETTES[home] || PALETTES.black;
  const A = PALETTES[away] || PALETTES.green;
  const kit = (p, number, skin) => ({
    number,
    skin,
    hair: "#0D0B09",
    jersey: p.jersey, sleeve: p.sleeve, trim: p.trim,
    shorts: p.shorts, socks: p.socks, boots: p.boots, bootAccent: p.bootAccent,
  });
  return {
    player: kit(H, 10, SKIN[0]),
    defender: kit(A, 7, SKIN[1]),
    defenderB: kit(A, 4, SKIN[2]),
    defenderC: kit(A, 6, SKIN[3]),
    // the fullback wears the reverse of his own strip so he stands out
    fullback: { ...kit(A, 15, SKIN[4]), jersey: A.trim, sleeve: A.jersey, trim: A.jersey },
    beaten: kit(A, 7, SKIN[5]),
  };
}

const ss = (x) => x * x * (3 - 2 * x); // smoothstep

// loose-ball physics: once it is grounded it stops being parented to his hand
// and behaves like an object — bounce, tumble, roll, settle.
const BALL_REST_Y = 0.1; // half the ball's short axis, so it sits on the turf
const _bv = new THREE.Vector3();
const _bax = new THREE.Vector3();
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

/* ---------------- procedural textures ----------------
   everything is generated at runtime so the component stays a single file
   with no asset pipeline.
------------------------------------------------------- */
function makeTurfTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#4f8244";
  g.fillRect(0, 0, 512, 512);
  // per-pixel grain so the surface catches light unevenly
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[i] += n * 0.8;
    img.data[i + 1] += n * 1.2;
    img.data[i + 2] += n * 0.6;
  }
  g.putImageData(img, 0, 0);
  // blade streaks
  g.lineWidth = 1;
  for (let i = 0; i < 1400; i++) {
    g.globalAlpha = 0.05 + Math.random() * 0.08;
    g.strokeStyle = Math.random() > 0.5 ? "#8fc47f" : "#2c5228";
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 7, y + 6 + Math.random() * 12);
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 70);
  t.anisotropy = 8;
  return t;
}

function makeSkyTexture() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 512;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, "#111d33");
  grad.addColorStop(0.35, "#26456b");
  grad.addColorStop(0.62, "#4d6f8e");
  grad.addColorStop(0.82, "#8299a8");
  grad.addColorStop(1.0, "#b0b7b4");
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 512);
  return new THREE.CanvasTexture(c);
}

function makeNumberTexture(num) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.font = "bold 200px Anton, Impact, Haettenschweiler, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(0,0,0,0.55)";
  g.strokeText(String(num), 128, 132);
  g.fillStyle = "#F4F1E8";
  g.fillText(String(num), 128, 132);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/* deterministic prng so crowd doesn't reshuffle on re-render */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ---------------- anatomy profiles ----------------
   limbs are lathed from muscle profiles (bottom -> top) so quads, calves and
   biceps have real bellies and taper, instead of reading as uniform tubes.
--------------------------------------------------- */
function lathe(profile, seg = 30) {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)),
    seg
  );
}

const GEO = {
  // hip pivot at 0, knee at -0.47 — quad belly high on the thigh (~18cm across)
  thigh: lathe([
    [0.001, -0.475], [0.058, -0.465], [0.066, -0.40], [0.078, -0.30],
    [0.089, -0.19], [0.092, -0.10], [0.084, -0.03], [0.001, 0.005],
  ]),
  // knee pivot at 0, ankle at -0.40 — calf belly just under the knee
  calf: lathe([
    [0.001, -0.415], [0.034, -0.40], [0.038, -0.34], [0.048, -0.24],
    [0.066, -0.13], [0.068, -0.06], [0.060, -0.005], [0.001, 0.02],
  ]),
  // shoulder pivot at 0, elbow at -0.31 — deltoid into bicep
  upperArm: lathe([
    [0.001, -0.315], [0.037, -0.30], [0.042, -0.25], [0.052, -0.16],
    [0.058, -0.09], [0.056, -0.03], [0.001, 0.0],
  ], 24),
  // elbow pivot at 0, wrist at -0.28 — forearm belly then taper to the wrist
  forearm: lathe([
    [0.001, -0.285], [0.026, -0.27], [0.030, -0.22], [0.040, -0.13],
    [0.046, -0.07], [0.042, -0.01], [0.001, 0.01],
  ], 24),
  // waist at 0 up to neck at 0.57 — V-taper, lats flaring to the shoulders
  torso: lathe([
    [0.001, -0.02], [0.162, 0.0], [0.178, 0.06], [0.170, 0.14],
    [0.150, 0.23], [0.163, 0.31], [0.186, 0.40], [0.180, 0.47],
    [0.128, 0.53], [0.001, 0.565],
  ], 34),
  // shorts leg, cut mid-thigh, hangs off the thigh
  shortsLeg: lathe([
    [0.001, -0.235], [0.086, -0.23], [0.090, -0.18], [0.096, -0.10],
    [0.098, -0.03], [0.094, 0.02], [0.001, 0.03],
  ], 26),
  // shorts seat over the hips
  shortsSeat: lathe([
    [0.001, -0.14], [0.116, -0.13], [0.128, -0.07], [0.135, 0.0],
    [0.130, 0.07], [0.116, 0.12], [0.001, 0.13],
  ], 28),
};

/* ---------------- rugby ball ---------------- */
function RugbyBall({ innerRef, ...props }) {
  return (
    <group ref={innerRef} {...props}>
      <mesh castShadow scale={[0.64, 0.64, 1.06]}>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshStandardMaterial color="#EDE8DC" roughness={0.5} />
      </mesh>
      {/* seam running the long axis */}
      <mesh rotation={[0, Math.PI / 2, 0]} scale={[1.06, 1, 0.64]}>
        <torusGeometry args={[0.108, 0.009, 8, 30]} />
        <meshStandardMaterial color="#17181a" roughness={0.7} />
      </mesh>
      {/* panel band */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.101, 0.006, 8, 24]} />
        <meshStandardMaterial color="#6E1423" roughness={0.7} />
      </mesh>
      {/* lacing */}
      {[-0.05, 0, 0.05].map((z, i) => (
        <mesh key={i} position={[0, 0.098, z]}>
          <boxGeometry args={[0.05, 0.012, 0.014]} />
          <meshStandardMaterial color="#17181a" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- humanoid rig ----------------
   run cycle: hips and shoulders counter-rotate, knees drive high, the trailing
   heel kicks up under the seat, ankles toe off and plant.
   dodgeRef (-1..1) drives the juke — body rolls into the step and the free arm
   comes out as a fend.
   diveRef (0..1) blends the whole rig from running into a full-length dive:
   spread arms for a tackle, ball out front for a try.
------------------------------------------------ */
function Humanoid({
  kit,
  hasBall = false,
  cadence = 9,
  phaseOffset = 0,
  flashRef,
  dodgeRef,
  diveRef,
  diveSpread = false,
  ballRef,
  catchRef,
  build,
  wrapRef,
  downRef,
  turnRef,
}) {
  const hipsG = useRef();
  const shouldersG = useRef();
  const legL = useRef();
  const legR = useRef();
  const kneeL = useRef();
  const kneeR = useRef();
  const footL = useRef();
  const footR = useRef();
  const armL = useRef();
  const armR = useRef();
  const elbowL = useRef();
  const elbowR = useRef();
  const body = useRef();
  const head = useRef();
  const jerseyMats = useRef([]);

  const base = useMemo(() => new THREE.Color(kit.jersey), [kit.jersey]);
  const white = useMemo(() => new THREE.Color("#F2F0EA"), []);
  const numberTex = useMemo(() => makeNumberTexture(build?.number ?? kit.number), [build, kit.number]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * cadence + phaseOffset;
    const s = Math.sin(t);
    const c = Math.sin(t + Math.PI);
    const dodge = dodgeRef ? dodgeRef.current : 0;
    const fend = Math.min(Math.abs(dodge), 1);
    const dive = diveRef ? clamp(diveRef.current, 0, 1) : 0;
    const d = ss(dive);
    // catchRef runs 0->1 as the pass arrives, then 1->2 as he tucks it away
    const cr = catchRef ? catchRef.current : 2;
    const reach = cr <= 1 ? ss(cr) : Math.max(0, 1 - ss(Math.min(1, cr - 1)));
    // wrap = the tackler closing his arms; down = the carrier being put on the deck
    // wrapRef 0->1 clamps the arms shut, 1->2 drags them down his legs
    const lead = turnRef ? turnRef.current.lead : 0;
    const lag = turnRef ? turnRef.current.lag : 0;
    // one shared heading offset for the whole trunk
    const trunkYaw = lead * 0.8;
    const wrapRaw = wrapRef ? wrapRef.current : 0;
    const wrap = ss(clamp(wrapRaw, 0, 1));
    const drag = ss(clamp(wrapRaw - 1, 0, 1));
    const down = downRef ? ss(clamp(downRef.current, 0, 1)) : 0;

    // ---- running pose ----
    // amplitudes kept inside a real sprinter's range: the hip swings about 30
    // degrees either side, the knee never folds past ~65, and the ankle rolls
    // from heel strike through toe-off rather than snapping.
    const hipL = s * 0.52 + 0.1;
    const hipR = c * 0.52 + 0.1;
    const bendL = -0.16 - Math.max(0, -Math.sin(t - 0.5)) * 1.0;
    const bendR = -0.16 - Math.max(0, -Math.sin(t - 0.5 + Math.PI)) * 1.0;
    const ankL = 0.08 + Math.sin(t + 0.9) * 0.26;
    const ankR = 0.08 + Math.sin(t + 0.9 + Math.PI) * 0.26;

    // ---- diving pose: legs stretched out behind, toes pointed ----
    // defenders shoot a double leg; the carrier's dive is a full-length swan
    const dlLegL = diveSpread ? 0.95 : -0.55;
    const dlLegR = diveSpread ? -0.75 : -0.42;
    const dlKneeL = diveSpread ? -1.35 : -0.12;
    const dlKneeR = diveSpread ? -0.18 : -0.2;
    const dlBody = diveSpread ? -1.02 : -1.42;
    const dlArmX = diveSpread ? 1.62 : 1.55;
    if (legL.current) {
      legL.current.rotation.x = lerp(hipL, dlLegL, d);
      legL.current.rotation.z = trunkYaw * 0.45 * (1 - d);
    }
    if (legR.current) {
      legR.current.rotation.x = lerp(hipR, dlLegR, d);
      legR.current.rotation.z = trunkYaw * 0.45 * (1 - d);
    }
    if (kneeL.current) kneeL.current.rotation.x = lerp(bendL, dlKneeL, d);
    if (kneeR.current) kneeR.current.rotation.x = lerp(bendR, dlKneeR, d);
    if (footL.current) footL.current.rotation.x = lerp(ankL, -0.35, d);
    if (footR.current) footR.current.rotation.x = lerp(ankR, -0.35, d);

    // a change of direction runs down the body as a chain: the shoulders point
    // where he is going first, the pelvis follows a beat later, and the legs —
    // being children of the pelvis — drive wherever it now faces.
    // trunk stays square over the pelvis: both take the SAME heading offset, so
    // shoulders and hips always face the same way. the stride no longer twists
    // them against each other — the arm swing carries that read instead.
    if (hipsG.current) {
      hipsG.current.rotation.y = trunkYaw;
      hipsG.current.rotation.z = 0;
    }
    if (shouldersG.current) {
      shouldersG.current.rotation.y = trunkYaw;
      shouldersG.current.rotation.z = 0;
    }

    // free arm pumps with a bent elbow, swings out as a fend on the juke,
    // then reaches out in front for the dive
    const spread = diveSpread ? 0.24 : 0.16; // arms wrap in, not spread wide
    if (armL.current) {
      armL.current.rotation.x = lerp(-s * 0.6 * (1 - fend) - fend * 0.25, dlArmX, d);
      armL.current.rotation.z = lerp((dodge < 0 ? dodge * 1.35 : dodge * 0.25) - 0.1 - Math.max(0, s) * 0.06, spread, d);
    }
    if (elbowL.current) {
      elbowL.current.rotation.x = lerp((1.05 + Math.max(0, -s) * 0.38) * (1 - fend) + fend * 0.25, 0.12, d);
    }
    if (armR.current) {
      const swing = hasBall ? 0.12 + s * 0.07 : -c * 0.6;
      armR.current.rotation.x = lerp(swing, dlArmX, d);
      armR.current.rotation.z = lerp(hasBall ? -0.42 : 0.1 + Math.max(0, c) * 0.06, -spread, d);
    }
    if (elbowR.current) {
      elbowR.current.rotation.x = lerp(hasBall ? 1.62 : 1.05 + Math.max(0, -c) * 0.38, 0.12, d);
    }

    // hands go up to meet the pass
    if (reach > 0.001) {
      if (armL.current) {
        armL.current.rotation.x = lerp(armL.current.rotation.x, 1.15, reach);
        armL.current.rotation.z = lerp(armL.current.rotation.z, -0.55, reach);
      }
      if (armR.current) {
        armR.current.rotation.x = lerp(armR.current.rotation.x, 1.15, reach);
        armR.current.rotation.z = lerp(armR.current.rotation.z, 0.55, reach);
      }
      if (elbowL.current) elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, 1.0, reach);
      if (elbowR.current) elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, 1.0, reach);

    }

    // tackler: arms close and lock around him
    if (wrap > 0.001) {
      if (armL.current) {
        armL.current.rotation.x = lerp(armL.current.rotation.x, 1.5, wrap);
        armL.current.rotation.z = lerp(armL.current.rotation.z, 0.9, wrap);
      }
      if (armR.current) {
        armR.current.rotation.x = lerp(armR.current.rotation.x, 1.5, wrap);
        armR.current.rotation.z = lerp(armR.current.rotation.z, -0.9, wrap);
      }
      if (elbowL.current) elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, 1.55, wrap);
      if (elbowR.current) elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, 1.55, wrap);
    }
    // arms slide down his legs as the tackler goes to ground, dragging him over
    if (drag > 0.001) {
      if (armL.current) {
        armL.current.rotation.x = lerp(armL.current.rotation.x, 2.15, drag);
        armL.current.rotation.z = lerp(armL.current.rotation.z, 0.55, drag);
      }
      if (armR.current) {
        armR.current.rotation.x = lerp(armR.current.rotation.x, 2.15, drag);
        armR.current.rotation.z = lerp(armR.current.rotation.z, -0.55, drag);
      }
      if (elbowL.current) elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, 1.1, drag);
      if (elbowR.current) elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, 1.1, drag);
    }

    // carrier: driven over backwards onto his back, legs folding up, ball hugged in
    if (down > 0.001) {
      if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, 0.7, down);
      if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, 0.45, down);
      if (kneeL.current) kneeL.current.rotation.x = lerp(kneeL.current.rotation.x, -1.35, down);
      if (kneeR.current) kneeR.current.rotation.x = lerp(kneeR.current.rotation.x, -1.0, down);
      // free arm braces back for the landing
      if (armL.current) {
        armL.current.rotation.x = lerp(armL.current.rotation.x, -0.9, down);
        armL.current.rotation.z = lerp(armL.current.rotation.z, -0.7, down);
      }
      if (elbowL.current) elbowL.current.rotation.x = lerp(elbowL.current.rotation.x, 0.5, down);
      // ball arm clamps the ball to his chest
      if (armR.current) {
        armR.current.rotation.x = lerp(armR.current.rotation.x, 0.35, down);
        armR.current.rotation.z = lerp(armR.current.rotation.z, -0.75, down);
      }
      if (elbowR.current) elbowR.current.rotation.x = lerp(elbowR.current.rotation.x, 2.0, down);
    }

    if (body.current) {
      // stride bob + weight shift, flattening into a horizontal dive
      // two bounces per stride, not one — a runner rises on each toe-off
      body.current.position.y = (0.5 - 0.5 * Math.cos(2 * t)) * 0.06 * (1 - d);
      body.current.rotation.x = lerp(lerp(-0.14 - Math.abs(s) * 0.035, dlBody, d), 1.46, down);
      body.current.rotation.z = lerp(lerp(s * 0.03 - dodge * 0.22, 0, d), 0.28, down);
      body.current.position.y *= 1 - down;
    }
    // head stays level, looks where the step is going, chin up on the dive
    if (head.current) {
      head.current.rotation.x = lerp(lerp(0.13 - s * 0.03, -0.24, reach), 0.75, d); // chin up to track the ball in
      head.current.rotation.z = (s * 0.05 + dodge * 0.12) * (1 - d);
      head.current.rotation.y = (s * 0.06 - dodge * 0.35) * (1 - d);
    }

    // the ball comes off the hip and out in front to be grounded
    if (ballRef && ballRef.current && hasBall) {
      ballRef.current.visible = cr >= 1;
      ballRef.current.position.set(lerp(0.2, 0.05, d), lerp(1.19, 1.44, d), lerp(-0.17, -0.46, d));
      ballRef.current.rotation.set(lerp(0.15, -0.45, d), lerp(-0.95, 0.12, d), lerp(0.22, 0.08, d));
    }

    // tackle flash
    if (flashRef) {
      const lit = flashRef.current > 0;
      for (const m of jerseyMats.current) if (m) m.color.copy(lit ? white : base);
      if (flashRef.current > 0) flashRef.current -= 1;
    }
  });

  const reg = (i) => (m) => (jerseyMats.current[i] = m);

  const Leg = ({ side, hipRef, kneeRef, footRef }) => (
    <group ref={hipRef} position={[0.086 * side, 0.95, 0]}>
      <mesh geometry={GEO.thigh} castShadow>
        <meshStandardMaterial color={kit.skin} roughness={0.8} />
      </mesh>
      {/* shorts leg rides with the thigh */}
      <mesh geometry={GEO.shortsLeg} position={[0, 0.02, 0]} scale={[1.02, 1, 1.02]} castShadow>
        <meshStandardMaterial color={kit.shorts} roughness={0.85} />
      </mesh>
      {/* shorts hem */}
      <mesh position={[0, -0.222, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.088, 0.0075, 6, 22]} />
        <meshStandardMaterial color={kit.trim} roughness={0.85} />
      </mesh>
      {/* side stripe */}
      <mesh position={[0.097 * side, -0.09, 0]} rotation={[0, 0, 0.04 * side]}>
        <boxGeometry args={[0.012, 0.19, 0.05]} />
        <meshStandardMaterial color={kit.trim} roughness={0.8} />
      </mesh>
      <group ref={kneeRef} position={[0, -0.47, 0]}>
        {/* knee cap */}
        <mesh position={[0, 0.01, -0.048]} scale={[1, 0.95, 0.65]}>
          <sphereGeometry args={[0.052, 12, 10]} />
          <meshStandardMaterial color={kit.skin} roughness={0.82} />
        </mesh>
        {/* gastrocnemius heads */}
        {[-1, 1].map((n) => (
          <mesh key={n} position={[0.026 * n, -0.115, 0.03]} scale={[0.8, 1.35, 0.75]}>
            <sphereGeometry args={[0.036, 12, 10]} />
            <meshStandardMaterial color={kit.skin} roughness={0.8} />
          </mesh>
        ))}
        {/* achilles */}
        <mesh position={[0, -0.335, 0.022]} scale={[0.7, 1, 0.6]}>
          <capsuleGeometry args={[0.019, 0.06, 4, 8]} />
          <meshStandardMaterial color={kit.skin} roughness={0.82} />
        </mesh>
        <mesh geometry={GEO.calf} castShadow>
          <meshStandardMaterial color={kit.skin} roughness={0.8} />
        </mesh>
        {/* knee-high sock over the calf */}
        <mesh geometry={GEO.calf} position={[0, -0.115, 0]} scale={[1.09, 0.72, 1.09]} castShadow>
          <meshStandardMaterial color={kit.socks} roughness={0.95} />
        </mesh>
        {/* sock turnover */}
        <mesh position={[0, -0.145, 0]}>
          <cylinderGeometry args={[0.077, 0.074, 0.045, 20]} />
          <meshStandardMaterial color={kit.trim} roughness={0.95} />
        </mesh>
        {/* sock stripe */}
        <mesh position={[0, -0.215, 0]}>
          <cylinderGeometry args={[0.0755, 0.073, 0.02, 20]} />
          <meshStandardMaterial color={kit.jersey} roughness={0.95} />
        </mesh>
        <group ref={footRef} position={[0, -0.4, 0]}>
          {/* ankle bones */}
          {[-1, 1].map((n) => (
            <mesh key={n} position={[0.03 * n, 0.012, -0.004]} scale={[0.6, 1, 0.8]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial color={kit.skin} roughness={0.85} />
            </mesh>
          ))}
          {/* ankle collar */}
          <mesh position={[0, -0.012, -0.01]}>
            <sphereGeometry args={[0.052, 12, 10]} />
            <meshStandardMaterial color={kit.boots} roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.035, -0.045]} castShadow>
            <boxGeometry args={[0.098, 0.07, 0.19]} />
            <meshStandardMaterial color={kit.boots} roughness={0.35} />
          </mesh>
          {/* toe cap in the accent colour */}
          <mesh position={[0, -0.046, -0.155]} castShadow>
            <boxGeometry args={[0.094, 0.05, 0.075]} />
            <meshStandardMaterial color={kit.bootAccent} roughness={0.35} />
          </mesh>
          {/* swoosh stripe */}
          <mesh position={[0, -0.03, -0.048]} scale={[1.01, 1, 1]}>
            <boxGeometry args={[0.1, 0.012, 0.14]} />
            <meshStandardMaterial color={kit.bootAccent} roughness={0.4} />
          </mesh>
          {/* heel counter */}
          <mesh position={[0, -0.03, 0.055]} scale={[0.95, 1, 0.6]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color={kit.boots} roughness={0.35} />
          </mesh>
          {/* tongue */}
          <mesh position={[0, 0.008, -0.055]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.055, 0.05, 0.012]} />
            <meshStandardMaterial color={kit.boots} roughness={0.6} />
          </mesh>
          {/* laces */}
          {[-0.03, -0.065, -0.1].map((z, li) => (
            <mesh key={li} position={[0, 0.0, z]}>
              <boxGeometry args={[0.05, 0.008, 0.009]} />
              <meshStandardMaterial color="#DCD6C8" roughness={0.9} />
            </mesh>
          ))}
          {/* sole + studs */}
          <mesh position={[0, -0.072, -0.06]}>
            <boxGeometry args={[0.094, 0.018, 0.25]} />
            <meshStandardMaterial color="#0A0B0C" roughness={0.6} />
          </mesh>
          {[[-0.03, 0.02], [0.03, 0.02], [-0.03, -0.14], [0.03, -0.14]].map(([sx, sz], si) => (
            <mesh key={si} position={[sx, -0.086, sz]}>
              <cylinderGeometry args={[0.011, 0.009, 0.016, 6]} />
              <meshStandardMaterial color="#C9C3B6" roughness={0.5} metalness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );

  const Arm = ({ side, shoulderRef, elbowRef }) => (
    <group ref={shoulderRef} position={[0.185 * side, 1.4, 0]}>
      <mesh geometry={GEO.upperArm} castShadow>
        <meshStandardMaterial color={kit.skin} roughness={0.8} />
      </mesh>
      {/* jersey sleeve, cut mid-bicep */}
      <mesh geometry={GEO.upperArm} position={[0, 0.012, 0]} scale={[1.12, 0.52, 1.12]} castShadow>
        <meshStandardMaterial color={kit.sleeve} roughness={0.7} />
      </mesh>
      {/* bicep peak */}
      <mesh position={[-0.014 * side, -0.2, -0.022]} scale={[0.85, 1.15, 0.8]}>
        <sphereGeometry args={[0.042, 12, 10]} />
        <meshStandardMaterial color={kit.skin} roughness={0.8} />
      </mesh>
      {/* tricep */}
      <mesh position={[0.012 * side, -0.21, 0.024]} scale={[0.8, 1.25, 0.7]}>
        <sphereGeometry args={[0.038, 12, 10]} />
        <meshStandardMaterial color={kit.skin} roughness={0.8} />
      </mesh>
      {/* sleeve cuff */}
      <mesh position={[0, -0.165, 0]}>
        <cylinderGeometry args={[0.058, 0.056, 0.022, 18]} />
        <meshStandardMaterial color={kit.trim} roughness={0.7} />
      </mesh>
      <group ref={elbowRef} position={[0, -0.31, 0]}>
        {/* elbow point */}
        <mesh position={[0, 0.005, 0.022]} scale={[0.85, 0.8, 0.75]}>
          <sphereGeometry args={[0.036, 10, 8]} />
          <meshStandardMaterial color={kit.skin} roughness={0.82} />
        </mesh>
        <mesh geometry={GEO.forearm} castShadow>
          <meshStandardMaterial color={kit.skin} roughness={0.8} />
        </mesh>
        {/* wrist tape */}
        <mesh position={[0, -0.255, 0]}>
          <cylinderGeometry args={[0.039, 0.038, 0.042, 14]} />
          <meshStandardMaterial color="#EFE9DC" roughness={0.9} />
        </mesh>
        {/* palm */}
        <mesh position={[0, -0.295, -0.008]} scale={[1, 1.15, 0.58]}>
          <sphereGeometry args={[0.043, 14, 12]} />
          <meshStandardMaterial color={kit.skin} roughness={0.85} />
        </mesh>
        {/* fingers */}
        {[-1.5, -0.5, 0.5, 1.5].map((fi) => (
          <mesh
            key={fi}
            position={[fi * 0.019, -0.345 + Math.abs(fi) * 0.006, -0.012]}
            rotation={[-0.35, 0, fi * 0.06]}
            castShadow
          >
            <capsuleGeometry args={[0.0092, 0.038 - Math.abs(fi) * 0.005, 4, 8]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
        ))}
        {/* knuckle line */}
        <mesh position={[0, -0.325, -0.014]} scale={[1.5, 0.35, 0.7]}>
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshStandardMaterial color={kit.skin} roughness={0.85} />
        </mesh>
        {/* thumb */}
        <mesh position={[0.038 * side, -0.288, -0.022]} rotation={[-0.3, 0, -0.5 * side]} castShadow>
          <capsuleGeometry args={[0.015, 0.03, 4, 8]} />
          <meshStandardMaterial color={kit.skin} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group ref={body} rotation={[-0.16, 0, 0]} scale={build ? [build.girth, build.height, build.girth] : 1}>
      <group ref={shouldersG}>
        {/* torso */}
        <mesh geometry={GEO.torso} position={[0, 0.98, 0]} scale={[0.95, 1, 0.78]} castShadow>
          <meshStandardMaterial ref={reg(0)} color={kit.jersey} roughness={0.68} />
        </mesh>
        {/* shoulder seams */}
        {[-1, 1].map((n) => (
          <mesh key={n} position={[0.128 * n, 1.418, 0]} rotation={[0, 0, 0.5 * n]}>
            <torusGeometry args={[0.062, 0.007, 6, 16, Math.PI]} />
            <meshStandardMaterial color={kit.sleeve} roughness={0.75} />
          </mesh>
        ))}
        {/* side panels */}
        {[-1, 1].map((n) => (
          <mesh key={n} position={[0.163 * n, 1.24, 0]} scale={[0.35, 1, 0.75]}>
            <capsuleGeometry args={[0.03, 0.22, 6, 10]} />
            <meshStandardMaterial color={kit.sleeve} roughness={0.72} />
          </mesh>
        ))}
        {/* sponsor band */}
        <mesh position={[0, 1.28, -0.148]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.17, 0.045]} />
          <meshStandardMaterial color={kit.trim} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* pectorals */}
        {[-1, 1].map((e) => (
          <mesh key={e} position={[0.058 * e, 1.35, -0.088]} scale={[1.2, 0.7, 0.42]}>
            <sphereGeometry args={[0.058, 16, 12]} />
            <meshStandardMaterial ref={e === -1 ? reg(4) : reg(5)} color={kit.jersey} roughness={0.68} />
          </mesh>
        ))}
        {/* club crest */}
        <mesh position={[0.062, 1.355, -0.126]} rotation={[0, -0.3, 0]}>
          <planeGeometry args={[0.032, 0.038]} />
          <meshStandardMaterial color={kit.trim} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* v-neck insert */}
        <mesh position={[0, 1.45, -0.072]} rotation={[-0.25, 0, 0]}>
          <planeGeometry args={[0.07, 0.055]} />
          <meshStandardMaterial color={kit.sleeve} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* squad number */}
        <mesh position={[0, 1.33, 0.128]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.23, 0.23]} />
          <meshStandardMaterial map={numberTex} transparent roughness={0.8} />
        </mesh>
        {/* club hoop */}
        <mesh position={[0, 1.19, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.99, 0.8, 1]}>
          <torusGeometry args={[0.163, 0.02, 8, 30]} />
          <meshStandardMaterial color={kit.trim} roughness={0.7} />
        </mesh>
        {/* collar */}
        <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 0.88, 1]}>
          <torusGeometry args={[0.07, 0.022, 8, 24]} />
          <meshStandardMaterial color={kit.trim} roughness={0.75} />
        </mesh>

        {/* traps + neck */}
        <mesh position={[0, 1.455, -0.012]} scale={[1.35, 0.6, 0.85]} castShadow>
          <sphereGeometry args={[0.088, 16, 14]} />
          <meshStandardMaterial ref={reg(1)} color={kit.jersey} roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.535, 0.005]} rotation={[-0.12, 0, 0]} castShadow>
          <cylinderGeometry args={[0.052, 0.068, 0.1, 12]} />
          <meshStandardMaterial color={kit.skin} roughness={0.85} />
        </mesh>

        {/* head */}
        <group ref={head} position={[0, 1.595, 0]}>
          <mesh position={[0, 0.075, -0.012]} scale={[0.9, 1.16, 0.98]} castShadow>
            <sphereGeometry args={[0.098, 20, 18]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
          {/* jaw */}
          <mesh position={[0, 0.032, -0.028]} scale={[0.8, 0.62, 0.92]} castShadow>
            <sphereGeometry args={[0.088, 18, 14]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
          {/* brow ridge */}
          <mesh position={[0, 0.095, -0.078]} scale={[1, 0.35, 0.5]}>
            <sphereGeometry args={[0.072, 14, 10]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
          {/* nose */}
          <mesh position={[0, 0.056, -0.096]} scale={[0.6, 1.15, 0.85]}>
            <sphereGeometry args={[0.03, 12, 10]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
          {/* eyes */}
          {[-1, 1].map((e) => (
            <group key={e} position={[0.034 * e, 0.082, -0.079]}>
              <mesh scale={[1, 0.78, 0.6]}>
                <sphereGeometry args={[0.0205, 12, 10]} />
                <meshStandardMaterial color="#F2EFE8" roughness={0.35} />
              </mesh>
              <mesh position={[0, 0, -0.009]}>
                <sphereGeometry args={[0.0105, 10, 10]} />
                <meshStandardMaterial color="#2A211A" roughness={0.3} />
              </mesh>
              {/* eyelid */}
              <mesh position={[0, 0.009, -0.003]} scale={[1.1, 0.5, 0.9]}>
                <sphereGeometry args={[0.0195, 10, 8]} />
                <meshStandardMaterial color={kit.skin} roughness={0.85} />
              </mesh>
              {/* brow */}
              <mesh position={[0, 0.028, -0.006]} scale={[1.7, 0.34, 0.6]}>
                <sphereGeometry args={[0.022, 10, 8]} />
                <meshStandardMaterial color={kit.hair} roughness={0.95} />
              </mesh>
            </group>
          ))}
          {/* lips */}
          <mesh position={[0, 0.012, -0.084]} scale={[1.15, 0.26, 0.35]}>
            <sphereGeometry args={[0.024, 12, 8]} />
            <meshStandardMaterial color="#9A5C51" roughness={0.65} />
          </mesh>
          <mesh position={[0, -0.004, -0.083]} scale={[1, 0.24, 0.32]}>
            <sphereGeometry args={[0.023, 12, 8]} />
            <meshStandardMaterial color="#8A5148" roughness={0.65} />
          </mesh>
          {/* nostrils */}
          {[-1, 1].map((n) => (
            <mesh key={n} position={[0.011 * n, 0.044, -0.099]} scale={[1, 0.7, 0.6]}>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshStandardMaterial color="#6B4038" roughness={0.9} />
            </mesh>
          ))}
          {/* cheekbones */}
          {[-1, 1].map((n) => (
            <mesh key={n} position={[0.052 * n, 0.05, -0.068]} scale={[1, 0.6, 0.55]}>
              <sphereGeometry args={[0.03, 10, 8]} />
              <meshStandardMaterial color={kit.skin} roughness={0.85} />
            </mesh>
          ))}
          {/* chin */}
          <mesh position={[0, -0.022, -0.07]} scale={[0.9, 0.7, 0.7]}>
            <sphereGeometry args={[0.03, 12, 10]} />
            <meshStandardMaterial color={kit.skin} roughness={0.85} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((s2) => (
            <mesh key={s2} position={[0.086 * s2, 0.075, -0.003]} scale={[0.4, 1, 0.7]}>
              <sphereGeometry args={[0.034, 10, 8]} />
              <meshStandardMaterial color={kit.skin} roughness={0.85} />
            </mesh>
          ))}
          {/* hair, or a scrum cap on the forwards who wear one */}
          <mesh position={[0, 0.09, -0.005]} scale={[0.97, 0.98, 1.0]} castShadow>
            <sphereGeometry args={[0.103, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2.15]} />
            <meshStandardMaterial color={kit.hair} roughness={0.95} />
          </mesh>
          {/* fringe + sides so the hair is not one smooth cap */}
          <mesh position={[0, 0.088, -0.055]} rotation={[0.35, 0, 0]} scale={[1, 0.5, 0.7]}>
            <sphereGeometry args={[0.086, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={kit.hair} roughness={0.95} />
          </mesh>
          {[-1, 1].map((n) => (
            <mesh key={n} position={[0.082 * n, 0.062, -0.004]} scale={[0.42, 0.85, 0.95]}>
              <sphereGeometry args={[0.062, 12, 10]} />
              <meshStandardMaterial color={kit.hair} roughness={0.95} />
            </mesh>
          ))}
          {build?.scrumCap && (
            <group>
              <mesh position={[0, 0.075, -0.004]} scale={[1.06, 1.12, 1.06]} castShadow>
                <sphereGeometry args={[0.104, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.75]} />
                <meshStandardMaterial color={kit.sleeve} roughness={0.85} />
              </mesh>
              {/* chin strap */}
              <mesh position={[0, 0.01, -0.028]} rotation={[-0.2, 0, 0]}>
                <torusGeometry args={[0.085, 0.008, 6, 20]} />
                <meshStandardMaterial color={kit.sleeve} roughness={0.85} />
              </mesh>
            </group>
          )}
        </group>

        {/* deltoids */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0.181 * side, 1.408, 0]} scale={[0.95, 1.2, 0.95]} castShadow>
            <sphereGeometry args={[0.073, 16, 14]} />
            <meshStandardMaterial ref={side === -1 ? reg(2) : reg(3)} color={kit.sleeve} roughness={0.7} />
          </mesh>
        ))}

        <Arm side={-1} shoulderRef={armL} elbowRef={elbowL} />
        <Arm side={1} shoulderRef={armR} elbowRef={elbowR} />

        {hasBall && <RugbyBall innerRef={ballRef} position={[0.2, 1.19, -0.17]} rotation={[0.15, -0.95, 0.22]} />}
      </group>

      {/* hips counter-rotate against the shoulders */}
      <group ref={hipsG}>
        <mesh geometry={GEO.shortsSeat} position={[0, 0.95, 0]} scale={[1.06, 1, 0.9]} castShadow>
          <meshStandardMaterial color={kit.shorts} roughness={0.85} />
        </mesh>
        {/* waistband */}
        <mesh position={[0, 1.055, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.06, 0.9, 1]}>
          <torusGeometry args={[0.128, 0.016, 8, 28]} />
          <meshStandardMaterial color={kit.trim} roughness={0.8} />
        </mesh>
        <Leg side={-1} hipRef={legL} kneeRef={kneeL} footRef={footL} />
        <Leg side={1} hipRef={legR} kneeRef={kneeR} footRef={footR} />
      </group>
    </group>
  );
}

/* ---------------- the carrier ----------------
   the juke is a three-beat move: plant the outside foot against the run,
   transfer hard, then recover. the counter-plant is what sells it as a step
   rather than a slide.
------------------------------------------------ */
function Runner({ carrierXRef, steerRef, passRef, hitFlashRef, diveRef, catchRef, downRef, phaseRef, tryTRef, squad, kits }) {
  const group = useRef();
  const ballRef = useRef();
  const dodgeRef = useRef(0);
  const vx = useRef(0);
  const prevSteerSign = useRef(0);
  const jukeClipT = useRef(1); // <1 while the sidestep clip is showing
  // smoothed heading: shoulders lead, body follows
  const heading = useRef({ fast: 0, mid: 0 });
  const poseRef = useRef({ clip: "run", timeScale: 1, ballVisible: false });
  const faceT = useRef(0); // 0 = facing his own posts (backpedal), 1 = turned downfield
  const spotRef = useRef(null); // where he grounded it — the celebration anchor
  const ballPhys = useRef(null); // loose-ball state once it leaves his hand
  const passZ = useRef(0); // receiver momentum: he catches deep and runs onto it
  const recvT = useRef(1); // <1 right after receiving — plays the catch

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const dive = clamp(diveRef.current, 0, 1);

    // after the try: ground it, get up, wait for the team, then all flip together
    if (phaseRef.current === "try") {
      tryTRef.current += dt; // he owns the shared clock; team-mates read it
      const t = tryTRef.current;
      poseRef.current.ballGrounded = true; // hand tracking off; physics takes over
      if (spotRef.current === null) spotRef.current = { x: g.position.x, z: g.position.z };

      // ---- loose ball ----
      if (ballRef.current) {
        if (!ballPhys.current) {
          // hand it over at exactly the position and momentum it had
          const wp = new THREE.Vector3();
          ballRef.current.getWorldPosition(wp);
          ballPhys.current = {
            pos: wp,
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.7, -0.6, -2.3),
            axis: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.25, Math.random() - 0.5).normalize(),
            asleep: false,
          };
        }
        const b = ballPhys.current;
        if (!b.asleep) {
          b.vel.y -= 9.8 * dt;
          b.pos.addScaledVector(b.vel, dt);
          if (b.pos.y <= BALL_REST_Y) {
            b.pos.y = BALL_REST_Y;
            if (Math.abs(b.vel.y) > 0.4) {
              // an oval ball never bounces true — kick it off at an angle
              b.vel.y = -b.vel.y * 0.34;
              b.vel.x = b.vel.x * 0.65 + (Math.random() - 0.5) * 0.9;
              b.vel.z *= 0.65;
              b.axis.set(Math.random() - 0.5, Math.random() * 0.3, Math.random() - 0.5).normalize();
            } else {
              b.vel.y = 0;
              const fric = Math.pow(0.09, dt); // rolling to a stop on the grass
              b.vel.x *= fric;
              b.vel.z *= fric;
              if (b.vel.lengthSq() < 0.004) {
                b.vel.set(0, 0, 0);
                b.asleep = true;
              }
            }
          }
          // tumble in the air, roll about the axis across its path on the deck
          const speed = Math.hypot(b.vel.x, b.vel.z);
          if (b.pos.y > BALL_REST_Y + 0.01) {
            ballRef.current.rotateOnWorldAxis(b.axis, dt * 9);
          } else if (speed > 0.02) {
            _bax.set(-b.vel.z, 0, b.vel.x).normalize();
            ballRef.current.rotateOnWorldAxis(_bax, (speed / 0.14) * dt);
          }
        }
        // it lives in world space now; convert back through the moving parent
        if (ballRef.current.parent) {
          _bv.copy(b.pos);
          ballRef.current.parent.worldToLocal(_bv);
          ballRef.current.position.copy(_bv);
        }
      }
      const spot = spotRef.current;
      const face = 1 - Math.pow(0.05, dt);

      if (t < TRY_SEQ.ground) {
        // lying over the ball
      } else if (t < TRY_SEQ.up) {
        poseRef.current.clip = "roll";
        poseRef.current.timeScale = 1.1;
        g.position.y = 0;
      } else if (t < TRY_SEQ.gather) {
        // on his feet, breathing, turning to the crowd while they run in
        poseRef.current.clip = "idle";
        poseRef.current.timeScale = 1;
        g.position.y = 0;
        g.rotation.y = lerp(g.rotation.y, Math.PI, face);
      } else if (t < TRY_SEQ.flipEnd) {
        poseRef.current.clip = "backflip";
        poseRef.current.timeScale = 1;
        g.position.y = 0;
        g.rotation.y = lerp(g.rotation.y, Math.PI, face);
      } else {
        // bouncing around together
        const ct = t - TRY_SEQ.flipEnd;
        poseRef.current.clip = "victory";
        poseRef.current.timeScale = 1.15;
        g.position.y = Math.abs(Math.sin(ct * 4.4)) * 0.3;
        g.position.x = spot.x + Math.sin(ct * 1.15) * 0.9;
        g.position.z = spot.z + Math.cos(ct * 0.95) * 0.7;
        g.rotation.y = Math.PI + Math.sin(ct * 0.85) * 0.7;
      }
      return;
    }

    const down = ss(clamp(downRef.current, 0, 1));
    if (down > 0.001) {
      // Driven backwards and put on the deck. The clip alone cannot do this —
      // the hips are pinned to the bind pose, so he can never actually descend.
      // Tip the whole player over instead: rotating about his feet lays him out
      // on his back, and a little lift keeps his shoulders off the turf.
      g.position.z = lerp(g.position.z, 1.15, down * 0.8);
      g.rotation.y = lerp(g.rotation.y, -0.35, down * 0.5);
      g.rotation.x = 1.42 * down;
      g.position.y = 0.16 * down;
      dodgeRef.current = 0;
      poseRef.current.clip = "thrown";
      poseRef.current.timeScale = 1;
      poseRef.current.ballVisible = true;
      return;
    }

    const cr = catchRef.current;
    const steering = phaseRef.current === "running";

    // ---- a pass in the air: play the throw, then take over the receiver ----
    const pass = passRef.current;
    if (pass.t < 1) {
      pass.t = Math.min(1, pass.t + dt / 0.55);
      if (pass.t >= 1) {
        // the receiver becomes the carrier: jump to his line, keep his depth,
        // and burn it off as he accelerates onto the ball
        g.position.x = clamp(pass.toX, -STEER_HALF, STEER_HALF);
        carrierXRef.current = g.position.x;
        vx.current = 0;
        passZ.current = 3.2;
        recvT.current = 0;
      }
    }
    recvT.current = Math.min(1, recvT.current + dt / 0.45);
    passZ.current *= Math.pow(0.25, dt);

    // ---- continuous movement: steer -> velocity -> position ----
    const steer = steering && pass.t >= 1 ? steerRef.current : 0;
    const accel = 1 - Math.pow(0.002, dt);
    vx.current += (steer * 7 - vx.current) * accel;
    if (!steering) vx.current *= Math.pow(0.05, dt);
    g.position.x = clamp(g.position.x + vx.current * dt, -STEER_HALF, STEER_HALF);
    carrierXRef.current = g.position.x;

    // a hard direction reversal at speed reads as a sidestep — show the clip
    const sign = Math.sign(steer);
    if (sign !== 0 && prevSteerSign.current !== 0 && sign !== prevSteerSign.current && Math.abs(vx.current) > 3) {
      jukeClipT.current = 0;
    }
    if (sign !== 0) prevSteerSign.current = sign;
    jukeClipT.current = Math.min(1, jukeClipT.current + dt / 0.42);
    dodgeRef.current = clamp(vx.current / 6, -1, 1);

    if (dive > 0) {
      // launch, hang, land — the ball stays out in front all the way down
      const e = ss(dive);
      g.position.y = Math.sin(Math.PI * Math.min(dive * 0.92, 1)) * 0.62;
      g.position.z = -e * 2.6;
      g.rotation.y *= 0.85;
      dodgeRef.current = 0;
    } else {
      g.position.y = 0;
      g.position.z = passZ.current; // deep after a catch, closing back to the line
    }

    // pick the clip that matches what the game is doing
    let clip = "run";
    if (dive > 0) clip = "dive";
    else if (cr < 0.85) clip = "backpedal"; // walking back under the kick
    else if (cr < 1) clip = "catch";
    else if (pass.t < 1) clip = "throwing";
    else if (recvT.current < 1) clip = "catch";
    else if (jukeClipT.current < 1) clip = "juke";
    poseRef.current.clip = clip;
    poseRef.current.timeScale =
      clip === "run" ? 0.95 : clip === "juke" ? 2.7 : clip === "throwing" ? 2.1 : clip === "backpedal" ? 1.15 : clip === "catch" && recvT.current < 1 ? 1.6 : 1;
    poseRef.current.ballVisible = cr >= 1 && pass.t >= 1;

    // heading follows real velocity, shoulders leading the body
    const target = clamp(-vx.current * 0.14, -0.9, 0.9);
    const h = heading.current;
    h.fast += (target - h.fast) * (1 - Math.pow(0.001, dt));
    h.mid += (target - h.mid) * (1 - Math.pow(0.01, dt));

    if (dive === 0) g.rotation.y = h.mid; // always faced away, leaning with the run
  });

  return (
    <group ref={group}>
      <RiggedPlayer poseRef={poseRef} kit={kits.player} ballRef={ballRef} body={squad.carrier} />
      <RugbyBall innerRef={ballRef} scale={0.9} />
    </group>
  );
}

/* ---------------- a pass between team-mates ----------------
   flat spin pass from the carrier to a support runner. the receiver is behind
   him (a legal rugby pass), and control transfers the moment it lands.
------------------------------------------------------------- */
function PassBall({ passRef, carrierXRef }) {
  const g = useRef();
  useFrame(() => {
    if (!g.current) return;
    const p = passRef.current;
    const t = clamp(p.t, 0, 1);
    g.current.visible = p.t < 1;
    if (p.t >= 1) return;
    const x = lerp(p.fromX, p.toX ?? p.fromX, t);
    const y = 1.15 + Math.sin(Math.PI * t) * 0.55;
    const z = lerp(0.1, 3.2, t);
    g.current.position.set(x, y, z);
    g.current.rotation.set(0.2, 0, t * 14 * p.side);
  });
  return <RugbyBall innerRef={g} scale={0.9} />;
}

/* ---------------- the incoming pass ----------------
   a spun pass on a flat arc from the right, timed so it lands in his hands
   exactly as the reach peaks.
------------------------------------------------------ */
function FlyingBall({ catchRef }) {
  const g = useRef();
  useFrame(() => {
    if (!g.current) return;
    const raw = clamp(catchRef.current, 0, 1);
    const t = clamp((raw - 0.15) / 0.85, 0, 1); // in the air from the kick, not from frame one
    g.current.visible = raw > 0.1 && raw < 1;
    if (raw >= 1) return;
    const u = 1 - t;
    // quadratic bezier: out wide, over, into the hands
    // an up-and-under: high in front of him, dropping steeply into his hands
    const p0 = [1.4, 12, 18];
    const p1 = [0.7, 7.4, 6];
    const p2 = [0.02, 1.5, 0.2];
    g.current.position.set(
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
      u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]
    );
    g.current.rotation.set(0.2, 0.55, t * 30);
  });
  return <RugbyBall innerRef={g} />;
}

/* ---------------- defenders ----------------
   a defender commits to a lane at LAUNCH_DIST and leaves the ground. once
   airborne it cannot change its mind, so a late juke beats it — and it can
   only reach an adjacent lane, so two lanes of separation always beats it.
------------------------------------------------ */
function Defender({ data, progressRef, carrierXRef, phaseRef, tryTRef, squad, ruckRef, kits }) {
  const inner = useRef();
  const pitch = useRef();
  const poseRef = useRef({ clip: "run", timeScale: 0.72, timeOffset: data.phase });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const dProg = progressRef.current - data.lastProg;
    data.lastProg = progressRef.current;
    const zEff = data.baseZ + data.adv + progressRef.current;
    const cx = carrierXRef.current;

    // he is down. the tackler holds his wrap; the two nearest arrive over the
    // ball to form the ruck; everyone else stands off.
    if (phaseRef?.current === "tackled") {
      if (data.kind === "tackler") return;
      const ruck = ruckRef?.current;
      if (data.ruck && ruck?.active && inner.current) {
        const tx = ruck.x + data.ruckSide;
        const tz = ruck.z - data.baseZ - progressRef.current - 0.55; // just short of the ball
        const dx = tx - inner.current.position.x;
        const dz = tz - inner.current.position.z;
        const gap = Math.hypot(dx, dz);
        const k = 1 - Math.pow(gap > 2 ? 0.05 : 0.25, dt);
        inner.current.position.x += dx * k;
        inner.current.position.z += dz * k;
        inner.current.position.y = 0;
        inner.current.rotation.x = 0;
        inner.current.rotation.z = 0;
        poseRef.current.clip = gap > 2.2 ? "run" : gap > 0.5 ? "walk" : "idle";
        poseRef.current.timeScale = 1;
        inner.current.rotation.y = lerp(
          inner.current.rotation.y,
          gap > 0.5 ? Math.atan2(dx, dz) : Math.PI,
          1 - Math.pow(0.05, dt)
        );
      } else {
        poseRef.current.clip = "idle";
        poseRef.current.timeScale = 1;
      }
      return;
    }

    // conceded: heads back under the posts to wait for the restart
    if (phaseRef?.current === "try") {
      const t = tryTRef?.current ?? 0;
      if (t > TRY_SEQ.gather && inner.current) {
        // the posts sit at TRY_LINE_Z inside this same scrolled frame
        const homeZ = TRY_LINE_Z - data.baseZ - 4;
        const homeX = data.postSlot;
        const k = 1 - Math.pow(0.5, dt);
        inner.current.position.x += (homeX - inner.current.position.x) * k;
        inner.current.position.z += (homeZ - inner.current.position.z) * k;
        inner.current.position.y = 0;
        inner.current.rotation.x = 0;
        inner.current.rotation.z = 0;
        const dz = homeZ - inner.current.position.z;
        const dxh = homeX - inner.current.position.x;
        const moving = Math.hypot(dxh, dz) > 0.6;
        poseRef.current.clip = moving ? "walk" : "idle";
        poseRef.current.timeScale = 1;
        inner.current.rotation.y = lerp(inner.current.rotation.y, moving ? Math.atan2(dxh, dz) : 0, 1 - Math.pow(0.05, dt));
      }
      return;
    }

    // eyes on the ball carrier: smooth yaw toward him at all times except
    // while chasing from behind
    const lookAt = (fromX, weight) => {
      const target = Math.PI + Math.atan2(cx - fromX, -zEff) * 0.85;
      data.yaw += (target - data.yaw) * (1 - Math.pow(weight, dt));
      return data.yaw;
    };

    if (data.kind === "tackler") {
      const t = clamp((zEff + LAUNCH_DIST) / LAUNCH_DIST, 0, 1);
      const tk = ss(clamp(data.tackleT, 0, 1));
      poseRef.current.clip = data.tackleT > 0 ? "throwing" : "takedown";
      poseRef.current.timeScale = data.tackleT > 0 ? 1.05 : 1.7;
      poseRef.current.timeOffset = 0;
      if (inner.current) {
        const toX = data.committedX ?? data.x;
        const e = ss(t);
        // finish just off his shoulder on the side the tackler came from, not
        // on top of him — otherwise the two meshes simply interpenetrate
        if (data.approach === undefined) data.approach = Math.sign(data.x - cx) || 1;
        const contactX = cx + data.approach * 0.42;
        const xNow = lerp(data.x + (toX - data.x) * e, contactX, tk);
        inner.current.position.x = xNow;
        inner.current.position.z =
          data.adv + lerp(e * 1.1, -data.baseZ - data.adv - progressRef.current + 0.55, tk);
        // square up on him through the hit
        inner.current.rotation.y = lookAt(xNow, tk > 0.05 ? 0.0006 : 0.005);
      }
      // and go to ground with him: the throw clip leaves him upright, and the
      // pinned hips mean he can never descend on his own, so tip him over the
      // top of the carrier as the tackle completes
      if (pitch.current) {
        pitch.current.rotation.x = -1.22 * tk;
        pitch.current.rotation.z = 0.18 * tk;
        pitch.current.position.y = 0.34 * tk;
      }
      return;
    }

    if (data.kind === "watcher") {
      if (zEff > -2.2 && data.chase === 0) data.chase = 0.0001;
      if (data.chase === 0) data.adv += Math.max(0, dProg) * 0.3; // still closing
      if (data.chase > 0) {
        data.chase = Math.min(1, data.chase + dt / 0.55);
        data.chaseOffset -= Math.max(0, dProg) * 0.45; // trails, never catching
      }
      const turning = data.chase > 0 && data.chase < 1;
      poseRef.current.clip = turning ? "sprintTurn" : "run";
      poseRef.current.timeScale = turning ? 1.5 : 0.95;
      if (inner.current) {
        inner.current.position.z = data.adv + data.chaseOffset;
        if (data.chase === 0) {
          inner.current.rotation.y = lookAt(data.x, 0.005);
        } else {
          // swing smoothly through the turn and settle facing downfield
          inner.current.rotation.y = data.yaw + (Math.PI - (data.yaw - Math.PI)) * ss(clamp(data.chase, 0, 1)) * 0 + Math.PI * ss(clamp(data.chase, 0, 1));
        }
      }
      return;
    }

    // undecided: jogging up to meet him, eyes on the ball — the inner men
    // drift between channels so the holes keep moving
    if (data.weave) {
      const w = data.weave;
      w.timer -= dt;
      if (w.timer <= 0) {
        w.timer = 1.1 + Math.random() * 1.3;
        // the deep men bias toward wherever the carrier is, then overshoot —
        // that is what makes them look like they are reading the run
        const bias = w.range > 6 ? (cx - data.x) * 0.5 : 0;
        w.target = clamp(data.x + bias + (Math.random() - 0.5) * w.range, w.lo, w.hi);
      }
      data.x += clamp(w.target - data.x, -1, 1) * w.speed * dt;
    }
    poseRef.current.clip = "run";
    poseRef.current.timeScale = 0.72;
    if (inner.current) {
      inner.current.position.x = data.x;
      inner.current.position.z = data.adv;
      inner.current.rotation.y = lookAt(data.x, 0.005);
    }
  });

  return (
    <group position={[0, 0, data.baseZ]}>
      {/* faces the oncoming carrier */}
      <group ref={inner} position={[data.x, 0, 0]} rotation={[0, Math.PI, 0]}>
        {/* separate pitch group: tipping him over here composes with the yaw
            above instead of fighting it through Euler order */}
        <group ref={pitch}>
          <RiggedPlayer poseRef={poseRef} kit={kits[data.role.kit]} body={squad.defender} />
        </group>
      </group>
    </group>
  );
}

/* ---------------- teammates ----------------
   two support runners in club colours. they track the carrier's run but never
   get the ball; when he scores they sprint in and celebrate over him.
--------------------------------------------- */
function Teammate({ idx, phaseRef, catchRef, carrierXRef, tryTRef, passRef, squad, ruckRef, kits }) {
  const slotRef = useRef(TEAM_SLOTS[idx]);
  const side = Math.sign(TEAM_SLOTS[idx]);
  const group = useRef();
  const poseRef = useRef({ clip: "backpedal", timeScale: 1 });
  const fallBack = useRef(0);
  const tookPass = useRef(false);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const cr = catchRef.current;

    // if the ball came to me, the carrier is now standing on my line — loop
    // round to the far side so we are not occupying the same patch of grass
    const pass = passRef?.current;
    if (pass && pass.t >= 1 && pass.recvIdx === idx && !tookPass.current) {
      tookPass.current = true;
      slotRef.current = -slotRef.current;
    }
    if (pass && pass.t < 1) tookPass.current = false;
    const slot = slotRef.current;

    if (phaseRef.current === "tackled") {
      const ruck = ruckRef?.current;
      const inRuck = ruck?.active && ruck.slots.includes(idx);
      if (inRuck) {
        // over the ball from his own side, cleaning out
        const seat = ruck.slots.indexOf(idx);
        const tx = ruck.x + (seat === 0 ? -0.8 : 0.8);
        const tz = ruck.z + 0.75;
        const dx = tx - g.position.x;
        const dz = tz - g.position.z;
        const gap = Math.hypot(dx, dz);
        const k = 1 - Math.pow(gap > 2 ? 0.05 : 0.25, dt);
        g.position.x += dx * k;
        g.position.z += dz * k;
        g.position.y = 0;
        poseRef.current.clip = gap > 2.2 ? "run" : gap > 0.5 ? "walk" : "idle";
        poseRef.current.timeScale = 1;
        g.rotation.y = lerp(g.rotation.y, gap > 0.5 ? Math.atan2(dx, dz) : 0, 1 - Math.pow(0.05, dt));
      } else {
        poseRef.current.clip = "idle";
        poseRef.current.timeScale = 1;
        g.position.y = 0;
      }
      return;
    }

    if (phaseRef.current === "try") {
      const t = tryTRef.current; // the carrier's clock — keeps the flip in sync
      // each man gets his own spot in the huddle, and none of them stands in a post
      const tx = clearOfPosts(carrierXRef.current + CELEBRATE_OFFSET[idx]);
      const tz = -2.1 + (idx % 2) * 0.7;
      const dx = tx - g.position.x;
      const dz = tz - g.position.z;
      const far = Math.hypot(dx, dz);
      const face = 1 - Math.pow(0.05, dt);

      const ph = side < 0 ? 0 : 2.1;
      if (t >= TRY_SEQ.gather && t < TRY_SEQ.disperse) {
        // he flips alone — they mob him, jumping and roaring
        const ct = t - TRY_SEQ.gather;
        poseRef.current.clip = "victory";
        poseRef.current.timeScale = side < 0 ? 1.3 : 1.0;
        poseRef.current.timeOffset = side < 0 ? 0 : 1.6;
        g.position.y = Math.abs(Math.sin(ct * 4.1 + ph)) * 0.32;
        g.position.x = clearOfPosts(tx + Math.sin(ct * 1.0 + ph) * 0.7);
        g.position.z = tz + Math.cos(ct * 1.25 + ph) * 0.6;
        g.rotation.y = Math.PI + Math.sin(ct * 0.9 + ph) * 0.8;
      } else if (t >= TRY_SEQ.disperse) {
        // still celebrating, but walking back to where they started
        const ct = t - TRY_SEQ.disperse;
        const homeX = slot;
        const homeZ = 2.7;
        const k = 1 - Math.pow(0.35, dt);
        g.position.x += (homeX - g.position.x) * k;
        g.position.z += (homeZ - g.position.z) * k;
        g.position.y = Math.abs(Math.sin(ct * 3.2 + ph)) * 0.16;
        poseRef.current.clip = "victory";
        poseRef.current.timeScale = 0.85;
        g.rotation.y = lerp(g.rotation.y, Math.PI, face);
      } else {
        // in he comes — running from deep, walking the last couple of metres
        const closing = far > 2.6;
        poseRef.current.clip = closing ? "run" : "walk";
        poseRef.current.timeScale = closing ? 1.05 + side * 0.04 : 1.2;
        poseRef.current.timeOffset = 0;
        // close the sideways gap first so nobody crosses the post line on a
        // diagonal and clips an upright
        g.position.x += dx * (1 - Math.pow(0.02, dt));
        g.position.z += dz * (1 - Math.pow(closing ? 0.06 : 0.2, dt));
        g.position.y = 0;
        // face the way he is travelling, then turn to the scorer as he arrives
        g.rotation.y = lerp(g.rotation.y, closing ? Math.atan2(dx, dz) : Math.PI, face);
      }
      return;
    }

    // with him for the catch — then he pulls away, stride by stride
    if (cr >= 1) fallBack.current = Math.min(1.8, fallBack.current + dt * 0.7);
    g.position.x += (carrierXRef.current * 0.4 + slot - g.position.x) * (1 - Math.pow(0.1, dt));
    g.position.z = 2.7 + fallBack.current;
    if (cr < 1) {
      poseRef.current.clip = "backpedal";
      poseRef.current.timeScale = 1.1;
    } else {
      poseRef.current.clip = "run";
      poseRef.current.timeScale = 1.04 + idx * 0.03; // desync the strides
    }
    g.rotation.y = lerp(g.rotation.y, 0, 1 - Math.pow(0.05, dt));
  });

  return (
    <group ref={group} position={[TEAM_SLOTS[idx], 0, 2.7]}>
      <RiggedPlayer poseRef={poseRef} kit={kits.player} body={squad.mate} />
    </group>
  );
}

/* ---------------- sideline media ----------------
   broadcast camera positions on the touchlines and a photographers' pit near
   the try line — cheap static props that sell the occasion.
-------------------------------------------------- */
function BroadcastCam({ x, z, carrierXRef, progressRef }) {
  const rig = useRef();
  const yaw = useRef(x > 0 ? -Math.PI / 2 : Math.PI / 2);
  useFrame((_, delta) => {
    if (!rig.current || !carrierXRef || !progressRef) return;
    const dt = Math.min(delta, 0.05);
    // the carrier lives at world z=0; in this scrolled frame that is -progress
    const dx = carrierXRef.current - x;
    const dz = -progressRef.current - z;
    const target = Math.atan2(dx, dz);
    yaw.current += (target - yaw.current) * (1 - Math.pow(0.02, dt));
    rig.current.rotation.y = yaw.current;
  });
  return (
    <group ref={rig} position={[x, 0, z]}>
      {/* riser */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.7, 0.2, 1.7]} />
        <meshStandardMaterial color="#1A1C20" roughness={0.9} />
      </mesh>
      {/* tripod legs */}
      {[-0.3, 0.3].map((lx) => (
        <mesh key={lx} position={[lx, 0.7, -0.12]} rotation={[0, 0, lx * 0.5]}>
          <cylinderGeometry args={[0.03, 0.045, 1.1, 8]} />
          <meshStandardMaterial color="#0E0F12" roughness={0.55} metalness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.7, 0.18]} rotation={[0.35, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 1.1, 8]} />
        <meshStandardMaterial color="#0E0F12" roughness={0.55} metalness={0.55} />
      </mesh>
      {/* camera body — broadcast black */}
      <mesh position={[0, 1.42, 0.08]}>
        <boxGeometry args={[0.32, 0.4, 0.95]} />
        <meshStandardMaterial color="#0B0C0E" roughness={0.45} />
      </mesh>
      {/* viewfinder hood */}
      <mesh position={[0, 1.68, -0.28]}>
        <boxGeometry args={[0.2, 0.16, 0.24]} />
        <meshStandardMaterial color="#0B0C0E" roughness={0.5} />
      </mesh>
      {/* lens hood */}
      <mesh position={[0, 1.42, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.38, 14]} />
        <meshStandardMaterial color="#050607" roughness={0.3} />
      </mesh>
      {/* glass */}
      <mesh position={[0, 1.42, 0.855]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.015, 14]} />
        <meshStandardMaterial color="#101820" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* operator — seated behind, all in black */}
      <group position={[0, 0, -0.7]}>
        {/* stool */}
        <mesh position={[0, 0.44, -0.1]}>
          <cylinderGeometry args={[0.16, 0.14, 0.06, 10]} />
          <meshStandardMaterial color="#26282C" roughness={0.8} />
        </mesh>
        {/* legs, bent to sit */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.1 * sd, 0.42, 0.13]} rotation={[1.35, 0, 0]}>
              <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
              <meshStandardMaterial color="#17181B" roughness={0.85} />
            </mesh>
            <mesh position={[0.1 * sd, 0.2, 0.24]} rotation={[0.15, 0, 0]}>
              <capsuleGeometry args={[0.05, 0.32, 4, 8]} />
              <meshStandardMaterial color="#17181B" roughness={0.85} />
            </mesh>
          </group>
        ))}
        {/* torso */}
        <mesh position={[0, 0.86, -0.04]} rotation={[-0.12, 0, 0]}>
          <capsuleGeometry args={[0.17, 0.36, 6, 10]} />
          <meshStandardMaterial color="#212327" roughness={0.85} />
        </mesh>
        {/* arms reaching to the pan bars */}
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.17 * sd, 0.98, 0.22]} rotation={[1.1, 0, -0.25 * sd]}>
            <capsuleGeometry args={[0.05, 0.42, 4, 8]} />
            <meshStandardMaterial color="#212327" roughness={0.85} />
          </mesh>
        ))}
        {/* head + headphones */}
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.105, 12, 12]} />
          <meshStandardMaterial color="#8A5A3B" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.34, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.026, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#0B0C0E" roughness={0.5} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.105 * sd, 1.29, 0]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial color="#0B0C0E" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Photographer({ x, z, vest, carrierXRef, progressRef }) {
  const rig = useRef();
  const yaw = useRef(0);
  useFrame((_, delta) => {
    if (!rig.current || !carrierXRef || !progressRef) return;
    const dt = Math.min(delta, 0.05);
    const dx = carrierXRef.current - x;
    const dz = -progressRef.current - z;
    const target = Math.atan2(dx, dz);
    yaw.current += (target - yaw.current) * (1 - Math.pow(0.02, dt));
    rig.current.rotation.y = yaw.current;
  });
  return (
    <group ref={rig} position={[x, 0, z]}>
      {/* kneeling: shin flat on the ground, other foot planted */}
      <mesh position={[0.09, 0.09, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.3, 4, 8]} />
        <meshStandardMaterial color="#17181B" roughness={0.85} />
      </mesh>
      <mesh position={[-0.12, 0.3, 0.1]} rotation={[0.9, 0, 0.15]}>
        <capsuleGeometry args={[0.055, 0.3, 4, 8]} />
        <meshStandardMaterial color="#17181B" roughness={0.85} />
      </mesh>
      {/* seat-on-heel torso, leaning into the shot */}
      <mesh position={[0, 0.58, 0]} rotation={[0.32, 0, 0]}>
        <capsuleGeometry args={[0.15, 0.34, 6, 10]} />
        <meshStandardMaterial color={vest} roughness={0.9} />
      </mesh>
      {/* both arms up holding the long lens */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.11 * sd, 0.82, 0.18]} rotation={[1.25, 0, -0.2 * sd]}>
          <capsuleGeometry args={[0.045, 0.3, 4, 8]} />
          <meshStandardMaterial color={vest} roughness={0.9} />
        </mesh>
      ))}
      {/* head tucked behind the body */}
      <mesh position={[0, 0.98, 0.03]}>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshStandardMaterial color="#A97852" roughness={0.85} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 1.03, 0.02]} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[0.098, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#101114" roughness={0.9} />
      </mesh>
      {/* camera body + the white super-tele */}
      <mesh position={[0, 0.9, 0.2]}>
        <boxGeometry args={[0.15, 0.12, 0.1]} />
        <meshStandardMaterial color="#0B0C0E" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, 0.5]} rotation={[Math.PI / 2 - 0.06, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.075, 0.5, 10]} />
        <meshStandardMaterial color="#DDD8CC" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.915, 0.77]} rotation={[Math.PI / 2 - 0.06, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.1, 10]} />
        <meshStandardMaterial color="#0B0C0E" roughness={0.3} />
      </mesh>
    </group>
  );
}

function SidelineMedia({ carrierXRef, progressRef }) {
  const t = { carrierXRef, progressRef };
  return (
    <group>
      <BroadcastCam x={-PITCH_HALF_W - 1.6} z={-18} {...t} />
      <BroadcastCam x={PITCH_HALF_W + 1.6} z={-34} {...t} />
      <BroadcastCam x={-PITCH_HALF_W - 1.6} z={-52} {...t} />
      {/* photographers kneel OUTSIDE the touchlines, level with the 22 and the
          try line — never in the in-goal where he dives */}
      {[
        [-PITCH_HALF_W - 1.2, -56],
        [-PITCH_HALF_W - 1.5, -61],
        [-PITCH_HALF_W - 1.3, -66],
        [PITCH_HALF_W + 1.2, -58],
        [PITCH_HALF_W + 1.5, -63],
        [PITCH_HALF_W + 1.3, -68],
      ].map(([x, z], i) => (
        <Photographer key={i} x={x} z={z} vest={i % 2 ? "#1C1E22" : "#26282E"} {...t} />
      ))}
    </group>
  );
}

/* ---------------- fireworks ---------------- */
const FIREWORK_COLORS = ["#C9A227", "#8C1D2E", "#3A78C9", "#6E2A9C", "#EDE8DC", "#E24A2B"];
const SPARKS = 1600;

function Fireworks({ activeRef }) {
  const geo = useRef();
  const positions = useMemo(() => new Float32Array(SPARKS * 3), []);
  const colors = useMemo(() => new Float32Array(SPARKS * 3), []);
  const parts = useMemo(
    () => Array.from({ length: SPARKS }, () => ({ life: 0, vx: 0, vy: 0, vz: 0, r: 0, g: 0, b: 0 })),
    []
  );
  const next = useRef(0);
  const timer = useRef(0);
  const wasActive = useRef(false);
  const rand = useMemo(() => rng(90210), []);
  const palette = useMemo(() => FIREWORK_COLORS.map((c) => new THREE.Color(c)), []);

  const burst = (cx, cy, cz, color, count, speed) => {
    for (let i = 0; i < count; i++) {
      const p = parts[next.current];
      const idx = next.current * 3;
      next.current = (next.current + 1) % SPARKS;
      // even-ish spread on a sphere
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const v = speed * (0.55 + rand() * 0.45);
      p.vx = r * Math.cos(th) * v;
      p.vy = u * v;
      p.vz = r * Math.sin(th) * v;
      p.life = 1;
      p.r = color.r; p.g = color.g; p.b = color.b;
      positions[idx] = cx;
      positions[idx + 1] = cy;
      positions[idx + 2] = cz;
    }
  };

  useFrame((state, delta) => {
    if (!geo.current) return;
    const dt = Math.min(delta, 0.05);
    const active = activeRef.current;

    if (active && !wasActive.current) {
      // opening volley the instant the ball is grounded
      wasActive.current = true;
      for (let i = 0; i < 3; i++) {
        burst(
          (i - 1) * 9 + (rand() - 0.5) * 4,
          9 + rand() * 6,
          -10 - rand() * 14,
          palette[Math.floor(rand() * palette.length)],
          130,
          6 + rand() * 3
        );
      }
      timer.current = 0.5;
    } else if (!active) {
      wasActive.current = false;
    }

    if (active) {
      timer.current -= dt;
      if (timer.current <= 0) {
        timer.current = 0.16 + rand() * 0.3;
        const color = palette[Math.floor(rand() * palette.length)];
        burst(
          (rand() - 0.5) * 26,
          8 + rand() * 12,
          -8 - rand() * 26,
          color,
          110 + Math.floor(rand() * 80),
          5 + rand() * 4
        );
      }
    }

    let anyAlive = false;
    for (let i = 0; i < SPARKS; i++) {
      const p = parts[i];
      const idx = i * 3;
      if (p.life <= 0) {
        colors[idx] = colors[idx + 1] = colors[idx + 2] = 0;
        continue;
      }
      anyAlive = true;
      p.life -= dt / 2.1;
      p.vy -= 5.2 * dt; // gravity, dialled back so the trails hang
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.vz *= 0.985;
      positions[idx] += p.vx * dt;
      positions[idx + 1] += p.vy * dt;
      positions[idx + 2] += p.vz * dt;
      // fade out, with a flicker on the tail
      const f = Math.max(0, p.life) * (0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 30 + i));
      colors[idx] = p.r * f;
      colors[idx + 1] = p.g * f;
      colors[idx + 2] = p.b * f;
    }

    if (anyAlive || active) {
      geo.current.attributes.position.needsUpdate = true;
      geo.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.34}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------- pitch + markings ---------------- */
function Line({ z, w = PITCH_HALF_W * 2, x = 0, len = 0.2, vertical = false }) {
  return (
    <mesh position={[x, 0.012, z]}>
      <boxGeometry args={vertical ? [len, 0.01, w] : [w, 0.01, len]} />
      <meshStandardMaterial color="#EDE8DC" roughness={0.9} />
    </mesh>
  );
}

function Pitch() {
  const turf = useMemo(makeTurfTexture, []);
  const stripes = useMemo(() => {
    const out = [];
    for (let z = 24; z > DEAD_BALL_Z - 12; z -= 5) out.push(z);
    return out;
  }, []);
  return (
    <group>
      {/* turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]} receiveShadow>
        <planeGeometry args={[PITCH_HALF_W * 2 + 26, 220]} />
        <meshStandardMaterial map={turf} color="#ffffff" roughness={0.92} />
      </mesh>
      {/* mown stripes */}
      {stripes.map((z, i) =>
        i % 2 === 0 ? (
          <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, z]} receiveShadow>
            <planeGeometry args={[PITCH_HALF_W * 2, 5]} />
            <meshStandardMaterial map={turf} color="#d8f0c8" roughness={0.92} transparent opacity={0.5} />
          </mesh>
        ) : null
      )}
      {/* in-goal is a darker shade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, (TRY_LINE_Z + DEAD_BALL_Z) / 2]} receiveShadow>
        <planeGeometry args={[PITCH_HALF_W * 2, DEAD_BALL_Z - TRY_LINE_Z]} />
        <meshStandardMaterial map={turf} color="#b6d0a4" roughness={0.92} />
      </mesh>

      {/* touch lines */}
      <Line vertical x={-PITCH_HALF_W} z={-24} w={190} len={0.22} />
      <Line vertical x={PITCH_HALF_W} z={-24} w={190} len={0.22} />
      {/* halfway, 10m, 22m */}
      <Line z={-8} />
      <Line z={-46} />
      <Line z={DEAD_BALL_Z} />
      {/* try line */}
      <mesh position={[0, 0.016, TRY_LINE_Z]}>
        <boxGeometry args={[PITCH_HALF_W * 2, 0.012, 0.45]} />
        <meshStandardMaterial color="#EDE8DC" emissive="#EDE8DC" emissiveIntensity={0.35} />
      </mesh>
      {/* dashed 5m channels */}
      {[-5, 5].map((x) =>
        Array.from({ length: 16 }, (_, i) => (
          <mesh key={`${x}-${i}`} position={[x, 0.012, 8 - i * 6]}>
            <boxGeometry args={[0.16, 0.01, 1.1]} />
            <meshStandardMaterial color="#EDE8DC" opacity={0.55} transparent />
          </mesh>
        ))
      )}
      <GoalPosts />
    </group>
  );
}

function GoalPosts() {
  const post = "#EDE8DC";
  return (
    <group position={[0, 0, TRY_LINE_Z]}>
      {[-2.8, 2.8].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 5, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 10, 10]} />
            <meshStandardMaterial color={post} roughness={0.6} />
          </mesh>
          {/* pad */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 2, 10]} />
            <meshStandardMaterial color="#6E1423" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 5.6, 10]} />
        <meshStandardMaterial color={post} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ---------------- stadium ----------------
   a full three-deck bowl. seats are one InstancedMesh (~12k) with the sway
   done in a vertex-shader patch, so the crowd moves without touching a
   single matrix on the CPU.
------------------------------------------- */
const STAND_INNER_X = PITCH_HALF_W + 5;
const STAND_Z_FAR = DEAD_BALL_Z - 2.5; // tight behind the in-goal
const STAND_Z_NEAR = 40;
const SEAT_GAP = 0.68;
const DECKS = [
  { rows: 10, y0: 1.8, rise: 0.62, run: 0.86, off: 0 },
  { rows: 9, y0: 12.0, rise: 0.66, run: 0.9, off: 3.4 },
  { rows: 8, y0: 21.5, rise: 0.7, run: 0.95, off: 7.6 },
];
const BOWL_MAX_X = STAND_INNER_X + 7.6 + 7 * 0.95;
const BOWL_MAX_Y = 21.5 + 7 * 0.7;

function deckRows() {
  const out = [];
  for (const d of DECKS) {
    for (let r = 0; r < d.rows; r++) {
      out.push({ y: d.y0 + r * d.rise, off: d.off + r * d.run, run: d.run, rise: d.rise });
    }
  }
  return out;
}

function Stands({ fans }) {
  const rows = useMemo(deckRows, []);

  // seat positions, packed as x,y,z,scale,colorIndex
  const { data, count } = useMemo(() => {
    const rand = rng(20260817);
    const arr = [];
    let n = 0;
    const put = (x, y, z) => {
      // bay identity: ~8m blocks along the stand; most bays are home (black),
      // every third is away (green/gold), with ~15% defectors mixed in
      const bay = Math.floor((x + z * 0.31) / 8);
      const homeBay = ((bay % 3) + 3) % 3 !== 1;
      const home = rand() < 0.15 ? !homeBay : homeBay;
      arr.push(x, y, z, 0.82 + rand() * 0.34, (home ? 0 : 4) + Math.floor(rand() * 4));
      n++;
    };
    for (const row of rows) {
      // both touchlines
      for (const side of [-1, 1]) {
        const x = side * (STAND_INNER_X + row.off);
        for (let z = STAND_Z_NEAR; z > STAND_Z_FAR; z -= SEAT_GAP) {
          if (rand() > 0.94) continue; // empty seats break up the grid
          put(x + (rand() - 0.5) * 0.22, row.y + 0.42 + (rand() - 0.5) * 0.06, z + (rand() - 0.5) * 0.2);
        }
      }
      // dead-ball end
      const z = STAND_Z_FAR - row.off;
      for (let x = -BOWL_MAX_X; x < BOWL_MAX_X; x += SEAT_GAP) {
        if (rand() > 0.94) continue;
        put(x + (rand() - 0.5) * 0.2, row.y + 0.42 + (rand() - 0.5) * 0.06, z + (rand() - 0.5) * 0.22);
      }
      // corners — quarter arcs joining the touchline stands to the end
      const cr = row.off + 2.2;
      const steps = Math.max(3, Math.round((Math.PI / 2) * cr / SEAT_GAP));
      for (const side of [-1, 1]) {
        for (let k = 1; k < steps; k++) {
          const a = (k / steps) * (Math.PI / 2);
          if (rand() > 0.94) continue;
          put(
            side * (STAND_INNER_X - 2.2 + Math.cos(a) * cr),
            row.y + 0.42 + (rand() - 0.5) * 0.06,
            STAND_Z_FAR + 2.2 - Math.sin(a) * cr
          );
        }
      }
    }
    return { data: new Float32Array(arr), count: n };
  }, [rows]);

  const crowdRef = useRef();
  const headRef = useRef();
  const shaderRef = useRef(null);
  const headShaderRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = crowdRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    // 0-3 home supporters, 4-7 away supporters
    const palette = [...fans.home, ...fans.away];
    const cols = palette.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const o = i * 5;
      dummy.position.set(data[o], data[o + 1], data[o + 2]);
      dummy.rotation.set(0, data[o] * 0.04, 0);
      dummy.scale.setScalar(data[o + 3]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.copy(cols[data[o + 4]]).multiplyScalar(0.8 + (i % 7) * 0.05);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // heads sit on the same seats, in assorted skin tones
    const heads = headRef.current;
    if (heads) {
      const tones = ["#C9976B", "#8A5A3B", "#E0B48C", "#5E3A24", "#A97852", "#F0CBA4"];
      const tc = tones.map((t) => new THREE.Color(t));
      for (let i = 0; i < count; i++) {
        const o = i * 5;
        dummy.position.set(data[o], data[o + 1] + 0.4 * data[o + 3], data[o + 2]);
        dummy.rotation.set(0, data[o] * 0.04, 0);
        dummy.scale.setScalar(data[o + 3]);
        dummy.updateMatrix();
        heads.setMatrixAt(i, dummy.matrix);
        heads.setColorAt(i, tc[(i * 7 + (data[o + 4] | 0)) % tc.length]);
      }
      heads.instanceMatrix.needsUpdate = true;
      if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
    }
  }, [data, count, fans]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = t;
    if (headShaderRef.current) headShaderRef.current.uniforms.uTime.value = t;
  });

  // sway the whole crowd in the vertex shader — 12k people, zero CPU cost
  const makePatch = (target) => (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader =
      "uniform float uTime;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float ph = instanceMatrix[3][0] * 1.7 + instanceMatrix[3][2] * 0.9;
         transformed.y += sin(uTime * 1.9 + ph) * 0.05;
         transformed.x += sin(uTime * 1.15 + ph * 1.7) * 0.025;`
      );
    target.current = shader;
  };
  const patchCrowd = makePatch(shaderRef);
  const patchHeads = makePatch(headShaderRef);

  return (
    <group>
      {/* raked decks */}
      {rows.map((row, j) => (
        <group key={j}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (STAND_INNER_X + row.off), row.y, (STAND_Z_NEAR + STAND_Z_FAR) / 2]}>
              <boxGeometry args={[row.run, row.rise, STAND_Z_NEAR - STAND_Z_FAR]} />
              <meshStandardMaterial color={j % 2 ? "#2A2F36" : "#333941"} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[0, row.y, STAND_Z_FAR - row.off]}>
            <boxGeometry args={[BOWL_MAX_X * 2, row.rise, row.run]} />
            <meshStandardMaterial color={j % 2 ? "#2A2F36" : "#333941"} roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* the crowd — bodies and heads sway together */}
      {/* rounded torsos with shoulders read as people, not crates */}
      <instancedMesh ref={crowdRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <capsuleGeometry args={[0.15, 0.3, 3, 8]} />
        <meshStandardMaterial roughness={0.9} onBeforeCompile={patchCrowd} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.095, 8, 7]} />
        <meshStandardMaterial roughness={0.95} onBeforeCompile={patchHeads} />
      </instancedMesh>

      {/* deck fascias — the blue banding that reads as tier advertising */}
      {[12.0, 21.5].map((y, i) => (
        <group key={i}>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (STAND_INNER_X + (i ? 3.4 : 0) - 0.6), y - 0.9, (STAND_Z_NEAR + STAND_Z_FAR) / 2]}
            >
              <boxGeometry args={[0.3, 1.8, STAND_Z_NEAR - STAND_Z_FAR]} />
              <meshStandardMaterial color="#1B3A8C" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, y - 0.9, STAND_Z_FAR - (i ? 3.4 : 0) + 0.6]}>
            <boxGeometry args={[BOWL_MAX_X * 2, 1.8, 0.3]} />
            <meshStandardMaterial color="#1B3A8C" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* pitchside boards */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (PITCH_HALF_W + 3.4), 0.4, -24]}>
          <boxGeometry args={[0.22, 0.8, 150]} />
          <meshStandardMaterial color="#131A2E" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.4, DEAD_BALL_Z - 1.2]}>
        <boxGeometry args={[BOWL_MAX_X * 2, 0.8, 0.22]} />
        <meshStandardMaterial color="#131A2E" roughness={0.7} />
      </mesh>

      {/* roof ring + trusses */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (BOWL_MAX_X - 4), BOWL_MAX_Y + 5.2, (STAND_Z_NEAR + STAND_Z_FAR) / 2]} rotation={[0, 0, side * 0.07]}>
            <boxGeometry args={[19, 0.45, STAND_Z_NEAR - STAND_Z_FAR]} />
            <meshStandardMaterial color="#5A6068" roughness={0.7} metalness={0.35} />
          </mesh>
          {/* truss ribs */}
          {Array.from({ length: 22 }, (_, i) => (
            <mesh
              key={i}
              position={[side * (BOWL_MAX_X - 4), BOWL_MAX_Y + 4.4, STAND_Z_NEAR - 5.5 - i * 5.5]}
              rotation={[0, 0, side * 0.07]}
            >
              <boxGeometry args={[20, 1.2, 0.3]} />
              <meshStandardMaterial color="#666D77" roughness={0.8} metalness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, BOWL_MAX_Y + 5.2, STAND_Z_FAR - 9]}>
        <boxGeometry args={[BOWL_MAX_X * 2, 0.45, 17]} />
        <meshStandardMaterial color="#5A6068" roughness={0.7} metalness={0.35} />
      </mesh>

      {/* big screen on the dead-ball end — fed by the side camera */}
      <Jumbotron />

      {/* floodlight masts */}
      {[
        [-BOWL_MAX_X - 6, 14],
        [BOWL_MAX_X + 6, 14],
        [-BOWL_MAX_X - 6, STAND_Z_FAR - 10],
        [BOWL_MAX_X + 6, STAND_Z_FAR - 10],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 19, 0]}>
            <cylinderGeometry args={[0.3, 0.5, 38, 8]} />
            <meshStandardMaterial color="#20242A" roughness={0.85} metalness={0.5} />
          </mesh>
          <mesh position={[0, 39.5, 0]} rotation={[0.4, x > 0 ? -0.5 : 0.5, 0]}>
            <boxGeometry args={[7, 4, 0.5]} />
            <meshStandardMaterial color="#FBF7E8" emissive="#FBF7E8" emissiveIntensity={2.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Sky() {
  const tex = useMemo(makeSkyTexture, []);
  return (
    <mesh>
      <sphereGeometry args={[420, 32, 20]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} toneMapped={false} />
    </mesh>
  );
}

/* ---------------- jumbotron ----------------
   a second camera side-on to the carrier renders the scene into a texture that
   is mapped onto the big screen, so the board shows the broadcast angle. it
   runs at quarter res on alternate frames, and hides itself while rendering so
   it does not recurse.
--------------------------------------------- */
function Jumbotron() {
  const { gl, scene } = useThree();
  const screen = useRef();
  const parity = useRef(0);
  const target = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(480, 270);
    t.texture.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const cam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(26, 16 / 9, 0.5, 400);
    return c;
  }, []);

  useEffect(() => () => target.dispose(), [target]);

  useFrame(() => {
    parity.current = (parity.current + 1) % 3;
    if (parity.current) return; // 20fps on the big screen is plenty, and it is a full scene re-render
    if (!screen.current) return;
    // side-on broadcast angle tracking the carrier at the world origin
    cam.position.set(13, 2.5, 0.8);
    cam.lookAt(0, 1.15, -2.2);
    screen.current.visible = false;
    const prev = gl.getRenderTarget();
    const autoShadow = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false; // reuse the shadow map from the main pass
    gl.setRenderTarget(target);
    gl.render(scene, cam);
    gl.setRenderTarget(prev);
    gl.shadowMap.autoUpdate = autoShadow;
    screen.current.visible = true;
  });

  return (
    <group position={[0, 16, STAND_Z_FAR - 2]}>
      {/* housing */}
      <mesh>
        <boxGeometry args={[21, 11.6, 0.7]} />
        <meshStandardMaterial color="#0B0C0E" roughness={0.7} />
      </mesh>
      {/* live feed */}
      <mesh ref={screen} position={[0, 0.5, 0.38]}>
        <planeGeometry args={[19.2, 9.2]} />
        <meshBasicMaterial map={target.texture} toneMapped={false} />
      </mesh>
      {/* score strip under the feed */}
      <mesh position={[0, -4.9, 0.38]}>
        <planeGeometry args={[19.2, 1.5]} />
        <meshStandardMaterial color="#0E1626" emissive="#16305E" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* ---------------- camera + scene ---------------- */
function CameraRig({ carrierXRef, phaseRef, diveRef, catchRef }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.2, -10));
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const scored = phaseRef.current === "try";
    const contact = phaseRef.current === "contact" || phaseRef.current === "tackled";
    const dive = clamp(diveRef.current, 0, 1);
    const laneX = carrierXRef.current;
    // during the catch, drift right so the incoming pass is in frame
    const catching = clamp(1 - Math.abs(clamp(catchRef.current, 0, 2) - 0.55) / 0.85, 0, 1);
    const targetX = scored ? laneX * 0.45 : laneX * 0.62;
    // pull back and drop for the dive, then tilt up to the fireworks
    const targetY = scored ? 4.0 : contact ? 4.2 : 3.7 - dive * 0.8 + catching * 0.45;
    const targetZ = scored ? 9.0 : contact ? 10.4 : 9.4 + dive * 2.0;
    const ease = 1 - Math.pow(scored ? 0.06 : 0.001, dt);
    camera.position.x += (targetX - camera.position.x) * ease;
    camera.position.y += (targetY - camera.position.y) * ease;
    camera.position.z += (targetZ - camera.position.z) * ease;
    const lookEase = 1 - Math.pow(0.004, dt);
    look.current.x += ((scored ? laneX * 0.5 : laneX * 0.8) - look.current.x) * lookEase;
    const slowEase = 1 - Math.pow(scored ? 0.06 : 0.004, dt);
    look.current.y += ((scored ? 5.5 : contact ? 0.8 : 1.2 + catching * 3.0) - look.current.y) * slowEase;
    look.current.z += ((scored ? -26 : -10) - look.current.z) * slowEase;
    camera.lookAt(look.current);
  });
  return null;
}

function World({ progressRef, defendersRef, carrierXRef, phaseRef, tryTRef, squad, ruckRef, kits, fans }) {
  const world = useRef();
  useFrame(() => {
    if (world.current) world.current.position.z = progressRef.current;
  });
  return (
    <group ref={world}>
      <Pitch />
      <Stands fans={fans} />
      <SidelineMedia carrierXRef={carrierXRef} progressRef={progressRef} />
      {defendersRef.current.map((d, i) => (
        <Defender key={i} data={d} progressRef={progressRef} carrierXRef={carrierXRef} phaseRef={phaseRef} tryTRef={tryTRef} squad={squad} ruckRef={ruckRef} kits={kits} />
      ))}
    </group>
  );
}

function Scene({ carrierXRef, steerRef, passRef, progressRef, defendersRef, hitFlashRef, diveRef, phaseRef, fireworksRef, catchRef, downRef, tryTRef, figure, ruckRef, kits, fans }) {
  const squad = SQUADS[figure] || SQUADS.p1;
  return (
    <>
      <fog attach="fog" args={["#7d8f9b", 90, 320]} />
      <Sky />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["#BFD6EA", "#4E6B44", 1.5]} />
      {/* key floodlight — the only shadow caster, boxed tight around the play */}
      <directionalLight
        position={[22, 40, 16]}
        intensity={2.5}
        color="#FFF6E2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-24, 32, -14]} intensity={1.0} color="#CFE0FF" />
      <directionalLight position={[0, 20, -40]} intensity={0.6} color="#FFF0C4" />
      <CameraRig carrierXRef={carrierXRef} phaseRef={phaseRef} diveRef={diveRef} catchRef={catchRef} />
      <World progressRef={progressRef} defendersRef={defendersRef} carrierXRef={carrierXRef} phaseRef={phaseRef} tryTRef={tryTRef} squad={squad} ruckRef={ruckRef} kits={kits} fans={fans} />
      <Runner carrierXRef={carrierXRef} steerRef={steerRef} passRef={passRef} hitFlashRef={hitFlashRef} diveRef={diveRef} catchRef={catchRef} downRef={downRef} phaseRef={phaseRef} tryTRef={tryTRef} squad={squad} kits={kits} />
      <PassBall passRef={passRef} carrierXRef={carrierXRef} />
      {TEAM_SLOTS.map((_, i) => (
        <Teammate
          key={i}
          idx={i}
          phaseRef={phaseRef}
          catchRef={catchRef}
          carrierXRef={carrierXRef}
          tryTRef={tryTRef}
          passRef={passRef}
          squad={squad}
          ruckRef={ruckRef}
          kits={kits}
        />
      ))}
      <FlyingBall catchRef={catchRef} />
      <Fireworks activeRef={fireworksRef} />
    </>
  );
}

export default function EnterThePitch() {
  const [phase, setPhase] = useState("start"); // start | running | diving | tackled | try
  const [beaten, setBeaten] = useState(0);
  const [figure, setFigure] = useState("p1");
  const [homeColour, setHomeColour] = useState("black");
  const awayColour = opponentOf(homeColour);
  const kits = useMemo(() => buildKits(homeColour, awayColour), [homeColour, awayColour]);
  const fans = useMemo(
    () => ({ home: PALETTES[homeColour].fans, away: PALETTES[awayColour].fans }),
    [homeColour, awayColour]
  );
  const [runId, setRunId] = useState(0);

  // widen to the full field on desktop
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
  if (isDesktop) STEER_HALF = 7.0;
  const carrierXRef = useRef(0); // where he actually is, metres from centre
  const steerRef = useRef(0); // -1..1 input from keys / tilt / drag
  const passRef = useRef({ t: 1, side: 0, fromX: 0 }); // t<1 while a pass is in the air
  const driftRef = useRef(0);
  const tryTRef = useRef(0); // shared celebration clock
  const ruckRef = useRef({ active: false, x: 0, z: 0, slots: [] }); // contact point
  const progressRef = useRef(0);
  const hitFlashRef = useRef(0);
  const diveRef = useRef(0);
  const catchRef = useRef(2);
  const downRef = useRef(0);
  const tacklerRef = useRef(null);
  const phaseRef = useRef("start");
  const fireworksRef = useRef(false);
  const makeDefenders = () => {
    const out = [];
    const mk = (x, z, role) =>
      out.push({
        x,
        baseZ: z + (Math.random() - 0.5) * 3, // stagger so the shots come in waves
        role,
        kind: null, // decided at the commit window: 'tackler' | 'watcher'
        committed: null,
        result: null, // null | 'caught' | 'beaten'
        tackleT: 0,
        chase: 0,
        chaseOffset: 0,
        adv: 0,
        lastProg: 0,
      });
    // a different defensive shape every run — holes to run through, or space
    // out wide. mix it up.
    const FORMS = [
      [-5.6, -3.4, -1.2, 1.2, 3.4], // space right
      [-3.4, -1.2, 1.2, 3.4, 5.6], // space left
      [-5.8, -3.6, 0, 3.6, 5.8], // gaps either side of the middle man
      [-6.2, -4.2, -2.0, 2.4, 4.8], // hole right of centre
      [-4.8, -2.4, 2.0, 4.2, 6.2], // hole left of centre
    ];
    const form = FORMS[Math.floor(Math.random() * FORMS.length)];
    const VK = ["defender", "defenderB", "defenderC"];
    form.forEach((x, i) => mk(x + (Math.random() - 0.5) * 0.5, -32, { kit: VK[i % 3] }));
    // the inner three of the line swap channels on the way up — the holes move.
    // the sweeper and the fullback roam wider and slower, so covering one
    // channel opens another behind it.
    out.forEach((d, i) => {
      if (i >= 1 && i <= 3) {
        d.weave = { target: d.x, timer: 0.5 + Math.random() * 1.2, range: 4.5, speed: 1.4, lo: -5.5, hi: 5.5 };
      } else if (i >= 5) {
        d.weave = { target: d.x, timer: 0.9 + Math.random() * 1.4, range: 8.5, speed: 2.1, lo: -7.5, hi: 7.5 };
      }
    });
    // sweeper behind the line
    mk((Math.random() - 0.5) * 5.5, -46, { kit: "defenderB" });
    // fullback — the last man, waiting to hunt
    mk((Math.random() - 0.5) * 4.4, -58, { kit: "fullback" });
    out.forEach((d, i) => {
      d.wave = i < 5 ? 0 : i === 5 ? 1 : 2;
      d.phase = Math.random() * 1.4; // desync the stride cycles
      d.postSlot = (i - 3) * 1.5; // where he'll stand under the posts after a try
      d.yaw = Math.PI;
    });
    return out;
  };
  const defendersRef = useRef(makeDefenders());
  const speedRef = useRef(0.11);
  const beatenRef = useRef(0);
  const runningRef = useRef(false);
  const lastTsRef = useRef(0);

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") steerRef.current = -1;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") steerRef.current = 1;
      // Q/E: sling it to the support runner on that side
      const k = e.key.toLowerCase();
      if ((k === "q" || k === "e") && phaseRef.current === "running" && catchRef.current >= 1 && passRef.current.t >= 1 && diveRef.current === 0) {
        const side = k === "q" ? -1 : 1;
        const tgt = passTarget(carrierXRef.current, side);
        passRef.current = { t: 0, side, fromX: carrierXRef.current, toX: tgt.x, recvIdx: tgt.idx };
      }
    }
    function onKeyUp(e) {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        if (steerRef.current < 0) steerRef.current = 0;
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        if (steerRef.current > 0) steerRef.current = 0;
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    // phone tilt: lean left/right to pick the lane
    function onTilt(e) {
      if (phaseRef.current !== "running") return;
      const g = e.gamma;
      if (g == null) return;
      steerRef.current = clamp(g / 20, -1, 1); // lean angle steers proportionally
    }
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  useEffect(() => () => (runningRef.current = false), []);

  // drag steering
  const dragRef = useRef({ dragging: false, lastX: 0 });
  function onPointerDown(e) {
    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
  }
  function onPointerMove(e) {
    if (!dragRef.current.dragging || phaseRef.current !== "running") return;
    const dx = e.clientX - dragRef.current.lastX;
    dragRef.current.lastX = e.clientX;
    steerRef.current = clamp(steerRef.current + dx * 0.03, -1, 1);
  }
  function onPointerUp() {
    dragRef.current.dragging = false;
    steerRef.current = 0;
  }

  function start() {
    // iOS requires the permission request to come from a user gesture
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
      DeviceOrientationEvent.requestPermission().catch(() => {});
    }
    carrierXRef.current = 0;
    steerRef.current = 0;
    passRef.current = { t: 1, side: 0, fromX: 0, toX: 0, recvIdx: -1 };
    driftRef.current = 0;
    tryTRef.current = 0;
    ruckRef.current = { active: false, x: 0, z: 0, slots: [] };
    progressRef.current = 0;
    diveRef.current = 0;
    catchRef.current = 0;
    downRef.current = 0;
    tacklerRef.current = null;
    hitFlashRef.current = 0;
    beatenRef.current = 0;
    fireworksRef.current = false;
    speedRef.current = 0.11;
    setBeaten(0);
    defendersRef.current = makeDefenders();
    setRunId((n) => n + 1); // remount so beaten kits and dive state reset
    runningRef.current = true;
    lastTsRef.current = 0;
    setPhaseBoth("catch");
    requestAnimationFrame(gameLoop);
  }

  function gameLoop(ts) {
    if (!runningRef.current) return;
    // frame-rate independent: speedRef is units per 60hz frame
    const dt = lastTsRef.current ? Math.min((ts - lastTsRef.current) / 16.667, 3) : 1;
    lastTsRef.current = ts;
    progressRef.current += speedRef.current * dt;

    if (phaseRef.current === "contact") {
      // ride the tackle out before the overlay lands
      const d = tacklerRef.current;
      if (d) d.tackleT = Math.min(1, d.tackleT + dt / 100);
      downRef.current = Math.min(1, downRef.current + dt / 100);
      if (downRef.current >= 1) {
        runningRef.current = false;
        setPhaseBoth("tackled");
        return;
      }
      requestAnimationFrame(gameLoop);
      return;
    }

    if (phaseRef.current === "catch") {
      // walking back under the kick: the drift eases in and out, no steps
      const c = catchRef.current;
      const want = c > 0.02 && c < 0.8 ? 1 : 0;
      driftRef.current += (want - driftRef.current) * Math.min(1, 0.055 * dt);
      progressRef.current -= speedRef.current * dt * 1.55 * driftRef.current;
      catchRef.current = Math.min(1, catchRef.current + dt / 105);
      if (catchRef.current >= 1) setPhaseBoth("running");
      requestAnimationFrame(gameLoop);
      return;
    }

    // tuck the ball away over the next few strides
    if (catchRef.current < 2) catchRef.current = Math.min(2, catchRef.current + dt / 26);

    if (phaseRef.current === "diving") {
      diveRef.current = Math.min(1, diveRef.current + dt / 48);
      speedRef.current *= Math.pow(0.955, dt); // slow as he goes to ground
      if (diveRef.current >= 1) {
        runningRef.current = false;
        fireworksRef.current = true;
        setPhaseBoth("try");
        return;
      }
      requestAnimationFrame(gameLoop);
      return;
    }

    for (const d of defendersRef.current) {
      const z = d.baseZ + d.adv + progressRef.current;

      // the line advances to meet him until each man makes his decision
      if (d.kind === null) {
        // the line RUNS up to meet him; the fullback launches the moment the
        // first line is engaged
        if (d.wave === 2 && !d.charge && defendersRef.current.some((m) => m.wave === 0 && m.kind !== null)) d.charge = true;
        d.adv += (d.charge ? 0.05 : 0.024) * dt;
        if (z > -LAUNCH_DIST) {
          const cx = carrierXRef.current;
          if (Math.abs(cx - d.x) <= TACKLE_REACH + 0.6) {
            d.kind = "tackler";
            // he shoots at where the carrier IS — reach-limited from his spot
            d.committedX = clamp(cx, d.x - TACKLE_REACH, d.x + TACKLE_REACH);
          } else {
            d.kind = "watcher"; // out of reach: turn and chase
          }
        }
      }

      // the shot lands only if the carrier is still near where he committed AND
      // still has the ball. get it away in time and the tackler hits nobody —
      // the support runner takes it on and the move stays alive.
      if (d.kind === "tackler" && d.result === null && z > -CONTACT_Z) {
        const released = passRef.current.t < 1; // ball is in the air
        if (!released && Math.abs(carrierXRef.current - d.committedX) < CONTACT_RADIUS) {
          d.result = "caught";
          hitFlashRef.current = 26;
          tacklerRef.current = d;
          // ONE man makes the tackle. anyone else already committed is a miss
          // and peels away, rather than piling onto the same square metre.
          for (const o of defendersRef.current) {
            if (o !== d && o.result === null && o.kind === "tackler") {
              o.result = "beaten";
              o.kind = "watcher";
              if (o.chase === 0) o.chase = 0.0001;
            }
          }
          // a ruck forms: the nearest two from each side arrive over the ball
          const cx = carrierXRef.current;
          ruckRef.current = { active: true, x: cx, z: 1.15, slots: [] };
          defendersRef.current.forEach((o) => (o.ruck = false));
          defendersRef.current
            .filter((o) => o !== d)
            .sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx))
            .slice(0, 2)
            .forEach((o, i) => {
              o.ruck = true;
              o.ruckSide = i === 0 ? -0.75 : 0.75;
            });
          ruckRef.current.slots = TEAM_SLOTS.map((slot, i) => ({ i, d: Math.abs(cx * 0.4 + slot - cx) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 2)
            .map((e) => e.i);
          speedRef.current = 0; // he is stopped dead on contact
          setPhaseBoth("contact");
          requestAnimationFrame(gameLoop);
          return;
        }
        d.result = "beaten";
        beatenRef.current += 1;
        setBeaten(beatenRef.current);
      }
    }

    if (TRY_LINE_Z + progressRef.current >= -DIVE_TRIGGER) {
      setPhaseBoth("diving");
    }

    requestAnimationFrame(gameLoop);
  }

  const inPlay = phase === "catch" || phase === "running" || phase === "diving" || phase === "contact";

  return (
    <div
      className="w-full flex flex-col items-center"
      style={{
        background: "#0A0D0A",
        color: "#EDE8DC",
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
        padding: "20px 12px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Great+Vibes&family=IBM+Plex+Mono:wght@500&display=swap');
        .display { font-family:'Anton',sans-serif; text-transform:uppercase; letter-spacing:0.01em; }
        .mono { font-family:'IBM Plex Mono',monospace; letter-spacing:0.04em; }
        .script { font-family:'Great Vibes',cursive; text-transform:none; letter-spacing:0.01em; line-height:1.05; }
        @keyframes popIn { from { opacity:0; transform:scale(0.86) } to { opacity:1; transform:scale(1) } }
        .pop { animation: popIn 0.45s cubic-bezier(.2,1.5,.4,1) both; }
      `}</style>

      <div className="text-center mb-3">
        <div className="mono text-xs" style={{ color: "#C9A227", letterSpacing: "0.2em" }}>
          VORTEX RUGBY
        </div>
        <h1 className="display" style={{ fontSize: "clamp(24px,5vw,36px)" }}>
          Enter The Pitch
        </h1>
      </div>

      <div
        className="relative w-full"
        style={isDesktop ? {
          maxWidth: "1560px",
          height: "min(84vh, 900px)",
          border: "1px solid rgba(237,232,220,0.15)",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "grab",
          touchAction: "none",
        } : {
          maxWidth: "440px",
          aspectRatio: "9/14",
          border: "1px solid rgba(237,232,220,0.15)",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "grab",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 3.7, 9.4], fov: 54 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }}
        >
          <Scene
            key={runId}
            carrierXRef={carrierXRef}
            steerRef={steerRef}
            passRef={passRef}
            tryTRef={tryTRef}
            figure={figure}
            ruckRef={ruckRef}
            kits={kits}
            fans={fans}
            progressRef={progressRef}
            defendersRef={defendersRef}
            hitFlashRef={hitFlashRef}
            diveRef={diveRef}
            phaseRef={phaseRef}
            fireworksRef={fireworksRef}
            catchRef={catchRef}
            downRef={downRef}
          />
        </Canvas>

        {/* HUD */}
        {inPlay && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-between px-4 py-3 mono text-xs"
            style={{ zIndex: 5 }}
          >
            <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
              <span style={{ color: "#C9A227", fontSize: 16, textShadow: beaten ? "0 0 10px rgba(201,162,39,0.7)" : "none" }}>
                {beaten}
              </span>
              <span style={{ opacity: 0.45, fontSize: 10 }}>BEATEN</span>
            </div>
            <div style={{ opacity: 0.6 }}>ONE TOUCH AND YOU'RE DOWN</div>
          </div>
        )}

        {inPlay && (
          <div
            className="absolute bottom-3 left-0 right-0 text-center mono"
            style={{ fontSize: 10, opacity: 0.4, zIndex: 5 }}
          >
            ← → RUN · DRAG OR TILT ON TOUCH
          </div>
        )}

        {/* pass prompts — on screen whenever a pass is available */}
        {phase === "running" && (
          <>
            {[["Q", "left", -1], ["E", "right", 1]].map(([key, sideName, sd]) => (
              <div
                key={key}
                className="mono"
                style={{
                  position: "absolute",
                  bottom: "38%",
                  [sd < 0 ? "left" : "right"]: 14,
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexDirection: sd < 0 ? "row" : "row-reverse",
                }}
              >
                <span
                  style={{
                    border: "1px solid rgba(201,162,39,0.8)",
                    color: "#C9A227",
                    background: "rgba(10,13,10,0.55)",
                    padding: "6px 9px",
                    fontSize: 13,
                    borderRadius: 3,
                  }}
                >
                  {key}
                </span>
                <span style={{ fontSize: 9, letterSpacing: "0.12em", opacity: 0.7, color: "#EDE8DC" }}>
                  PASS {sd < 0 ? "◀" : "▶"}
                </span>
              </div>
            ))}
          </>
        )}

        {/* start overlay */}
        {phase === "start" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6"
            style={{ background: "rgba(8,12,18,0.45)", zIndex: 10 }}
          >
            <div className="mono text-xs" style={{ color: "#C9A227", letterSpacing: "0.2em" }}>
              THREE DEFENDERS. ONE LINE.
            </div>
            <p style={{ fontSize: 13, opacity: 0.75, maxWidth: "30ch", lineHeight: 1.6 }}>
              They commit early and leave their feet — juke late and they fly past. One touch and
              you're down.
            </p>
            <div className="mono" style={{ fontSize: 10, opacity: 0.45, letterSpacing: "0.18em" }}>
              YOUR STRIP
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {COLOUR_KEYS.map((c) => (
                <button
                  key={c}
                  onClick={() => setHomeColour(c)}
                  className="mono"
                  style={{
                    background: PALETTES[c].jersey,
                    border:
                      homeColour === c
                        ? "2px solid #EDE8DC"
                        : "2px solid rgba(237,232,220,0.22)",
                    color: PALETTES[c].trim,
                    padding: "9px 18px",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {PALETTES[c].label}
                </button>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, opacity: 0.4, marginTop: -6 }}>
              OPPOSITION IN {PALETTES[awayColour].label.toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 2 }}>
              {[["p1", "Player 1"], ["p2", "Player 2"]].map(([g, label]) => (
                <button
                  key={g}
                  onClick={() => setFigure(g)}
                  className="mono"
                  style={{
                    background: figure === g ? "#EDE8DC" : "transparent",
                    border: "1px solid rgba(237,232,220,0.45)",
                    color: figure === g ? "#141416" : "#EDE8DC",
                    padding: "9px 22px",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={start}
              className="mono"
              style={{
                background: "#6E1423",
                border: "1px solid #8C1D2E",
                color: "#EDE8DC",
                padding: "14px 30px",
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Kick Off
            </button>
          </div>
        )}

        {/* tackled overlay */}
        {phase === "tackled" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6"
            style={{
              background:
                "radial-gradient(ellipse at 50% 38%, rgba(10,13,10,0.72) 0%, rgba(10,13,10,0.5) 55%, rgba(10,13,10,0.25) 100%)",
              zIndex: 10,
            }}
          >
            <div className="mono text-xs" style={{ color: "#8C1D2E", letterSpacing: "0.2em" }}>
              HELD
            </div>
            <h2 className="display" style={{ fontSize: "clamp(28px,7vw,44px)" }}>
              Get Back Up
            </h2>
            <div className="mono" style={{ fontSize: 11, opacity: 0.5 }}>
              {beaten} BEATEN ON THE WAY DOWN
            </div>
            <button
              onClick={start}
              className="mono"
              style={{
                background: "#6E1423",
                border: "1px solid #8C1D2E",
                color: "#EDE8DC",
                padding: "14px 30px",
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Run It Back
            </button>
          </div>
        )}

        {/* try overlay — kept light so the fireworks read through it */}
        {phase === "try" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6"
            style={{
              background:
                "radial-gradient(ellipse at 50% 45%, rgba(10,13,10,0.72) 0%, rgba(10,13,10,0.42) 55%, rgba(10,13,10,0.15) 100%)",
              zIndex: 10,
            }}
          >
            <div
              className="display pop"
              style={{
                fontSize: "clamp(48px,14vw,90px)",
                color: "#C9A227",
                lineHeight: 1,
                textShadow: "0 0 30px rgba(201,162,39,0.55)",
              }}
            >
              TRY!
            </div>
            <div className="mono text-xs" style={{ color: "#C9A227", letterSpacing: "0.2em" }}>
              VORTEX RUGBY
            </div>
            <h2
              className="script"
              style={{
                fontSize: "clamp(46px,12vw,84px)",
                textShadow: "0 2px 24px rgba(0,0,0,0.8)",
                margin: "4px 0",
              }}
            >
              Welcome to<br />the Club
            </h2>
            <button
              className="mono"
              style={{
                background: "#6E1423",
                border: "1px solid #8C1D2E",
                color: "#EDE8DC",
                padding: "14px 30px",
                fontSize: 12,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              Enter The Site
            </button>
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, opacity: 0.35, marginTop: 16, maxWidth: 380, textAlign: "center" }}>
        Prototype — fully rigged players driven by motion-capture clips. Tilt to steer on your phone;
        arrows or drag on desktop.
      </p>
    </div>
  );
}
