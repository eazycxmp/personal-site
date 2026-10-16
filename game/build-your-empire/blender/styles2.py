# Five more nations for the rival towns, each a landmark and a home, all original designs:
#  Egypt   - a temple with a pylon gate, obelisks and a colonnade; a flat-roofed sandstone house with a roof terrace
#  Greece  - a marble temple with fluted columns and a pediment; a whitewashed island house with a blue dome
#  Mexico  - a stepped pyramid with a temple on top and a long stair; an adobe house with timber vigas and a porch
#  Norway  - a tiered stave church with dragon-head gables; a turf-roofed timber longhouse
#  India   - a white domed mausoleum on a plinth with four minarets; an ochre haveli with carved balconies
# Fronts face -Y (the way you arrive). Origins sit at the base centre.
import bpy, sys, math
from mathutils import Vector
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def M(name, rgb, rough=.8, metal=0.):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    MATS[name] = m; return m
SAND, SAND2, PAINT, GOLD = M('sandstone', (.86, .74, .52)), M('sandstone2', (.78, .64, .42)), M('egyptBlue', (.12, .32, .6), .6), M('gold', (.95, .75, .25), .3, 1.)
MARBLE, MARBLE2, AEGEAN, TERRA = M('marble', (.95, .94, .9), .5), M('marbleShade', (.84, .82, .78), .6), M('aegean', (.1, .35, .75), .5), M('terracotta', (.75, .38, .22))
STONE, ADOBE, VIGA, JADE, RED = M('volcanic', (.56, .54, .5)), M('adobe', (.8, .55, .38)), M('viga', (.38, .24, .14)), M('jade', (.2, .55, .45)), M('aztecRed', (.7, .16, .12))
TAR, TIMBER, TURF, DRAGON = M('tarWood', (.16, .11, .08)), M('timber', (.45, .3, .18)), M('turf', (.33, .45, .2), .95), M('dragon', (.75, .55, .2), .4)
WHITE, IVORY, OCHRE, ROSE, DOMEGOLD = M('whiteMarble', (.97, .96, .94), .35), M('ivory', (.92, .88, .8), .5), M('ochre', (.85, .55, .2)), M('rose', (.8, .45, .45)), M('domeGold', (.9, .7, .3), .3, 1.)
GLASSD = M('darkWindow', (.08, .1, .14), .2)

def add(obj, mat, parts):
    obj.data.materials.append(mat); parts.append(obj); return obj
def box(parts, mat, size, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(scale=True, rotation=True); return add(o, mat, parts)
def cyl(parts, mat, r, d, loc, v=16, r2=None, rot=(0, 0, 0)):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, vertices=v, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=d, location=loc, vertices=v, rotation=rot)
    o = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); return add(o, mat, parts)
def sphere(parts, mat, r, loc, scale=(1, 1, 1), half=False):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12); o = bpy.context.object; o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    if half:
        import bmesh
        bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context='VERTS'); bm.to_mesh(o.data); bm.free()
    return add(o, mat, parts)
def wedge(parts, mat, w, d, h, loc, along='x'):
    # a gable/pediment prism, ridge along x (or y)
    import bmesh
    bm = bmesh.new()
    if along == 'x': pts = [(-w/2, -d/2, 0), (w/2, -d/2, 0), (w/2, d/2, 0), (-w/2, d/2, 0), (-w/2, 0, h), (w/2, 0, h)]
    else: pts = [(-w/2, -d/2, 0), (w/2, -d/2, 0), (w/2, d/2, 0), (-w/2, d/2, 0), (0, -d/2, h), (0, d/2, h)]
    v = [bm.verts.new(Vector(p) + Vector(loc)) for p in pts]
    if along == 'x': faces = [(0, 1, 2, 3), (0, 4, 5, 1), (3, 2, 5, 4), (0, 3, 4), (1, 5, 2)]
    else: faces = [(0, 1, 2, 3), (0, 4, 1), (3, 2, 5), (0, 3, 5, 4), (1, 4, 5, 2)]
    for f in faces: bm.faces.new([v[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('w'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('w', me); bpy.context.collection.objects.link(o)
    return add(o, mat, parts)
def group(name, parts, x):
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root)
    for p in parts: p.parent = root; p.name = name + '_' + p.name
    root.location.x = x
    return root

# ---------------------------------------------------------------- Egypt
p = []
box(p, SAND2, (9, 7, .5), (0, 0, .25))   # the pylon gate: two battered towers follow
for sx in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(radius1=1.9, radius2=1.45, depth=4.8, vertices=4, location=(sx*2.3, -2.8, 2.9), rotation=(0, 0, math.pi/4)); o = bpy.context.object; o.scale = (1.15, .55, 1); bpy.ops.object.transform_apply(scale=True, rotation=True); add(o, SAND, p)
    box(p, PAINT, (2.2, .06, .5), (sx*2.3, -3.42, 4.2)); box(p, SAND2, (2.5, 1.4, .25), (sx*2.3, -2.8, 5.4))
    cyl(p, SAND, .32, 4.5, (sx*4.2, -4.2, 2.75), 4, .06)   # obelisks
    cyl(p, GOLD, .08, .35, (sx*4.2, -4.2, 5.1), 4, .0)
box(p, SAND2, (1.4, .9, 3.2), (0, -2.8, 2.1)); box(p, GLASSD, (1.1, .1, 2.6), (0, -3.26, 1.8))   # the gateway
box(p, SAND, (7, 4.4, 3.4), (0, .8, 2.2))   # the hall behind
for i in range(6): cyl(p, SAND2, .3, 3.1, (-2.8 + i*1.12, -1.5, 2.05), 12)   # colonnade
box(p, SAND2, (7.4, 4.8, .35), (0, .8, 4.05))
for i in range(6): box(p, PAINT, (.5, .05, .25), (-2.8 + i*1.12, -1.48, 3.55))
egypt = group('cTempleEG', p, 0)
p = []
box(p, SAND, (3, 2.6, 2.2), (0, 0, 1.1)); box(p, SAND2, (3.1, 2.7, .2), (0, 0, 2.3)); box(p, SAND, (1.2, 1.2, .9), (-.7, .4, 2.85))
box(p, GLASSD, (.7, .06, 1.3), (0, -1.31, .65))
for sx in (-.95, .95): box(p, GLASSD, (.35, .06, .35), (sx, -1.31, 1.55))
for sx in (-1.4, 1.4): box(p, SAND2, (.1, 2.7, .35), (sx, 0, 2.5))
mud = group('mudHouseEG', p, 12)

# ---------------------------------------------------------------- Greece
p = []
for i, (w, d) in enumerate([(10, 6.6), (9.4, 6), (8.8, 5.4)]): box(p, MARBLE2, (w, d, .3), (0, 0, .15 + i*.3))   # stepped base
for ix in range(8):
    for iy in (0, 1):
        x = -3.9 + ix*1.114; y = -2.3 + iy*4.6; cyl(p, MARBLE, .3, 3.8, (x, y, 2.8), 12)
for iy in range(1, 4):
    for sx in (-3.9, 3.9): cyl(p, MARBLE, .3, 3.8, (sx, -2.3 + iy*1.15, 2.8), 12)
box(p, MARBLE2, (6, 3.2, 3.4), (0, .2, 2.6))   # the cella inside the colonnade
box(p, MARBLE, (9, 5.4, .6), (0, 0, 5))   # entablature
box(p, AEGEAN, (9.02, 5.42, .14), (0, 0, 4.85))
wedge(p, MARBLE, 9, 5.6, 1.4, (0, 0, 5.3), 'y')   # roof with pediments front and back
wedge(p, TERRA, 9.2, 5.8, 1.42, (0, 0, 5.36), 'y')
greece = group('cTempleGR', p, 24)
p = []
box(p, MARBLE, (3, 2.6, 2.4), (0, 0, 1.2)); box(p, MARBLE, (1.8, 1.8, 1.2), (.4, .2, 3))
sphere(p, AEGEAN, .8, (.4, .2, 3.6), half=True)
box(p, AEGEAN, (.7, .06, 1.4), (-.6, -1.31, .7)); for_w = [box(p, AEGEAN, (.4, .06, .45), (sx, -1.31, 1.6)) for sx in (.3, 1)]
box(p, MARBLE2, (3.1, 2.7, .12), (0, 0, 2.43))
white = group('whiteHouseGR', p, 36)

# ---------------------------------------------------------------- Mexico
p = []
for i in range(6):
    s = 10 - i*1.45; box(p, STONE if i % 2 == 0 else M('volcanic2', (.5, .48, .44)), (s, s, 1.05), (0, 0, .52 + i*1.05))
box(p, M('stair', (.62, .58, .52)), (2.2, 6.2, .3), (0, -3.4, 3.2), (math.radians(44), 0, 0))   # the great stair
for sx in (-1.25, 1.25): box(p, STONE, (.3, 7, .5), (sx, -3.4, 3.3), (math.radians(44), 0, 0))
box(p, RED, (2.8, 2.4, 1.7), (0, .2, 7.15)); box(p, JADE, (3.2, 2.8, .35), (0, .2, 8.2)); box(p, GLASSD, (.9, .1, 1.1), (0, -1.02, 6.85))
for sx in (-1, 1): box(p, M('carving', (.85, .78, .55)), (.5, .5, .5), (sx*1.2, -1, 8.5))
aztec = group('cPyramidMX', p, 48)
p = []
box(p, ADOBE, (3.4, 2.6, 2.2), (0, 0, 1.1)); box(p, M('adobeTop', (.72, .48, .32)), (3.5, 2.7, .25), (0, 0, 2.3))
for i in range(5): cyl(p, VIGA, .07, .7, (-1.4 + i*.7, -1.6, 2.0), 8, rot=(math.pi/2, 0, 0))
box(p, VIGA, (3.6, 1.2, .1), (0, -1.9, 1.9)); for_p = [cyl(p, VIGA, .07, 1.9, (sx, -2.4, .95), 8) for sx in (-1.6, 1.6)]
box(p, M('door', (.25, .45, .55)), (.7, .06, 1.3), (0, -1.31, .65)); box(p, GLASSD, (.45, .06, .45), (-1, -1.31, 1.3)); box(p, GLASSD, (.45, .06, .45), (1, -1.31, 1.3))
cyl(p, M('cactus', (.25, .5, .25)), .18, 1.6, (2.1, -1.5, .8), 10)
adobe = group('adobeMX', p, 60)

# ---------------------------------------------------------------- Norway
p = []
box(p, TIMBER, (5, 4, .4), (0, 0, .2))
for i, (w, h) in enumerate([(4.6, 2.2), (3.4, 1.8), (2.4, 1.6), (1.4, 1.4)]):
    z0 = .4 + sum(x[1]*.75 for x in [(4.6, 2.2), (3.4, 1.8), (2.4, 1.6), (1.4, 1.4)][:i])
    box(p, TAR, (w*.8, w*.7, h*.6), (0, 0, z0 + h*.3))
    for along in ('x',):
        wedge(p, TAR, w, w*.85, h*.55, (0, 0, z0 + h*.6), 'y')
    for sy in (-1, 1): cyl(p, DRAGON, .08, .9, (0, sy*(w*.43), z0 + h*1.1), 6, .02, rot=(sy*.9, 0, 0))   # dragon heads on the gables
cyl(p, TAR, .15, 2.4, (0, 0, 6.2), 6, .02)
box(p, M('stavePorch', (.5, .32, .18)), (1.3, .8, 1.8), (0, -1.9, 1.3)); box(p, GLASSD, (.7, .06, 1.2), (0, -2.31, 1))
stave = group('cStaveNO', p, 72)
p = []
box(p, TIMBER, (2.6, 5, 1.6), (0, 0, .8))
wedge(p, TURF, 3.4, 5.4, 1.6, (0, 0, 1.6), 'y')
box(p, TAR, (.8, .06, 1.2), (0, -2.52, .6)); cyl(p, M('smoke', (.3, .3, .3)), .12, .6, (.6, .8, 3.1), 8)
for sx in (-1.3, 1.3): box(p, TAR, (.12, 5.1, .14), (sx, 0, 1.62))
longh = group('longhouseNO', p, 84)

# ---------------------------------------------------------------- India
p = []
box(p, ROSE, (11, 11, .8), (0, 0, .4)); box(p, WHITE, (9.6, 9.6, .25), (0, 0, .92))
box(p, WHITE, (5.4, 5.4, 4.2), (0, 0, 3.15))
for sx in (-1, 1):
    for sy in (-1, 1): bpy.ops.mesh.primitive_cube_add(size=1, location=(sx*2.2, sy*2.2, 3.15)); o = bpy.context.object; o.scale = (1.6, 1.6, 4.2); o.rotation_euler = (0, 0, math.pi/4); bpy.ops.object.transform_apply(scale=True, rotation=True); add(o, IVORY, p)
box(p, GLASSD, (1.6, .1, 2.8), (0, -2.72, 2.5)); wedge(p, IVORY, 2, .3, .8, (0, -2.75, 3.9), 'y')
cyl(p, WHITE, 1.6, 1, (0, 0, 5.75), 24)
sphere(p, WHITE, 2.1, (0, 0, 6.1), scale=(1, 1, 1.25), half=True)
cyl(p, DOMEGOLD, .12, 1.2, (0, 0, 9.3), 8, .02)
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = sx*4.6, sy*4.6; cyl(p, WHITE, .35, 7, (x, y, 4.3), 12, .28)
        cyl(p, IVORY, .5, .15, (x, y, 5.6), 12); cyl(p, IVORY, .45, .15, (x, y, 7.2), 12)
        sphere(p, WHITE, .4, (x, y, 7.8), half=True); cyl(p, DOMEGOLD, .05, .4, (x, y, 8.4), 6, .01)
    for k in (-1, 1): sphere(p, WHITE, .75, (sx*1.9, k*1.9, 5.35), half=True)
mahal = group('cMahalIN', p, 96)
p = []
box(p, OCHRE, (3.2, 2.8, 3.4), (0, 0, 1.7)); box(p, M('ochreTrim', (.95, .85, .6)), (3.3, 2.9, .2), (0, 0, 3.5))
for sx in (-.9, .9):
    box(p, M('balcony', (.95, .85, .6)), (.9, .5, .6), (sx, -1.6, 2.2)); sphere(p, M('balcony', (.95, .85, .6)), .45, (sx, -1.6, 2.55), scale=(1, .6, .7), half=True)
    box(p, GLASSD, (.5, .06, .5), (sx, -1.86, 2.1))
box(p, M('haveliDoor', (.45, .25, .12)), (.8, .06, 1.5), (0, -1.41, .75))
for sx in (-1.4, 1.4): sphere(p, OCHRE, .4, (sx, 1, 3.75), half=True)
haveli = group('haveliIN', p, 108)

for o in bpy.data.objects:
    if o.type == 'EMPTY': print(o.name, sum(len(c.data.polygons) for c in o.children))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
