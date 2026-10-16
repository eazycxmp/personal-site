# The hero with real proportions (about seven and a half heads tall, 2.05 units), in six costumes as the empire grows:
# villager, merchant, noble, king, tycoon, galactic emperor. Each costume exports five parts the game animates:
# body (pivot at the feet), arm L/R (pivot at the shoulder) and leg L/R (pivot at the hip). Limbs and torso are skinned
# from a vertex skeleton and subdivided, so they come out smooth and organic. Front faces -Y (glTF +Z).
import bpy, bmesh, sys, math
from mathutils import Vector
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def M(name, rgb, rough=.7, metal=0.):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    MATS[name] = m; return m
def srgb(h): return tuple(((h >> s) & 255)/255 for s in (16, 8, 0))
def lin(c): return tuple((v/12.92 if v <= .04045 else ((v + .055)/1.055)**2.4) for v in c)
def C(h): return lin(srgb(h))

HIP, KNEE, ANKLE, SHOULDER_Y, SHW = 1.0, .53, .09, 1.64, .25

def skinned(name, verts, edges, radii, mat, sub=2):
    # a skin-modifier body part: verts with per-vertex (x, y) radii, smoothed
    me = bpy.data.meshes.new(name); me.from_pydata(verts, edges, []); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    mod = o.modifiers.new('skin', 'SKIN'); mod.use_smooth_shade = True
    for i, r in enumerate(radii): me.skin_vertices[0].data[i].radius = r
    me.skin_vertices[0].data[0].use_root = True
    s = o.modifiers.new('sub', 'SUBSURF'); s.levels = sub; s.render_levels = sub
    bpy.ops.object.modifier_apply(modifier='skin'); bpy.ops.object.modifier_apply(modifier='sub')
    o.select_set(False); me.materials.append(mat); return o
def prim(kind, name, mat, loc, scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    if kind == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc, segments=kw.get('seg', 24), ring_count=kw.get('rings', 12))
    elif kind == 'cyl': bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, location=loc, vertices=kw.get('v', 24))
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=kw.get('r2', 0), depth=1, location=loc, vertices=kw.get('v', 24))
    else: bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True); bpy.ops.object.shade_smooth()
    o.data.materials.append(mat); return o
def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join(); o = bpy.context.object; o.name = name; return o
def set_origin(o, p):
    # move the mesh so the given world point becomes the origin (the pivot)
    o.data.transform(__import__('mathutils').Matrix.Translation(-Vector(p))); o.location = (0, 0, 0)

def leg(name, sx, pants, boot, tall_boot=False, shorts=False, skinM=None):
    x = sx*.12
    v = [(x, 0, HIP), (x, -.01, (HIP + KNEE)/2 + .05), (x, .01, KNEE), (x, .02, (KNEE + ANKLE)/2), (x, .01, ANKLE + .04)]
    r = [(.105, .11), (.095, .1), (.07, .075), (.065, .07), (.05, .055)]
    parts = [skinned(name + 'L', v, [(i, i + 1) for i in range(4)], r, pants)]
    # the boot: a rounded foot and a shaft
    parts.append(prim('sph', name + 'foot', boot, (x, -.07, .055), (.065, .135, .06)))
    parts.append(prim('cyl', name + 'shaft', boot, (x, 0, .12 if not tall_boot else .26), (.062, .062, .16 if not tall_boot else .44), v=16))
    parts.append(prim('cube', name + 'sole', M('sole', C(0x1a120c), .9), (x, -.06, .012), (.11, .27, .025)))
    o = join(parts, name); set_origin(o, (x, 0, HIP)); return o

def arm(name, sx, sleeve, skinM, cuff=None, glove=None):
    x = sx*SHW
    v = [(x, 0, SHOULDER_Y - .02), (x + sx*.03, .0, SHOULDER_Y - .3), (x + sx*.035, -.03, SHOULDER_Y - .56)]
    r = [(.068, .068), (.052, .055), (.044, .046)]
    parts = [skinned(name + 'A', v, [(0, 1), (1, 2)], r, sleeve)]
    if cuff: parts.append(prim('cyl', name + 'cuff', cuff, (x + sx*.035, -.03, SHOULDER_Y - .55), (.05, .05, .05), v=16))
    parts.append(prim('sph', name + 'hand', glove or skinM, (x + sx*.036, -.035, SHOULDER_Y - .615), (.046, .036, .066)))
    parts.append(prim('sph', name + 'thumb', glove or skinM, (x + sx*.012, -.07, SHOULDER_Y - .595), (.018, .018, .035)))
    o = join(parts, name); set_origin(o, (x, 0, SHOULDER_Y)); return o

def head(parts, skinM, hairM, hair='short', beard=False):
    hz = 1.89
    parts.append(prim('sph', 'skull', skinM, (0, .005, hz), (.115, .13, .14), seg=32, rings=16))
    parts.append(prim('sph', 'jaw', skinM, (0, -.035, hz - .075), (.085, .085, .07), seg=24))
    parts.append(prim('sph', 'nose', skinM, (0, -.128, hz - .015), (.018, .025, .03)))
    for sx in (-1, 1):
        parts.append(prim('sph', 'ear', skinM, (sx*.115, .01, hz - .005), (.018, .03, .04)))
        parts.append(prim('sph', 'eyeW', M('eyeWhite', C(0xf4f2ee), .3), (sx*.042, -.105, hz + .02), (.022, .012, .015)))
        parts.append(prim('sph', 'iris', M('iris', C(0x3a2a1a), .2), (sx*.042, -.115, hz + .02), (.011, .006, .011)))
        parts.append(prim('cube', 'brow', hairM, (sx*.043, -.113, hz + .05), (.04, .01, .01), rot=(0, sx*.12, 0)))
    parts.append(prim('cube', 'mouth', M('lips', C(0x9a5a4a), .6), (0, -.116, hz - .07), (.035, .008, .008)))
    parts.append(prim('cyl', 'neck', skinM, (0, 0, 1.72), (.05, .05, .12), v=16))
    if hair == 'short': parts.append(prim('sph', 'hair', hairM, (0, .02, hz + .03), (.122, .135, .125), seg=24))
    if hair == 'long': parts.append(prim('sph', 'hair', hairM, (0, .03, hz + .01), (.125, .14, .15), seg=24))
    if beard: parts.append(prim('sph', 'beard', hairM, (0, -.06, hz - .1), (.075, .06, .06)))

def torso(parts, top, pants, belt=None, robe=None, coat=None):
    v = [(0, 0, HIP - .02), (0, 0, 1.18), (0, -.005, 1.42), (0, 0, 1.6), (0, 0, 1.68)]
    r = [(.16, .11), (.145, .1), (.18, .12), (.22, .12), (.09, .08)]
    parts.append(skinned('torso', v, [(i, i + 1) for i in range(4)], r, top))
    # shoulders: caps where the arms join
    for sx in (-1, 1): parts.append(prim('sph', 'shoulder', top, (sx*(SHW - .02), 0, SHOULDER_Y - .03), (.075, .075, .065)))
    parts.append(prim('cyl', 'hips', pants, (0, 0, HIP + .03), (.16, .11, .1), v=24))
    if belt: parts.append(prim('cyl', 'belt', belt, (0, 0, HIP + .1), (.163, .113, .035), v=24)); parts.append(prim('cube', 'buckle', M('gold', C(0xe8b030), .3, 1.), (0, -.115, HIP + .1), (.05, .01, .04)))
    if robe: parts.append(prim('cone', 'robe', robe, (0, 0, .62), (.3, .22, .8), r2=.55, v=32))   # a long robe flaring to the ankles
    if coat: parts.append(prim('cone', 'coattails', coat, (0, .01, 1.0), (.2, .14, .36), r2=.8, v=32))

def cape(parts, mat, lining):
    bm = bmesh.new(); rows = []
    for j in range(7):
        t = j/6; z = 1.62 - t*1.25; w = .2 + t*.18; y = .12 + t*.12 + math.sin(t*math.pi)*.03
        rows.append([bm.verts.new((-w + 2*w*i/8, y + math.cos((i/8 - .5)*math.pi)*-.04, z)) for i in range(9)])
    for j in range(6):
        for i in range(8): bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    me = bpy.data.meshes.new('cape'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('cape', me); bpy.context.collection.objects.link(o)
    sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = .015
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='s'); bpy.ops.object.shade_smooth()
    me.materials.append(mat); parts.append(o)
    parts.append(prim('cyl', 'clasp', M('gold', C(0xe8b030), .3, 1.), (0, -.06, 1.62), (.17, .13, .03), v=24))

SKIN, HAIR = M('skin', C(0xe8b896), .6), M('hair', C(0x3a2416), .8)
STAGES = []
def stage(i, top, pants, boot, sleeve=None, **o):
    parts = []
    torso(parts, top, pants, belt=o.get('belt'), robe=o.get('robe'), coat=o.get('coat'))
    head(parts, SKIN, HAIR, beard=o.get('beard', False))
    for f in o.get('extras', []): f(parts)
    if o.get('cape'): cape(parts, o['cape'], o.get('capeIn'))
    body = join(parts, f'hero{i}_body')
    aL, aR = arm(f'hero{i}_armL', -1, sleeve or top, SKIN, o.get('cuff'), o.get('glove')), arm(f'hero{i}_armR', 1, sleeve or top, SKIN, o.get('cuff'), o.get('glove'))
    lL, lR = leg(f'hero{i}_legL', -1, pants, boot, o.get('tallBoot', False)), leg(f'hero{i}_legR', 1, pants, boot, o.get('tallBoot', False))
    root = bpy.data.objects.new(f'hero{i}', None); bpy.context.collection.objects.link(root)
    for p in (body, aL, aR, lL, lR): p.parent = root
    root.location.x = i*2.5   # laid out in a row for previews; the game reads each part by name

GOLD = M('gold', C(0xe8b030), .3, 1.)
def furHat(col):
    def f(parts): parts.append(prim('cyl', 'furhat', M('furhat', C(col), .95), (0, .01, 2.02), (.13, .13, .1), v=24)); parts.append(prim('cyl', 'furband', M('fur', C(0xf0e6d2), 1.), (0, .01, 1.975), (.135, .135, .035), v=24))
    return f
def pack(parts): parts.append(prim('cube', 'pack', M('leather', C(0x6a4422), .8), (0, .17, 1.35), (.26, .13, .32))); parts.append(prim('cube', 'roll', M('bedroll', C(0x8a5a2b), .9), (0, .17, 1.54), (.28, .1, .08)))
def beanie(col):
    def f(parts): parts.append(prim('sph', 'beanie', M('beanie', C(col), .9), (0, .015, 1.97), (.125, .135, .09))); parts.append(prim('cyl', 'beanieBand', M('beanieBand', C(col), .9), (0, .015, 1.94), (.127, .137, .03), v=24))
    return f
def vest(col):
    def f(parts):
        for sx in (-1, 1): parts.append(prim('cube', 'vest', M('vest', C(col), .6), (sx*.08, -.1, 1.38), (.1, .03, .38)))
    return f
def featherHat(parts):
    parts.append(prim('cyl', 'brim', M('navyHat', C(0x1e2a5a), .7), (0, .01, 1.995), (.2, .2, .015), v=32)); parts.append(prim('cyl', 'crownHat', M('navyHat', C(0x1e2a5a), .7), (0, .01, 2.05), (.12, .12, .1), v=24))
    parts.append(prim('cyl', 'hatband', GOLD, (0, .01, 2.01), (.122, .122, .02), v=24)); parts.append(prim('sph', 'feather', M('feather', C(0xf4f0e8), .9), (.07, .06, 2.12), (.025, .1, .02), rot=(.6, 0, -.3)))
def furCollar(parts): parts.append(prim('cyl', 'collar', M('ermine', C(0xf4f0e8), 1.), (0, 0, 1.63), (.24, .15, .06), v=32))
def chain(parts): parts.append(prim('cyl', 'chain', GOLD, (0, -.035, 1.55), (.14, .1, .012), rot=(.35, 0, 0), v=32)); parts.append(prim('sph', 'medal', GOLD, (0, -.135, 1.47), (.03, .012, .03)))
def suit(parts):
    parts.append(prim('cube', 'shirt', M('shirt', C(0xf6f6f6), .5), (0, -.112, 1.48), (.07, .01, .26)))
    parts.append(prim('cube', 'tie', M('tie', C(0xb8322a), .5), (0, -.122, 1.44), (.025, .01, .22)))
    for sx in (-1, 1): parts.append(prim('cube', 'lapel', M('suit', C(0x1e1e26), .5), (sx*.06, -.118, 1.5), (.04, .01, .18), rot=(0, sx*.2, 0)))
def topHat(parts): parts.append(prim('cyl', 'brimT', M('topHat', C(0x111114), .5), (0, .01, 1.995), (.17, .17, .015), v=32)); parts.append(prim('cyl', 'tallT', M('topHat', C(0x111114), .5), (0, .01, 2.12), (.11, .11, .24), v=32)); parts.append(prim('cyl', 'bandT', M('tie', C(0xb8322a), .5), (0, .01, 2.03), (.112, .112, .03), v=32))
def shades(parts): parts.append(prim('cube', 'shades', M('shades', C(0x0a0a0c), .1, .5), (0, -.118, 1.91), (.11, .012, .03)))
def armor(parts):
    for z, w in [(1.5, .23), (1.3, .2)]: parts.append(prim('cyl', 'plate', M('armor', C(0xe6e9ee), .25, .8), (0, 0, z), (w, w*.62, .07), v=32))
    parts.append(prim('cyl', 'goldTrim', GOLD, (0, 0, 1.4), (.21, .135, .02), v=32))

stage(0, M('tunic', C(0xd23c2c), .8), M('trousers', C(0x4a3a2a), .85), M('boot', C(0x3a2616), .7), belt=M('beltL', C(0x2a1d12), .6), extras=[furHat(0x7a4a2a), pack], beard=True)
stage(1, M('merchantShirt', C(0x2f8a7a), .7), M('merchantPants', C(0x5a4030), .8), M('boot2', C(0x2a1d12), .6), belt=M('beltL', C(0x2a1d12), .6), extras=[beanie(0x8a3a8a), vest(0xf2c200), pack])
stage(2, M('nobleCoat', C(0x2d4fa8), .5), M('nobleBreeches', C(0xf4ecd8), .6), M('blackBoot', C(0x111114), .3), tallBoot=True, belt=GOLD, coat=M('nobleCoat', C(0x2d4fa8), .5), extras=[featherHat], cape=M('redCape', C(0xb8322a), .7), cuff=GOLD)
stage(3, M('royalPurple', C(0x6a2a8a), .5), M('royalHose', C(0x3a1e4a), .6), M('blackBoot', C(0x111114), .3), robe=M('royalPurple', C(0x6a2a8a), .5), extras=[furCollar, chain], cape=M('redCape', C(0xb8322a), .7), cuff=GOLD, beard=True)
stage(4, M('suit', C(0x1e1e26), .45), M('suit', C(0x1e1e26), .45), M('oxford', C(0x111114), .2), extras=[suit, topHat, shades, chain], cuff=M('shirt', C(0xf6f6f6), .5))
stage(5, M('armor', C(0xe6e9ee), .25, .8), M('armorLeg', C(0xd8dce2), .3, .7), M('armorBoot', C(0xd8dce2), .3, .7), tallBoot=True, extras=[armor, chain], cape=M('navyCape', C(0x1f2a6a), .6), glove=M('armorBoot', C(0xd8dce2), .3, .7), cuff=GOLD)

for o in bpy.data.objects:
    if o.type == 'MESH' and o.name.startswith('hero'): print(o.name, len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
