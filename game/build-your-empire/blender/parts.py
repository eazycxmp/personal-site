# A library of smooth parts for people and buildings, exported as one .glb of named meshes.
# The game normalises every part to a 1x1x1 box centred on its origin and gives it size and colour,
# so parts are authored at natural proportions here and coloured in the game.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection

def finish(name, bm, smooth=True):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    return ob

def apply_mods(ob):
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    ob.select_set(False)

def bevelled_cube(name, size, width, segs=3):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    ob = finish(name, bm)
    b = ob.modifiers.new('b', 'BEVEL'); b.width = width; b.segments = segs; b.limit_method = 'NONE'
    apply_mods(ob); return ob

# ---- people ---------------------------------------------------------------------------------------
# a rounded box for hips and bellies
bevelled_cube('rbox', (1, 1, 1), .22, 3)

# a limb: a capsule that tapers toward the end, so thighs and upper arms are thicker than ankles and wrists
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=10, radius=.5)
for v in bm.verts:
    z = v.co.z
    if z > 0: v.co.z = z + .9                       # stretch the top half up into a capsule
    v.co.x *= 1 - .22 * (1 - (v.co.z + .5) / 1.9)   # taper toward the lower end
    v.co.y *= 1 - .18 * (1 - (v.co.z + .5) / 1.9)
finish('limb', bm)

# a shoe: a rounded toe, a flat sole and a raised heel collar
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=.5)
for v in bm.verts:
    v.co.y *= 1.7
    if v.co.z < -.12: v.co.z = -.12                 # flatten the sole
    if v.co.y < -.3: v.co.z += .08                  # the heel sits a little higher
finish('shoe', bm)

# a mitten hand with a thumb
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=8, radius=.5)
for v in bm.verts: v.co.z *= 1.25; v.co.x *= .8
t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=8, v_segments=6, radius=.2)
for v in t.verts: v.co += Vector((.38, .12, .1))
me = bpy.data.meshes.new('tmp'); t.to_mesh(me); t.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('hand', bm)

# a head with cheeks and a jaw instead of a ball
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=.5)
for v in bm.verts:
    if v.co.z < 0:
        v.co.x *= 1 - .25 * (-v.co.z / .5) ** 1.5       # narrow toward the chin
        if v.co.y > 0: v.co.y *= 1.06                   # the face sits a little forward
finish('head', bm)

# ---- buildings ------------------------------------------------------------------------------------
# a gable roof: two slopes with eaves overhanging the walls and a ridge cap
bm = bmesh.new()
W, D, H, T = 1.0, 1.0, .55, .06
pts = [(-W/2 - .08, -.0), (0, H), (W/2 + .08, -.0)]
for side in (0,):
    pass
vs = []
for y in (-D/2 - .06, D/2 + .06):
    ring = [bm.verts.new((-W/2 - .1, y, -T)), bm.verts.new((-W/2 - .1, y, 0)), bm.verts.new((0, y, H)), bm.verts.new((W/2 + .1, y, 0)), bm.verts.new((W/2 + .1, y, -T)), bm.verts.new((0, y, H - T*1.6))]
    vs.append(ring)
a, b = vs
for i in range(6): bm.faces.new((a[i], a[(i + 1) % 6], b[(i + 1) % 6], b[i]))
bm.faces.new(a); bm.faces.new(list(reversed(b)))
finish('gable', bm, smooth=False)

# a hipped roof
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=.75, radius2=.2, depth=.5)
bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/4, 3, 'Z'))
finish('hiproof', bm, smooth=False)

# an awning: a curved canvas with a scalloped valance along the front
bm = bmesh.new(); N = 8; prev = None
rows = []
for i in range(N + 1):
    a = (math.pi / 2) * i / N
    rows.append([bm.verts.new((x, -.5 + math.sin(a) * .9, .5 - (1 - math.cos(a)) * .7)) for x in (-.5, .5)])
for i in range(N): bm.faces.new((rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]))
end = rows[-1]; scal = []
for k in range(9):
    x = -.5 + k / 8
    scal.append(bm.verts.new((x, end[0].co.y, end[0].co.z - (.12 if k % 2 else .04))))
for k in range(8): bm.faces.new((bm.verts.new((-.5 + k/8, end[0].co.y, end[0].co.z)), bm.verts.new((-.5 + (k + 1)/8, end[0].co.y, end[0].co.z)), scal[k + 1], scal[k]))
finish('awning', bm, smooth=False)

# a fluted column with a base and a capital
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.42, radius2=.36, depth=1.0)
for v in bm.verts:
    ang = math.atan2(v.co.y, v.co.x); r = math.hypot(v.co.x, v.co.y)
    if r > .2: s = 1 - .05 * (1 + math.cos(ang * 8)) / 2; v.co.x *= s; v.co.y *= s
for z in (-.5, .5):
    c = bmesh.new(); bmesh.ops.create_cube(c, size=1.0); bmesh.ops.scale(c, vec=Vector((1.0, 1.0, .1)), verts=c.verts)
    for v in c.verts: v.co.z += z
    me = bpy.data.meshes.new('tmp'); c.to_mesh(me); c.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('column', bm, smooth=False)

# a dome on a drum
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=.5)
for v in list(bm.verts):
    if v.co.z < 0: v.co.z = 0
c = bmesh.new(); bmesh.ops.create_cone(c, cap_ends=True, segments=20, radius1=.54, radius2=.54, depth=.25)
for v in c.verts: v.co.z -= .12
me = bpy.data.meshes.new('tmp'); c.to_mesh(me); c.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('dome', bm)

# a pop-up tent roof: four curved panels rising to a peak
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=8, y_segments=8, size=.5)
for v in bm.verts:
    d = max(abs(v.co.x), abs(v.co.y)) / .5
    v.co.z = .55 * (1 - d) ** 1.6
finish('tent', bm)

# a barrel with a bulge and hoops
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=.42, radius2=.42, depth=1.0)
bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > .5], cuts=4)
for v in bm.verts:
    s = 1 + .14 * math.cos(v.co.z * math.pi); v.co.x *= s; v.co.y *= s
finish('barrel', bm)

# a chimney with a corbelled cap
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector((.8, .8, 1)), verts=bm.verts)
c = bmesh.new(); bmesh.ops.create_cube(c, size=1.0); bmesh.ops.scale(c, vec=Vector((1, 1, .14)), verts=c.verts)
for v in c.verts: v.co.z += .47
me = bpy.data.meshes.new('tmp'); c.to_mesh(me); c.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('chimney', bm, smooth=False)

# an arched window frame (a flat panel with an arched top)
bm = bmesh.new(); N = 10
verts = [bm.verts.new((-.5, 0, -.5)), bm.verts.new((.5, 0, -.5))]
for i in range(N + 1):
    a = math.pi * i / N
    verts.append(bm.verts.new((.5 * math.cos(a), 0, .0 + .5 * math.sin(a))))
bm.faces.new(verts)
finish('arch', bm, smooth=False)

# a street lantern
bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.35, radius2=.5, depth=.7)
c = bmesh.new(); bmesh.ops.create_cone(c, cap_ends=True, segments=6, radius1=.55, radius2=.05, depth=.3)
for v in c.verts: v.co.z += .5
me = bpy.data.meshes.new('tmp'); c.to_mesh(me); c.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
finish('lantern', bm, smooth=False)

mat = bpy.data.materials.new('part')
for ob in col.objects: ob.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_materials='PLACEHOLDER')
print('PARTS_DONE', [o.name for o in col.objects])
