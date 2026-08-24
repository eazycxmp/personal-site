"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

/* ---------------- rigged players ----------------
   ONE skinned template (24 bones, 226K tris) is loaded and scaled once, then
   every player on the pitch is a SkeletonUtils clone of it, driven by its own
   AnimationMixer. Clips are shared AnimationClips — they bind to each clone's
   bones by name.

   The clips POSE a player; the game MOVES him. Lane position, world scroll,
   launch arcs and camera all stay in EnterThePitch.

   Kit colouring is vertex colours chosen by dominant skin-weight bone. Painted
   geometries are cached per kit, so the two forwards share one geometry and we
   carry one geometry per kit, not per player.
-------------------------------------------------- */

const BODY_FILES = {
  a: "/models/Meshy_AI_Animation_Walking_withSkin.fbx", // 226K tris
  b: "/models/BlueBlitz_biped.fbx", // 101K tris, has UVs
  f: "/models/Female_biped.fbx", // 209K tris, has UVs
};
const BODY_B_NORMAL = "/models/BlueBlitz_normal.png";
const CLIP_FILES = {
  run: "/models/Fast Run.fbx",
  catch: "/models/Goalkeeper Catch.fbx",
  dive: "/models/Run To Dive.fbx",
  juke: "/models/Evading A Threat (1).fbx",
  down: "/models/Hit To The Legs (1).fbx",
  walk: "/models/Meshy_AI_Animation_Walking_without_skin.fbx",
  takedown: "/models/Double Leg Takedown - Attacker.fbx",
  backpedal: "/models/Walking Backward.fbx",
  idle: "/models/Standing Idle.fbx",
  victory: "/models/Victory.fbx",
  roll: "/models/Run To Rolling.fbx",
  sprintTurn: "/models/Sprint Turn.fbx",
  jogBack: "/models/Slow Jog Backwards.fbx",
  turn180: "/models/Running Turn 180.fbx",
  thrown: "/models/Getting Thrown.fbx",
  throwing: "/models/Throwing.fbx",
  backflip: "/models/Backflip.fbx",
  fallSit: "/models/Falling Down.fbx",
  sitPose: "/models/Male Sitting Pose.fbx",
};

// one-shots hold their last frame instead of snapping back
const ONE_SHOT = new Set(["catch", "dive", "down", "takedown", "roll", "sprintTurn", "turn180", "thrown", "throwing", "backflip", "fallSit", "sitPose"]);

// The female model wears a ponytail. It hangs BELOW the crown line, so a
// height-based hairline leaves it skin-coloured — everything far enough back
// on her head is hair regardless of how low it hangs.
const PONYTAIL_BODIES = new Set(["f"]);

const PLAYER_HEIGHT = 1.85; // metres

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _pq = new THREE.Quaternion();
const _fa = new THREE.Vector3();
const _dir = new THREE.Vector3();

/* ---- clip retargeting ----
   The clips were authored against body "a"'s rest pose. Another rigged model
   can have wildly different bone orientations at rest — the female body's hips
   sit 103 degrees away, her thighs 112 — and playing an "a" clip on it folds
   the character in half.

   Fix: rebase each rotation key. A clip key is the bone's LOCAL rotation, so
   the motion is really the delta from its own rest: d = restSrc^-1 * q. Apply
   that same delta to the target's rest instead: q' = (restDst * restSrc^-1) * q.
------------------------------- */
function restMap(root) {
  const m = new Map();
  root.traverse((o) => {
    if (o.isBone) {
      m.set(o.name, {
        q: o.quaternion.clone(),
        parent: o.parent && o.parent.isBone ? o.parent.name : null,
      });
    }
  });
  return m;
}

/* The node transforms on these FBX files are NOT the bind pose. Every body
   ships an embedded clip and loads sitting at frame 0 of it — up to 57 degrees
   off bind across twenty bones. Body a happens to load mid-stride of the Meshy
   walk, so measuring "rest" off its nodes made that one clip retarget from a
   walking pose onto another rig's standing pose, which is exactly why walking
   was the clip that came out wrong. Read the real bind pose off the skeleton.

   This is used ONLY as the rest reference. Bones a clip does not drive still
   fall back to the node pose, because that is what body a itself shows when
   the same clip plays on it unretargeted. */
function bindRestMap(root) {
  let mesh = null;
  root.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  const sk = mesh?.skeleton;
  if (!sk || !sk.boneInverses?.length) return null;

  const m = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const worldQ = new Map();
  sk.bones.forEach((bone, i) => {
    const q = new THREE.Quaternion();
    m.copy(sk.boneInverses[i]).invert().decompose(p, q, sc);
    worldQ.set(bone.name, q);
  });

  const out = new Map();
  for (const bone of sk.bones) {
    const parent =
      bone.parent && bone.parent.isBone && worldQ.has(bone.parent.name) ? bone.parent.name : null;
    const w = worldQ.get(bone.name);
    out.set(bone.name, {
      q: parent ? worldQ.get(parent).clone().invert().multiply(w) : w.clone(),
      parent,
    });
  }
  return out;
}

/* Parent-first ordering so a bone's parent world rotation is always ready. */
function boneOrder(bones) {
  const out = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    const b = bones.get(name);
    if (!b) return;
    if (b.parent) visit(b.parent);
    seen.add(name);
    out.push(name);
  };
  for (const name of bones.keys()) visit(name);
  return out;
}

/* Compose each bone's rest rotation down the hierarchy into world space. */
function restWorld(bones, order) {
  const w = new Map();
  for (const name of order) {
    const b = bones.get(name);
    const p = b.parent ? w.get(b.parent) : null;
    w.set(name, p ? p.clone().multiply(b.q) : b.q.clone());
  }
  return w;
}

function restMatches(a, b) {
  for (const [name, sa] of a) {
    const sb = b.get(name);
    if (!sb) return false;
    if (sa.q.angleTo(sb.q) > 0.02) return false; // ~1 degree
  }
  return true;
}

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _corr = new THREE.Quaternion();
const _inv = new THREE.Quaternion();

/* Retarget in WORLD space.

   Rebasing each bone's LOCAL rotation is not enough: when two rigs' bone axes
   differ, the same local delta means something different on each skeleton and
   the character ends up leaning. Take the source bone's WORLD delta from its
   own rest instead, apply that to the target's world rest, then convert back
   down into the target's local space. */
function retargetClip(clip, srcBones, dstBones, order, restWS, restWD) {
  const qTracks = clip.tracks.filter((t) => t.name.endsWith(".quaternion"));
  if (!qTracks.length) return clip.clone();

  // Tracks in these clips do NOT share a timeline — a static bone may carry a
  // single key while the hips carry 112. Resample everything onto one even
  // grid using each track's own interpolant, then retarget off that.
  const FPS = 60;
  const count = Math.max(2, Math.ceil(clip.duration * FPS) + 1);
  const times = new Float32Array(count);
  for (let i = 0; i < count; i++) times[i] = Math.min(clip.duration, i / FPS);

  const trackFor = new Map();
  const interpFor = new Map();
  for (const t of qTracks) {
    const bone = t.name.slice(0, -".quaternion".length);
    trackFor.set(bone, t);
    interpFor.set(bone, t.createInterpolant());
  }

  const out = new Map();
  for (const name of order) if (trackFor.has(name)) out.set(name, new Float32Array(count * 4));

  const wS = new Map();
  const wD = new Map();
  const local = new THREE.Quaternion();

  for (let k = 0; k < count; k++) {
    const time = times[k];
    for (const name of order) {
      const sb = srcBones.get(name);
      const db = dstBones.get(name);
      if (!sb || !db) continue;

      const itp = interpFor.get(name);
      if (itp) {
        const v = itp.evaluate(time);
        _qa.set(v[0], v[1], v[2], v[3]).normalize();
      } else {
        _qa.copy(sb.q);
      }

      // source world rotation for this frame
      const ps = sb.parent ? wS.get(sb.parent) : null;
      const ws = ps ? ps.clone().multiply(_qa) : _qa.clone();
      wS.set(name, ws);

      // how far it has swung from its own rest, in world terms
      _inv.copy(restWS.get(name)).invert();
      _corr.copy(ws).multiply(_inv);

      // same world motion, applied to the target's rest
      const wd = _corr.clone().multiply(restWD.get(name));
      wD.set(name, wd);

      const arr = out.get(name);
      if (!arr) continue;
      const pd = db.parent ? wD.get(db.parent) : null;
      if (pd) local.copy(pd).invert().multiply(wd);
      else local.copy(wd);
      arr[k * 4] = local.x;
      arr[k * 4 + 1] = local.y;
      arr[k * 4 + 2] = local.z;
      arr[k * 4 + 3] = local.w;
    }
  }

  const tracks = clip.tracks.map((t) => {
    if (!t.name.endsWith(".quaternion")) return t.clone();
    const vals = out.get(t.name.slice(0, -".quaternion".length));
    if (!vals) return t.clone();
    return new THREE.QuaternionKeyframeTrack(t.name, Array.from(times), Array.from(vals));
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

let assetPromise = null;
function loadAssets() {
  if (assetPromise) return assetPromise;
  const loader = new FBXLoader();
  const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
  assetPromise = (async () => {
    const templates = {};
    for (const [id, url] of Object.entries(BODY_FILES)) {
      const t = await load(url);
      // scale centimetres -> metres exactly once, on the pristine template
      const box = new THREE.Box3().setFromObject(t);
      const h = box.max.y - box.min.y;
      t.scale.setScalar(PLAYER_HEIGHT / h);
      t.rotation.y = Math.PI; // model faces +Z; the pitch runs toward -Z
      templates[id] = t;
    }
    // the second body ships a normal map, and has the UVs to use it
    const normalB = await new Promise((res) =>
      new THREE.TextureLoader().load(BODY_B_NORMAL, res, undefined, () => res(null))
    );
    const clips = {};
    await Promise.all(
      Object.entries(CLIP_FILES).map(async ([name, url]) => {
        const asset = await load(url);
        // some files bundle the original walk too; the clip the file is named
        // for is always the longer one
        clips[name] = asset.animations.slice().sort((a, b) => b.duration - a.duration)[0];
      })
    );
    // rebase the clips for any body whose rest pose differs from the reference
    const refBones = restMap(templates.a);
    const order = boneOrder(refBones);
    const refWorld = restWorld(bindRestMap(templates.a) || refBones, order);
    const clipsByBody = { a: clips };
    for (const id of Object.keys(templates)) {
      if (id === "a") continue;
      const bones = restMap(templates[id]);
      if (restMatches(refBones, bones)) {
        clipsByBody[id] = clips;
        continue;
      }
      const world = restWorld(bindRestMap(templates[id]) || bones, order);
      const remapped = {};
      for (const [name, clip] of Object.entries(clips)) {
        remapped[name] = retargetClip(clip, refBones, bones, order, refWorld, world);
      }
      clipsByBody[id] = remapped;
    }
    return { templates, normalB, clipsByBody };
  })();
  return assetPromise;
}

/* ---- kit painting: dominant-bone vertex colours, cached per kit ---- */
const paintedGeoCache = new Map();

function kitKey(kit, bodyId) {
  return [bodyId, kit.jersey, kit.sleeve, kit.trim, kit.shorts, kit.socks, kit.skin, kit.hair, kit.boots, kit.blood || 0].join("|");
}

/* Which slot of the kit each vertex belongs to. The geometric work — dominant
   bone, hairline, torso silhouette — depends only on the BODY, never on the
   colours, so it runs once per body and is reused by every strip. */
const R = { jersey: 0, sleeve: 1, trim: 2, skin: 3, hair: 4, shorts: 5, socks: 6, boots: 7 };
const R_ORDER = ["jersey", "sleeve", "trim", "skin", "hair", "shorts", "socks", "boots"];
const regionCache = new Map();

function regionsFor(mesh, bodyId) {
  if (regionCache.has(bodyId)) return regionCache.get(bodyId);
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const si = geo.attributes.skinIndex;
  const sw = geo.attributes.skinWeight;
  const bones = mesh.skeleton?.bones || [];

  const n = pos.count;
  const owner = new Int32Array(n);
  const spanLo = new Map();
  const spanHi = new Map();
  const zLoMap = new Map();
  const zHiMap = new Map();
  const xAbsMax = new Map();

  for (let i = 0; i < n; i++) {
    let best = 0;
    let bestW = -1;
    if (si && sw) {
      const idx = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
      const w = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
      for (let k = 0; k < 4; k++) if (w[k] > bestW) { bestW = w[k]; best = idx[k]; }
    }
    owner[i] = best;
    const y = pos.getY(i);
    if (!spanLo.has(best) || y < spanLo.get(best)) spanLo.set(best, y);
    if (!spanHi.has(best) || y > spanHi.get(best)) spanHi.set(best, y);
    const z = pos.getZ(i);
    if (!zLoMap.has(best) || z < zLoMap.get(best)) zLoMap.set(best, z);
    if (!zHiMap.has(best) || z > zHiMap.get(best)) zHiMap.set(best, z);
    const ax = Math.abs(pos.getX(i));
    if (!xAbsMax.has(best) || ax > xAbsMax.get(best)) xAbsMax.set(best, ax);
  }

  /* How wide the trunk is. The shoulder and upper-arm bones own vertices all
     the way in to the spine — the traps, the shoulder blades, the ribs under
     the armpit. Painting those by bone name alone put sleeve-coloured patches
     across the back and bare skin on the ribs. Anything within the torso
     silhouette is jersey no matter which bone happens to drive it. */
  let torsoW = 0;
  for (const [b, mx] of xAbsMax) {
    if ((bones[b]?.name || "").toLowerCase().includes("spine")) torsoW = Math.max(torsoW, mx);
  }

  const region = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const b = owner[i];
    const name = (bones[b]?.name || "").toLowerCase();
    const lo = spanLo.get(b) ?? 0;
    const hi = spanHi.get(b) ?? 1;
    const f = hi > lo ? (pos.getY(i) - lo) / (hi - lo) : 0.5;
    const ax = Math.abs(pos.getX(i));
    const onTorso = torsoW > 0 && ax <= torsoW;

    let hex;
    if (name === "neck" || name.endsWith("neck")) {
      // the nape is collar and jersey, never hair — hair reaching down the
      // back of the neck was the giveaway that this bone was being painted
      // as if it were the skull
      hex = f > 0.62 ? R.skin : R.trim; // the collar, and only the collar
    }
    else if (name.includes("head")) {
      // A flat height threshold slices the head with a dead-straight line. A
      // real hairline sits high at the brow and drops down the back and sides,
      // so bias the cut by how far back the vertex is, and wobble it slightly
      // so the edge never reads as a machined cut.
      const zLo = zLoMap.get(b) ?? 0;
      const zHi = zHiMap.get(b) ?? 1;
      // the model is built facing +Z (the rigs are turned 180 in the scene), so
      // the FACE sits at zHi. Measuring from the near end put the low part of
      // the hairline across the nose — hence hair painted over faces.
      const zf = zHi > zLo ? (zHi - pos.getZ(i)) / (zHi - zLo) : 0.5; // 0 face, 1 back
      const wob =
        Math.sin(pos.getX(i) * 38) * 0.022 + Math.sin(pos.getZ(i) * 31 + 1.7) * 0.022;
      // hair sits on the crown and eases down a little at the back — a bigger
      // drop than this and it runs onto the nape
      const hairline = 0.72 - zf * 0.13 + wob;
      // ...and on a ponytailed head, the whole back of it, however far it hangs
      const tail = PONYTAIL_BODIES.has(bodyId) && zf > 0.7 + wob;
      hex = f > hairline || tail ? R.hair : R.skin;
    }
    // one unbroken jersey over the whole trunk — the collar lives on the neck
    else if (name.includes("spine")) hex = R.jersey;
    else if (name.includes("shoulder")) hex = onTorso ? R.jersey : R.sleeve;
    else if (name.includes("forearm") || name.includes("hand")) hex = R.skin;
    else if (name.includes("arm")) {
      if (onTorso) hex = R.jersey; // ribs and armpit are body, not arm
      else {
        // out along the arm: a short sleeve, then bare skin. Measured across
        // the arm rather than up it, because in the bind T-pose the upper arm
        // is horizontal and a height split would slice it lengthways.
        const armMax = xAbsMax.get(b) ?? ax;
        const t = armMax > torsoW ? (ax - torsoW) / (armMax - torsoW) : 1;
        hex = t < 0.55 ? R.sleeve : R.skin;
      }
    }
    else if (name.includes("upleg")) hex = f > 0.5 ? R.shorts : R.skin;
    else if (name.includes("leg")) hex = f > 0.78 ? R.skin : R.socks;
    else if (name.includes("foot") || name.includes("toe")) hex = R.boots;
    else if (name.includes("hips")) hex = R.shorts;
    else hex = R.jersey;

    region[i] = hex;
  }
  regionCache.set(bodyId, region);
  return region;
}

function paintedGeometryFor(mesh, kit, bodyId) {
  const key = kitKey(kit, bodyId);
  if (paintedGeoCache.has(key)) return paintedGeoCache.get(key);

  const src = mesh.geometry;
  const pos = src.attributes.position;
  const n = pos.count;
  const region = regionsFor(mesh, bodyId);

  /* Eight colours, then a straight fill — no per-vertex geometry, no trig.
     Bytes rather than floats: a quarter of the memory and a quarter of the
     writes, and a flat kit colour has nothing like enough tonal range to show
     the difference. */
  const c = new THREE.Color();
  const pal = new Uint8Array(R_ORDER.length * 3);
  R_ORDER.forEach((slot, k) => {
    c.set(kit[slot] || kit.jersey);
    pal[k * 3] = Math.round(c.r * 255);
    pal[k * 3 + 1] = Math.round(c.g * 255);
    pal[k * 3 + 2] = Math.round(c.b * 255);
  });
  const colors = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    const o = region[i] * 3;
    const d = i * 3;
    colors[d] = pal[o];
    colors[d + 1] = pal[o + 1];
    colors[d + 2] = pal[o + 2];
  }

  // a few small grazes — dark red spots on skin and jersey
  if (kit.blood) {
    let seed = 0;
    for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const c2 = new THREE.Color("#6E1010");
    for (let spot = 0; spot < kit.blood; spot++) {
      const at = Math.floor(rand() * n);
      const sx = pos.getX(at);
      const sy = pos.getY(at);
      const sz = pos.getZ(at);
      const r = 3 + rand() * 4; // centimetres in model space
      const r2 = r * r;
      for (let i = 0; i < n; i++) {
        const dx = pos.getX(i) - sx;
        const dy = pos.getY(i) - sy;
        const dz = pos.getZ(i) - sz;
        if (dx * dx + dy * dy + dz * dz < r2) {
          colors[i * 3] = Math.round(c2.r * 255);
          colors[i * 3 + 1] = Math.round(c2.g * 255);
          colors[i * 3 + 2] = Math.round(c2.b * 255);
        }
      }
    }
  }
  /* Share position/normal/uv/skin buffers with the source rather than cloning
     them. Only the colour attribute differs between strips, so a new kit costs
     one small array instead of a full copy of a 226K-vertex mesh. */
  const geo = new THREE.BufferGeometry();
  for (const name of Object.keys(src.attributes)) geo.setAttribute(name, src.attributes[name]);
  if (src.index) geo.setIndex(src.index);
  geo.groups = src.groups;
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3, true)); // normalized bytes
  paintedGeoCache.set(key, geo);
  return geo;
}

export default function RiggedPlayer({ poseRef, kit, ballRef, body = "a" }) {
  const groupRef = useRef();
  const [assets, setAssets] = useState(null);
  const st = useRef(null);

  useEffect(() => {
    let alive = true;
    loadAssets()
      .then((a) => alive && setAssets(a))
      .catch((e) => console.error("rig load failed", e));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!assets || !groupRef.current) return;
    const { templates, normalB, clipsByBody } = assets;
    const template = templates[body] || templates.a;
    const clips = clipsByBody[body] || clipsByBody.a;

    const rig = cloneSkeleton(template);
    const state = { actions: {}, current: null, mixer: null, hips: null, bindHips: null, rightHand: null };

    state.skins = [];
    rig.traverse((o) => {
      if (o.isSkinnedMesh) {
        // the clone shares the template's geometry, so this is the unpainted
        // original — keep it, every future kit is painted from it
        state.skins.push({ mesh: o, srcGeo: o.geometry });
        o.geometry = paintedGeometryFor(o, kit, body);
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 });
        // the b-body has UVs, so its normal map adds real surface relief
        if (body === "b" && normalB && o.geometry.attributes.uv) {
          mat.normalMap = normalB;
          mat.normalScale = new THREE.Vector2(0.7, 0.7);
        }
        o.material = mat;
        o.castShadow = true;
        o.frustumCulled = false;
      }
      if (o.isBone) {
        if (/hips/i.test(o.name)) { state.hips = o; state.bindHips = o.position.clone(); }
        if (/righthand/i.test(o.name)) state.rightHand = o;
        if (/rightforearm/i.test(o.name)) state.rightForeArm = o;
      }
    });

    groupRef.current.add(rig);

    const mixer = new THREE.AnimationMixer(rig);
    state.mixer = mixer;
    for (const [name, clip] of Object.entries(clips)) {
      const action = mixer.clipAction(clip);
      if (ONE_SHOT.has(name)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      state.actions[name] = action;
    }
    const first = poseRef.current?.clip || "run";
    (state.actions[first] || state.actions.run).play();
    state.current = first;

    st.current = state;
    const g = groupRef.current;
    return () => {
      mixer.stopAllAction();
      g.remove(rig);
      st.current = null;
    };
    // NOTE: deliberately NOT keyed on kit. Rebuilding the rig means cloning a
    // 100-226K triangle skinned mesh and rebuilding the mixer, which dropped
    // frames every time a pass changed who was carrying. The skeleton is
    // identical whoever wears the shirt; only the vertex colours differ.
  }, [assets, poseRef, body]);

  // A change of kit is a geometry swap and nothing more. Painted geometries are
  // cached, so after the first time each shirt is worn this costs a pointer.
  useEffect(() => {
    const s = st.current;
    if (!s?.skins) return;
    for (const { mesh, srcGeo } of s.skins) {
      mesh.geometry = paintedGeometryFor({ geometry: srcGeo, skeleton: mesh.skeleton }, kit, body);
    }
  }, [assets, kit, body]);

  useFrame((_, delta) => {
    const s = st.current;
    if (!s) return;
    const dt = Math.min(delta, 0.05);

    const want = poseRef.current?.clip || "run";
    const ts = poseRef.current?.timeScale || 1;
    if (want !== s.current && s.actions[want]) {
      const next = s.actions[want];
      const prev = s.actions[s.current];
      next.reset();
      if (poseRef.current?.timeOffset) next.time = poseRef.current.timeOffset;
      next.setEffectiveTimeScale(ts);
      const snappy = want === "juke" || want === "throwing" || want === "thrown" || want === "sprintTurn";
      const fade = snappy ? 0.12 : 0.3;
      next.setEffectiveWeight(1).fadeIn(fade).play();
      if (prev) prev.fadeOut(fade);
      s.current = want;
    } else if (s.actions[s.current]) {
      s.actions[s.current].setEffectiveTimeScale(ts);
    }

    s.mixer.update(dt);

    // discard the clips' hip translation — it sinks players through the pitch
    if (s.hips && s.bindHips) s.hips.position.copy(s.bindHips);

    // the carrier's ball rides in his right hand
    if (ballRef?.current) {
      ballRef.current.visible = poseRef.current?.ballVisible !== false;
      if (poseRef.current?.ballGrounded) {
        // loose: the Runner is simulating it now, hands off
        ballRef.current.visible = true;
      } else if (s.rightHand && ballRef.current.parent) {
        // sit it in the fingers by extending the forearm -> hand direction past
        // the wrist. guessing the hand bone's local axis kept walking the ball
        // up his arm; this is geometric and cannot point the wrong way.
        s.rightHand.getWorldPosition(_v);
        if (s.rightForeArm) {
          s.rightForeArm.getWorldPosition(_fa);
          _dir.subVectors(_v, _fa);
          if (_dir.lengthSq() > 1e-6) _v.addScaledVector(_dir.normalize(), 0.1);
        }
        ballRef.current.parent.worldToLocal(_v);
        ballRef.current.position.copy(_v);
        s.rightHand.getWorldQuaternion(_q);
        ballRef.current.parent.getWorldQuaternion(_pq);
        ballRef.current.quaternion.copy(_pq.invert().multiply(_q));
      }
    }
  });

  return <group ref={groupRef} />;
}
