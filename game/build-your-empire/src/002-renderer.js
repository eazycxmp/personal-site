// ------------------------------------------------------------------ renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 700;
renderer.setPixelRatio(Math.min(MOBILE ? 1.5 : 2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;   // redrawn every other frame (see frame())
// weathering on every standard material (desktop): patterned in the object's own space so moving things don't swim
// three copies these shared uniforms into every new material, and copying a texture re-uploads its image, so the grain
// is its own texture object whose copies are itself (one upload, not one per material: that was seconds of freeze per building)
const GRAIN = TEX.plastered_wall_02 && TEX.plastered_wall_02.map && texClone(TEX.plastered_wall_02.map), WHITE1 = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); WHITE1.needsUpdate = true;
for (const t of [GRAIN, WHITE1]) if (t) t.clone = function () { return this; };
if (!MOBILE) for (const id of ['standard', 'physical']) {
  const L = THREE.ShaderLib[id];
  L.uniforms.tGrain = {value:GRAIN || WHITE1}; L.uniforms.gAvg = {value:GRAIN ? Math.max(.05, TEX.plastered_wall_02.avg.g) : 1};
  L.vertexShader = L.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGO, vGW, vGN;')
    .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
  #ifndef NO_GRIME
  { vec4 gl = vec4(transformed, 1.);
    #ifdef USE_BATCHING
    gl = batchingMatrix * gl;
    #endif
    #ifdef USE_INSTANCING
    gl = instanceMatrix * gl;
    #endif
    vGW = (modelMatrix * gl).xyz; vGO = gl.xyz * length(modelMatrix[0].xyz); vGN = normalize(transpose(mat3(viewMatrix)) * transformedNormal); }
  #endif`);
  L.fragmentShader = L.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vGO, vGW, vGN;
uniform sampler2D tGrain; uniform float gAvg;
float gH(vec3 p) { p = fract(p*.3183099 + .1); p *= 17.; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float gNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f*f*(3. - 2.*f);
  return mix(mix(mix(gH(i), gH(i + vec3(1, 0, 0)), f.x), mix(gH(i + vec3(0, 1, 0)), gH(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(gH(i + vec3(0, 0, 1)), gH(i + vec3(1, 0, 1)), f.x), mix(gH(i + vec3(0, 1, 1)), gH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
    .replace('#include <color_fragment>', `#include <color_fragment>
  float gGN = .5;
  #ifndef NO_GRIME
  { gGN = gNoise(vGO*1.1)*.55 + gNoise(vGO*3.7)*.3 + gNoise(vGO*11.)*.15;
    float wall = 1. - abs(vGN.y);
    diffuseColor.rgb *= .87 + .2*gGN;                                                  // broad, uneven tone
    diffuseColor.rgb *= mix(1., .74 + .26*smoothstep(0., 1.2, vGW.y), wall*.9);        // dirt splashed up the foot of walls
    diffuseColor.rgb *= 1. - .1*smoothstep(.55, .95, -vGN.y);
    float up = smoothstep(.85, .98, vGN.y), broad = gNoise(vec3(vGW.xz*.07, 3.))*.65 + gNoise(vec3(vGW.xz*.23, 7.))*.35;
    diffuseColor.rgb *= mix(1., .8 + .34*broad, up*.8);                                // large patches across open ground
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.08, 1.0, .82), up*smoothstep(.55, .8, broad)*.6);
    vec3 bw = pow(abs(vGN), vec3(4.)); bw /= (bw.x + bw.y + bw.z + 1e-4); vec3 q = vGO*.55;
    float gr = dot(vec3(texture2D(tGrain, q.zy).g, texture2D(tGrain, q.xz).g, texture2D(tGrain, q.xy).g), bw);
    diffuseColor.rgb *= mix(1., clamp(gr/gAvg, .55, 1.45), .34*(1. - up)); }   // drier, yellower spots                        // undersides a touch darker
  #endif`)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = clamp(roughnessFactor + (gGN - .5)*.18, .02, 1.);');
}
stage.prepend(renderer.domElement);
renderer.domElement.tabIndex = 0;

const scene = new THREE.Scene();
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .95;
scene.background = new THREE.Color(0x9fd6f2);
scene.fog = new THREE.Fog(0x9fd6f2, 42, 82);
// the camera looks at the camp diagonally, for the diorama look
const CAM_YAW = Math.PI / 4;
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);   // a wide view (was 32, then 38)
const hemi = new THREE.HemisphereLight(0xdcefff, 0x4f6a34, 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d4, 3.4);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 4096, MOBILE ? 1024 : 4096);
Object.assign(sun.shadow.camera, {left:-19, right:19, top:19, bottom:-19, near:1, far:80});
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

