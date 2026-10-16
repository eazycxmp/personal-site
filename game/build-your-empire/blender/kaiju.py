# A Godzilla-like kaiju: upright on thick legs, small arms, a long heavy tail, a broad head with a jaw,
# and three rows of jagged dorsal plates. Each limb is its own object with its origin at the joint so the
# game can swing it. The face points to Blender -Y (the game's +Z). Exported in metres; the game scales it.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
def material(name, rgb, rough=.8, metal=0.0, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 0.0
    return m
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
SKIN, BELLY, PLATE, EYE, TEETH = material('skin', lin(0x2e3430)), material('belly', lin(0x4a4f44)), material('plates', lin(0xd8dcd0), .6), material('eyes', lin(0xffd040), .3), material('teeth', lin(0xf4f0e6), .5)

def blob(bm, centre, radii, segs=(14, 10)):
    t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=segs[0], v_segments=segs[1], radius=1)
    for v in t.verts: v.co = Vector((v.co.x * radii[0], v.co.y * radii[1], v.co.z * radii[2])) + Vector(centre)
    me = bpy.data.meshes.new('t'); t.to_mesh(me); t.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)

def tube(bm, pts, segs=16):
    """Loft a smooth tube through (x, y, z, rx, rz) rings: rx across, rz up/down."""
    rings = []
    for i, (x, y, z, rx, rz) in enumerate(pts):
        if i < len(pts) - 1: d = Vector(pts[i + 1][:3]) - Vector((x, y, z))
        else: d = Vector((x, y, z)) - Vector(pts[i - 1][:3])
        d.normalize(); side = Vector((1, 0, 0)); up = d.cross(side).normalized()
        rings.append([bm.verts.new(Vector((x, y, z)) + side * rx * math.cos(2 * math.pi * k / segs) + up * rz * math.sin(2 * math.pi * k / segs)) for k in range(segs)])
    for i in range(len(rings) - 1):
        for k in range(segs): bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])

def part(name, origin, build, mats):
    bm = bmesh.new(); build(bm)
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    for m in mats: me.materials.append(m)
    ob = bpy.data.objects.new(name, me); ob.location = origin; col.objects.link(ob); return ob

def plates(bm, pts, size, w=(0, 1, 0), e=(0, 0, 1)):
    # jagged maple-leaf plates: notched fans that stick out of the spine along e, spread along w
    w, e = Vector(w).normalized(), Vector(e).normalized()
    for p, s in zip(pts, size):
        p = Vector(p); verts = []
        for k in range(11):
            a = math.pi * k / 10
            r = s * (1 if k % 2 == 0 else .58)
            verts.append(bm.verts.new(p + w * math.cos(a) * r * .5 + e * math.sin(a) * r))
        verts.append(bm.verts.new(p - e * s * .15))
        f = bm.faces.new(verts); f.material_index = 1
        ext = bmesh.ops.extrude_face_region(bm, geom=[f])
        nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=nv, vec=(.09, 0, 0)); bmesh.ops.translate(bm, verts=nv + verts, vec=(-.045, 0, 0))

# ---- torso, neck and dorsal plates (origin at the hips)
def torso(bm):
    # one smooth trunk from the hips up through the chest to the neck, leaning a little forward
    tube(bm, [(0, .25, -.2, .9, .9), (0, .15, .5, 1.25, 1.15), (0, .05, 1.4, 1.3, 1.2), (0, -.1, 2.3, 1.15, 1.1), (0, -.3, 3.1, .9, .85), (0, -.5, 3.7, .68, .66), (0, -.65, 4.1, .55, .55)], 20)
    blob(bm, (0, -.55, 1.5), (.95, .55, 1.25))          # the chest and belly
    for f in bm.faces: f.material_index = 0
    # the back surface of the trunk, from the neck down to the hips
    back = lambda z: max(-.05, min(1.25, 1.25 - max(0, z - 1.6) * .55))
    zs = [4.0 - i * .45 for i in range(10)]
    plates(bm, [(0, back(z) - .12, z) for z in zs], [.55, .8, 1.05, 1.2, 1.25, 1.2, 1.05, .9, .7, .5], w=(0, -.35, 1), e=(0, 1, .35))
    for side in (-.4, .4):
        plates(bm, [(side, back(z) - .2, z) for z in zs[1:8]], [.45, .65, .8, .85, .8, .65, .5], w=(0, -.35, 1), e=(side * .8, 1, .35))
part('torso', (0, 0, 2.6), torso, [SKIN, PLATE])

# ---- head with brow, snout and jaw (origin at the neck)
def head(bm):
    tube(bm, [(0, .1, .05, .5, .55), (0, -.35, .12, .58, .55), (0, -.8, .05, .5, .42), (0, -1.15, -.02, .38, .3), (0, -1.38, -.05, .22, .18)], 16)
    for sx in (-1, 1): blob(bm, (sx * .32, -.62, .45), (.16, .3, .1), (8, 6))   # heavy brows
    for f in bm.faces: f.material_index = 0
    for sx in (-1, 1):
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=8, v_segments=6, radius=.075)
        for v in t.verts: v.co += Vector((sx * .4, -.66, .3))
        me = bpy.data.meshes.new('t'); t.to_mesh(me); t.free(); n0 = len(bm.faces); bm.from_mesh(me); bpy.data.meshes.remove(me)
        bm.faces.ensure_lookup_table()
        for f in list(bm.faces)[n0:]: f.material_index = 1
    for k in range(9):
        x = -.32 + k * .08
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=4, radius1=.04, radius2=0, depth=.14)
        for v in t.verts: v.co = Vector((v.co.x + x, v.co.y - 1.25 + abs(x) * .9, -v.co.z - .2))
        me = bpy.data.meshes.new('t'); t.to_mesh(me); t.free(); n0 = len(bm.faces); bm.from_mesh(me); bpy.data.meshes.remove(me)
        bm.faces.ensure_lookup_table()
        for f in list(bm.faces)[n0:]: f.material_index = 2
part('head', (0, -.75, 6.35), head, [SKIN, EYE, TEETH])
def jaw(bm):
    tube(bm, [(0, -.05, -.18, .45, .2), (0, -.6, -.22, .4, .18), (0, -1.1, -.2, .26, .12)], 12)
    for f in bm.faces: f.material_index = 0
part('jaw', (0, -.75, 6.2), jaw, [BELLY])

# ---- legs (origin at the hip joints), arms (origin at the shoulders), tail (origin at the base)
for name, sx in (('legL', -1), ('legR', 1)):
    def leg(bm, sx=sx):
        tube(bm, [(0, .1, .1, .75, .8), (0, .15, -.8, .78, .82), (0, .05, -1.6, .55, .6), (0, .2, -2.3, .42, .45), (0, .1, -2.75, .4, .4)], 16)
        blob(bm, (0, -.35, -2.85), (.55, .8, .22))     # broad foot
        for k in (-1, 0, 1): blob(bm, (k * .24, -1.1, -2.9), (.1, .18, .09), (6, 4))
    part(name, (sx * .82, 0, 2.95), leg, [SKIN])
for name, sx in (('armL', -1), ('armR', 1)):
    def arm(bm, sx=sx):
        blob(bm, (0, -.15, -.35), (.2, .22, .45))
        blob(bm, (0, -.4, -.85), (.16, .2, .38))
        for k in (-1, 0, 1): blob(bm, (k * .07, -.55, -1.22), (.04, .05, .12), (6, 4))
    part(name, (sx * 1.0, -.7, 4.8), arm, [SKIN])
def tail(bm):
    pts = []
    for i in range(14):
        t = i / 13; r = .95 * (1 - t) ** 1.1 + .06
        pts.append((0, .3 + t * 7.2, -.2 - math.sin(t * 2.2) * 1.0 + t * .4, r, r * .92))
    tube(bm, pts, 16)
    for f in bm.faces: f.material_index = 0
    plates(bm, [(0, .7 + i * .62, .62 - math.sin(i / 11 * 2.2) * 1.0 + i / 11 * .4 + .05) for i in range(11)], [.6 - i * .045 for i in range(11)])
part('tail', (0, .5, 2.3), tail, [SKIN, PLATE])

for ob in col.objects: ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('KAIJU_DONE', [o.name for o in col.objects])
