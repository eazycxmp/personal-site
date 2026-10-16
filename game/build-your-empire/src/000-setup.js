import * as THREE from './lib/three.module.min.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { HDRLoader } from './lib/HDRLoader.js';
import { mergeGeometries } from './lib/BufferGeometryUtils.js';
import { clone as skClone } from './lib/SkeletonUtils.js';

const stage = document.getElementById('stage');
const $ = id => document.getElementById(id);
const R = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

