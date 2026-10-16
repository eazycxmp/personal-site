// ------------------------------------------------------------------ post-processing on capable screens: bloom, a tilt-shift focus and grading
const POST = {on:!MOBILE};
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), postScene = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
quad.frustumCulled = false; postScene.add(quad);
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const postShader = (uniforms, fs) => new THREE.ShaderMaterial({uniforms, vertexShader:VS, fragmentShader:fs, depthTest:false, depthWrite:false});
const mCopy = postShader({t:{value:null}}, 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }');
const mBright = postShader({t:{value:null}, th:{value:1.5}}, 'uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th + .9, l), 1.); }');
const mBlur = postShader({t:{value:null}, d:{value:new THREE.Vector2()}}, `uniform sampler2D t; uniform vec2 d; varying vec2 vUv;
  void main(){ vec3 c = texture2D(t, vUv).rgb * .227027;
    c += (texture2D(t, vUv + d*1.3846).rgb + texture2D(t, vUv - d*1.3846).rgb) * .3162162;
    c += (texture2D(t, vUv + d*3.2308).rgb + texture2D(t, vUv - d*3.2308).rgb) * .0702703;
    gl_FragColor = vec4(c, 1.); }`);
const mAO = postShader({tD:{value:null}, projInv:{value:new THREE.Matrix4()}, py:{value:1}, seed:{value:0}}, `uniform sampler2D tD; uniform mat4 projInv; uniform float py, seed; varying vec2 vUv;
  vec3 vpos(vec2 uv) { float d = texture2D(tD, uv).r; vec4 p = projInv * vec4(uv*2. - 1., d*2. - 1., 1.); return p.xyz / p.w; }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
  void main(){
    float d0 = texture2D(tD, vUv).r; if (d0 >= .9999) { gl_FragColor = vec4(1.); return; }
    vec3 P = vpos(vUv), N = normalize(cross(dFdx(P), dFdy(P)));
    float r = .9, rs = r * py / max(.5, -P.z) * .5, a0 = hash(vUv * 731.), ao = 0.;
    for (int i = 0; i < 14; i++) {
      float t = (float(i) + .5) / 14., ang = a0*6.2831 + float(i)*2.3999;
      vec2 uv = vUv + vec2(cos(ang), sin(ang)) * rs * t;
      vec3 v = vpos(uv) - P; float l = length(v);
      ao += max(0., dot(N, v / max(l, 1e-4)) - .08) * (1. / (1. + l*l*1.6));
    }
    ao = clamp(1. - ao / 14. * 2.4, 0., 1.);
    gl_FragColor = vec4(vec3(ao), 1.);
  }`);
const mComp = postShader({tS:{value:null}, tB:{value:null}, tG:{value:null}, tAO:{value:null}, aoOn:{value:0}, bloom:{value:.5}, night:{value:0}, tDep:{value:null}, tFog:{value:null}, fogOn:{value:0}, pInv:{value:new THREE.Matrix4()}, cW:{value:new THREE.Matrix4()}, fT:{value:0}}, `uniform sampler2D tS, tB, tG, tAO, tDep, tFog; uniform float bloom, night, aoOn, fogOn, fT; uniform mat4 pInv, cW; varying vec2 vUv;
  float fh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float fn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(fh(i), fh(i + vec2(1, 0)), f.x), mix(fh(i + vec2(0, 1)), fh(i + vec2(1, 1)), f.x), f.y); }
  void main(){
    vec3 c = texture2D(tS, vUv).rgb;
    c *= mix(1., texture2D(tAO, vUv).r, aoOn * .85);
    if (fogOn > .5) {
      float dd = texture2D(tDep, vUv).r;
      if (dd < .9999) {
        vec4 vp = pInv * vec4(vUv*2. - 1., dd*2. - 1., 1.); vp /= vp.w; vec3 wp = (cW * vec4(vp.xyz, 1.)).xyz;
        float cl = fn(wp.xz*.045 + vec2(fT*.03, fT*.012))*.6 + fn(wp.xz*.13 - vec2(fT*.05, 0.))*.4;
        float sn = texture2D(tFog, vec2((wp.x + 480.)/960., (wp.z + 320.)/600.)).r;
        float k = smoothstep(.25, .85, sn + (cl - .5)*.45);
        vec3 fogc = mix(vec3(.58, .62, .68), vec3(.86, .88, .92), cl) * (1. - .55*night);
        c = mix(fogc, c, k);
      }
    }
    float f = smoothstep(.2, .5, abs(vUv.y - .5));
    c = mix(c, texture2D(tB, vUv).rgb, f * .85);
    c += texture2D(tG, vUv).rgb * (bloom + night * .7);
    float l = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(l), c, 1.12);
    // filmic grade: cool shadows, warm highlights, a gentle S-curve
    c *= mix(vec3(.93, .98, 1.08), vec3(1.06, 1.0, .92), smoothstep(.05, .8, l));
    c = c * (1. + .12 * (c - .35));
    vec2 q = vUv - .5; c *= 1. - .55 * dot(q, q);
    gl_FragColor = vec4(c, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`);
let rtS = null, rtA, rtB, rtC, rtD, rtE, rtF;
const AOX = {on:true};
function postSize() {
  const v = renderer.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(4, v.x), h = Math.max(4, v.y);
  if (!rtS) {
    rtS = new THREE.WebGLRenderTarget(w, h, {type:THREE.HalfFloatType, samples:4});
    rtS.depthTexture = new THREE.DepthTexture(w, h); rtS.depthTexture.type = THREE.UnsignedIntType;
    const o = {type:THREE.HalfFloatType, depthBuffer:false};
    rtE = new THREE.WebGLRenderTarget(4, 4, o); rtF = new THREE.WebGLRenderTarget(4, 4, o);
    rtA = new THREE.WebGLRenderTarget(4, 4, o); rtB = new THREE.WebGLRenderTarget(4, 4, o); rtC = new THREE.WebGLRenderTarget(4, 4, o); rtD = new THREE.WebGLRenderTarget(4, 4, o);
  }
  rtS.setSize(w, h); rtE.setSize(w/2|0, h/2|0); rtF.setSize(w/2|0, h/2|0); rtA.setSize(w/2|0, h/2|0); rtB.setSize(w/2|0, h/2|0); rtC.setSize(w/4|0, h/4|0); rtD.setSize(w/4|0, h/4|0);
}
function pass(m, out) { quad.material = m; renderer.setRenderTarget(out); renderer.render(postScene, postCam); }
function blur(src, tmp, k) {
  mBlur.uniforms.t.value = src.texture; mBlur.uniforms.d.value.set(k / src.width, 0); pass(mBlur, tmp);
  mBlur.uniforms.t.value = tmp.texture; mBlur.uniforms.d.value.set(0, k / src.height); pass(mBlur, src);
}
function renderFinal(night, sc = scene, cam = camera) {
  if (!POST.on) { renderer.setRenderTarget(null); renderer.render(sc, cam); return; }
  if (!rtS) postSize();
  renderer.setRenderTarget(rtS); renderer.render(sc, cam);
  mCopy.uniforms.t.value = rtS.texture; pass(mCopy, rtA);
  blur(rtA, rtB, 1.3);
  mBright.uniforms.t.value = rtA.texture; pass(mBright, rtC);
  blur(rtC, rtD, 1.5); blur(rtC, rtD, 2.6);
  // ambient occlusion, at half resolution, softened
  const aoOn = sc === scene && !perf.low && AOX.on;
  if (aoOn) {
    mAO.uniforms.tD.value = rtS.depthTexture; mAO.uniforms.projInv.value.copy(cam.projectionMatrixInverse); mAO.uniforms.py.value = cam.projectionMatrix.elements[5]; mAO.uniforms.seed.value = 0;
    pass(mAO, rtE); blur(rtE, rtF, 1.2);
  }
  mComp.uniforms.tAO.value = rtE.texture; mComp.uniforms.aoOn.value = aoOn ? 1 : 0;
  { const u = mComp.uniforms, on = sc === scene && FOG.loaded && !SPACE.view; u.fogOn.value = on ? 1 : 0;
    if (on) { u.tDep.value = rtS.depthTexture; u.tFog.value = FOG.tex; u.pInv.value.copy(cam.projectionMatrixInverse); u.cW.value.copy(cam.matrixWorld); u.fT.value = time; } }
  mComp.uniforms.tS.value = rtS.texture; mComp.uniforms.tB.value = rtA.texture; mComp.uniforms.tG.value = rtC.texture; mComp.uniforms.night.value = night;
  pass(mComp, null);
}

