# A modern airliner: tapered fuselage, rounded nose, upswept tail cone, swept wings with dihedral and
# winglets, engines on pylons, a swept fin, stabilisers, window strips and cockpit glass.
# Nose points to Blender -Y, which the glTF exporter turns into the game's +Z.
import bpy, bmesh, math, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
ENGINES = int(sys.argv[sys.argv.index('--') + 2])

bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection

def material(name, rgb, rough=.4, metal=.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    return m
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
BODY, TAIL, ENG, GLASS, BELLY = material('body', lin(0xf4f6f8), .35), material('tail', lin(0x1f4fa8), .4), material('engine', lin(0xc8ccd2), .3, .5), material('glass', lin(0x1a2430), .15, .3), material('belly', lin(0xd8dce2), .45)

def obj(name, bm, mats, smooth=True):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = smooth
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(name, me); col.objects.link(o); return o

# ---- fuselage: circular sections lofted from nose to tail
L, R = 10.0, .55
def radius(t):            # t = 0 at the nose, 1 at the tail
    if t < .12: return R * math.sqrt(1 - ((.12 - t) / .12) ** 2) * .98 + R * .02
    if t > .72: return R * (1 - ((t - .72) / .28) ** 1.4 * .82)
    return R
def centre_z(t): return 0 if t < .72 else ((t - .72) / .28) ** 1.6 * R * .55
bm = bmesh.new(); N, S = 40, 20; rings = []
for i in range(N + 1):
    t = i / N; y = -L / 2 + t * L; r = radius(t); cz = centre_z(t)
    rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / S), y, cz + r * 1.04 * math.sin(2 * math.pi * k / S))) for k in range(S)])
for i in range(N):
    for k in range(S):
        f = bm.faces.new((rings[i][k], rings[i][(k + 1) % S], rings[i + 1][(k + 1) % S], rings[i + 1][k]))
        f.material_index = 1 if math.sin(2 * math.pi * (k + .5) / S) < -.55 else 0
bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
obj('fuselage', bm, [BODY, BELLY])

# ---- window strips along both sides and the cockpit glass
for sx in (-1, 1):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector((.02, L * .6, .07)), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector((sx * R * 1.0, -.2, .2)), verts=bm.verts)
    obj('windows', bm, [GLASS], smooth=False)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=.5)
for v in bm.verts: v.co.x *= .7; v.co.y *= .35; v.co.z *= .18
bmesh.ops.translate(bm, vec=Vector((0, -L / 2 + .55, .25)), verts=bm.verts)
obj('cockpit', bm, [GLASS])

# ---- a swept, tapered surface with thickness (wings, stabilisers, fin)
def surface(name, root_y, root_c, tip_c, span, sweep, dihedral, thick, mat, vertical=False, side=1, z0=0.0, winglet=0.0):
    bm = bmesh.new()
    tip_y = root_y + math.tan(math.radians(sweep)) * span
    if vertical:
        P = [(0, root_y, z0), (0, root_y + root_c, z0), (0, tip_y + tip_c, z0 + span), (0, tip_y, z0 + span)]
    else:
        dz = math.tan(math.radians(dihedral)) * span
        P = [(0, root_y, z0), (0, root_y + root_c, z0), (side * span, tip_y + tip_c, z0 + dz), (side * span, tip_y, z0 + dz)]
    top = [bm.verts.new(Vector(p) + (Vector((thick, 0, 0)) if vertical else Vector((0, 0, thick)))) for p in P]
    bot = [bm.verts.new(Vector(p)) for p in P]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(4): bm.faces.new((bot[i], bot[(i + 1) % 4], top[(i + 1) % 4], top[i]))
    if winglet and not vertical:
        a, b = P[3], P[2]
        wl = [bm.verts.new(a), bm.verts.new(b), bm.verts.new((a[0] + side * .05, b[1], a[2] + winglet)), bm.verts.new((a[0] + side * .05, a[1] + (b[1] - a[1]) * .55 + .35, a[2] + winglet))]
        bm.faces.new(wl)
    return obj(name, bm, [mat], smooth=False)

for side in (-1, 1):
    surface('wing', -.6, 2.6, .7, 4.9, 30, 5, .14, BODY, side=side, z0=-.28, winglet=.55)
    surface('stab', 3.6, 1.15, .45, 1.9, 33, 6, .07, BODY, side=side, z0=centre_z(.92) + .05)
surface('fin', 3.35, 1.6, .7, 1.9, 38, 0, .08, TAIL, vertical=True, z0=centre_z(.85) + .3)

# ---- engines on pylons, under and ahead of the wing
spans = [1.75] if ENGINES == 2 else [1.6, 3.1]
for side in (-1, 1):
    for s in spans:
        wy = -.6 + math.tan(math.radians(30)) * s
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.36, radius2=.3, depth=1.35)
        for v in bm.verts: v.co = Vector((v.co.x, v.co.z, v.co.y))      # point along Y
        bmesh.ops.translate(bm, vec=Vector((side * s, wy - .55, -.62 + math.tan(math.radians(5)) * s)), verts=bm.verts)
        obj('engine', bm, [ENG])
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=.28, radius2=.28, depth=.02)
        for v in bm.verts: v.co = Vector((v.co.x, v.co.z, v.co.y))
        bmesh.ops.translate(bm, vec=Vector((side * s, wy - 1.23, -.62 + math.tan(math.radians(5)) * s)), verts=bm.verts)
        obj('intake', bm, [GLASS])
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.scale(bm, vec=Vector((.08, .9, .3)), verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector((side * s, wy - .2, -.36 + math.tan(math.radians(5)) * s)), verts=bm.verts)
        obj('pylon', bm, [BODY], smooth=False)

bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('PLANE_DONE', ENGINES)
