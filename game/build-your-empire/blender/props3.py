# Chunky, glossy props in the cosy idle-game style: a raw steak (thin, so they stack into tall towers), a roast
# drumstick, a bread loaf, a log with bark and growth rings, a layered clay dome oven, and a wooden stand that output
# stacks sit on. Original models; objects are named item_* and prop_*. Front faces -Y (glTF +Z). Units are game units.
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def M(name, rgb, rough=.45, metal=0., emit=None):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 2.5
    MATS[name] = m; return m
def lin(c): return tuple((v/12.92 if v <= .04045 else ((v + .055)/1.055)**2.4) for v in c)
def C(h): return lin(tuple(((h >> s) & 255)/255 for s in (16, 8, 0)))
def prim(kind, name, mat, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    if kind == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc, segments=kw.get('seg', 24), ring_count=kw.get('rings', 12))
    elif kind == 'cyl': bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, location=loc, vertices=kw.get('v', 24))
    elif kind == 'torus': bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=kw.get('minor', .2), location=loc, major_segments=kw.get('v', 32), minor_segments=12)
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=kw.get('r2', 0), depth=1, location=loc, vertices=kw.get('v', 24))
    else: bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if kw.get('bevel'):
        md = o.modifiers.new('b', 'BEVEL'); md.width = kw['bevel']; md.segments = 3; bpy.ops.object.modifier_apply(modifier='b')
    if kind != 'cube' or kw.get('bevel'): bpy.ops.object.shade_smooth()
    o.data.materials.append(mat); return o
def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join(); o = bpy.context.object; o.name = name; return o
def rounded_slab(name, mat, w, d, h, r, loc=(0, 0, 0)):
    # a rounded-corner slab (a bevelled cube)
    o = prim('cube', name, mat, loc, (w, d, h), bevel=r); return o

RAW = M('raw', C(0xd2404a), .42); FAT = M('fat', C(0xf6e6dc), .4); MARB = M('marble', C(0xe7a6a8), .45)
ROAST = M('roastSkin', C(0x9a4a1a), .32); ROAST2 = M('roastHi', C(0xc8702a), .3); BONE = M('bone', C(0xf4ecd8), .5)
CRUST = M('crust', C(0xd8913e), .5); CRUST2 = M('crustTop', C(0xb86a26), .45); SCORE = M('score', C(0xf2d6a0), .55)
BARK = M('bark', C(0x6e4424), .8); WOOD = M('woodEnd', C(0xe8c48a), .6); RING = M('ring', C(0xc89a5e), .6)
CLAY = M('clay', C(0xcf8456), .7); CLAY2 = M('clayDark', C(0xa8643e), .75); GLOW = M('glow', C(0xffc860), .5, emit=C(0xffa030))
PLANK = M('plank', C(0x9a5e38), .7); PLANK2 = M('plankDark', C(0x7a4628), .75)

# ---- raw steak: a rounded slab with a fat rim and marbling, 0.11 thick
parts = [prim('cyl', 'steak', RAW, (0, 0, 0), (.29, .22, .1), v=32)]
parts.append(prim('torus', 'fatrim', FAT, (.02, .02, .0), (.3, .23, .24), minor=.09, v=32))
for x, y, sx, sy in [(-.1, -.04, .09, .02), (.08, .06, .07, .015), (.02, -.09, .06, .015), (.12, -.05, .05, .012)]: parts.append(prim('sph', 'marb', MARB, (x, y, .05), (sx, sy, .008)))
join(parts, 'item_meat')
# ---- roast drumstick: a glossy browned leg with a bone
parts = [prim('sph', 'leg', ROAST, (0, 0, 0), (.22, .17, .15)), prim('sph', 'hi', ROAST2, (-.02, -.02, .07), (.15, .11, .06))]
parts.append(prim('cyl', 'bone', BONE, (.27, 0, 0), (.035, .035, .22), (0, math.pi/2, 0), v=12))
for y in (-.03, .03): parts.append(prim('sph', 'knob', BONE, (.39, y, 0), (.045, .045, .045)))
join(parts, 'item_drumstick')
# ---- bread loaf: a rounded crust with three scores
parts = [rounded_slab('loaf', CRUST, .56, .3, .2, .09), prim('sph', 'dome', CRUST2, (0, 0, .07), (.27, .14, .09))]
for x in (-.14, 0, .14): parts.append(prim('cube', 'score', SCORE, (x, 0, .155), (.03, .2, .02), (0, 0, .5)))
join(parts, 'item_bread')
# ---- a log: bark round the sides, pale ends with a ring
parts = [prim('cyl', 'logbark', BARK, (0, 0, 0), (.15, .15, .86), (0, math.pi/2, 0), v=14)]
for s in (-1, 1):
    parts.append(prim('cyl', 'end', WOOD, (s*.432, 0, 0), (.135, .135, .01), (0, math.pi/2, 0), v=14))
    parts.append(prim('torus', 'ring', RING, (s*.438, 0, 0), (.08, .08, .08), (0, math.pi/2, 0), minor=.12, v=16))
join(parts, 'item_log')
# ---- the clay dome oven: stacked clay rings, a glowing mouth, a chimney, on a square clay base
parts = [rounded_slab('base', CLAY2, 2.4, 2.2, .55, .12, (0, 0, .275))]
for k in range(6):
    r = 1.0*math.cos(k/6*math.pi/2*.95) + .02; z = .62 + k*.21
    parts.append(prim('torus', 'layer', CLAY if k % 2 == 0 else CLAY2, (0, 0, z), (r, r, 1), minor=.13, v=40))
    parts.append(prim('cyl', 'fill', CLAY, (0, 0, z), (r, r, .22), v=40))
parts.append(prim('sph', 'cap', CLAY, (0, 0, 1.95), (.3, .3, .14)))
parts.append(prim('cyl', 'chimney', CLAY2, (0, .1, 2.1), (.2, .2, .3), v=16)); parts.append(prim('torus', 'chimRim', CLAY, (0, .1, 2.26), (.2, .2, .2), minor=.25, v=16))
# the mouth: an arch of clay with a glow inside
parts.append(prim('cube', 'mouthGlow', GLOW, (0, -.82, .98), (.62, .2, .42)))
parts.append(prim('cyl', 'archGlow', GLOW, (0, -.82, 1.19), (.31, .31, .2), (math.pi/2, 0, 0), v=20))
parts.append(prim('torus', 'arch', CLAY2, (0, -.9, 1.19), (.38, .38, .38), (math.pi/2, 0, 0), minor=.18, v=24))
join(parts, 'prop_oven')
# ---- a wooden stand: a slatted top on four short legs
parts = []
for k in range(5): parts.append(prim('cube', 'slat', PLANK if k % 2 else PLANK2, (0, -.52 + k*.26, .22), (1.3, .23, .07), bevel=.015))
for x in (-.55, .55):
    parts.append(prim('cube', 'rail', PLANK2, (x, 0, .15), (.12, 1.3, .1), bevel=.02))
    for y in (-.55, .55): parts.append(prim('cube', 'leg', PLANK2, (x, y, .06), (.12, .12, .14), bevel=.02))
join(parts, 'prop_stand')

# ---- the burger: bun, patty, cheese, lettuce, tomato, sesame bun top
BUN = M('bun', C(0xe0a050), .45); BUNTOP = M('bunTop', C(0xd08a38), .38); SESAME = M('sesame', C(0xfff2d0), .5)
PATTY = M('patty', C(0x6a3418), .55); CHEESE = M('cheese', C(0xffc830), .35); LETTUCE = M('lettuce', C(0x6cc040), .5); TOMATO = M('tomato', C(0xe0402a), .35)
parts = [prim('cyl', 'bunBot', BUN, (0, 0, .04), (.25, .25, .09), v=28)]
parts.append(prim('cyl', 'patty', PATTY, (0, 0, .12), (.255, .255, .075), v=28))
parts.append(prim('cube', 'cheese', CHEESE, (0, 0, .165), (.4, .4, .02), (0, 0, .4), bevel=.01))
parts.append(prim('torus', 'lettuce', LETTUCE, (0, 0, .19), (.25, .25, .25), minor=.12, v=20))
parts.append(prim('cyl', 'tomato', TOMATO, (0, 0, .21), (.21, .21, .03), v=20))
parts.append(prim('sph', 'bunTop', BUNTOP, (0, 0, .23), (.26, .26, .15)))
for k in range(9):
    a = k*2.4; r = .08 + (k % 3)*.05
    parts.append(prim('sph', 'seed', SESAME, (math.cos(a)*r, math.sin(a)*r, .23 + .15*math.sqrt(max(0, 1 - (r/.26)**2)) - .005), (.018, .01, .008)))
join(parts, 'item_roast')
# ---- a burger patty (what the butcher cuts the meat into)
parts = [prim('cyl', 'p', PATTY, (0, 0, 0), (.22, .22, .07), v=24)]
for k in range(6): a = k*1.1; parts.append(prim('sph', 'crumb', M('pattyHi', C(0x8a4a24), .5), (math.cos(a)*.11, math.sin(a)*.11, .035), (.05, .04, .012)))
join(parts, 'item_patty')
# ---- a head of lettuce: crisp leaves curled round a pale heart
parts = [prim('sph', 'heart', M('lettuceHeart', C(0xc8ea8a), .5), (0, 0, .1), (.13, .13, .12))]
for k in range(7):
    a = k/7*math.pi*2; parts.append(prim('sph', 'leaf', LETTUCE, (math.cos(a)*.1, math.sin(a)*.1, .1), (.13, .07, .12), (0, .25, a)))
join(parts, 'item_lettuce')
# ---- the burger grill: a steel counter with a hot griddle, a hood on posts, a lamp of heat
STEEL = M('steel', C(0xc8ccd0), .3, .7); DARK = M('griddle', C(0x2a2a2e), .4, .5); HOT = M('hot', C(0xff8a30), .4, emit=C(0xff6a20))
parts = [rounded_slab('counter', STEEL, 2.2, 1.3, .9, .06, (0, 0, .45)), prim('cube', 'griddle', DARK, (0, 0, .92), (1.8, 1, .04))]
parts.append(prim('cube', 'glow', HOT, (0, -.66, .55), (1.7, .02, .32)))
for x in (-1, 1): parts.append(prim('cube', 'post', STEEL, (x*1.02, .55, 1.4), (.08, .08, 1.1)))
parts.append(rounded_slab('hood', STEEL, 2.3, .9, .18, .05, (0, .3, 2.0)))
for x, y in [(-.5, -.15), (.1, .2), (.6, -.2)]: parts.append(prim('cyl', 'gPatty', PATTY, (x, y, .97), (.2, .2, .06), v=20))
join(parts, 'prop_grill')
# ---- the butcher's chopping block with a cleaver in it
parts = [prim('cyl', 'block', M('blockWood', C(0xa8743e), .7), (0, 0, .4), (.45, .45, .8), v=20), prim('cyl', 'top', WOOD, (0, 0, .805), (.43, .43, .02), v=20)]
parts.append(prim('cube', 'blade', STEEL, (.05, 0, .98), (.42, .03, .26)))
parts.append(prim('cyl', 'handle', M('handle', C(0x3a2416), .6), (-.32, 0, 1.06), (.04, .04, .3), (0, math.pi/2, 0), v=10))
join(parts, 'prop_block')
# ---- a lettuce plant for the garden rows
parts = [prim('sph', 'pl', LETTUCE, (0, 0, .12), (.22, .22, .14))]
for k in range(5): a = k/5*math.pi*2; parts.append(prim('sph', 'pleaf', M('lettuceDark', C(0x4aa030), .5), (math.cos(a)*.15, math.sin(a)*.15, .07), (.14, .08, .06), (0, .3, a)))
join(parts, 'prop_lettuce')
for o in bpy.data.objects:
    if o.type == 'MESH': print(o.name, len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
