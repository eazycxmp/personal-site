# A main battle tank (hull, tracks with wheels, turret with a long gun) and a modern jet fighter
# (pointed nose, bubble canopy, delta wings, twin tails, intakes, exhaust). Fronts point to Blender -Y.
import bpy, bmesh, math, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
def mats():
    lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
    def m(name, h, rough=.6, metal=.2):
        x = bpy.data.materials.new(name); x.use_nodes = True; b = x.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return x
    return m
def clear(): bpy.ops.wm.read_factory_settings(use_empty=True)
def box(name, size, loc, mat, bevel=.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size; o.data.materials.append(mat)
    if bevel: b = o.modifiers.new('b', 'BEVEL'); b.width = bevel; b.segments = 2
    return o
def cyl(name, r, d, loc, mat, rot=(0, 0, 0), verts=16, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d, location=loc, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=d, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.data.materials.append(mat); return o
def export(path):
    for o in bpy.context.scene.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True)

# ---- the tank (the turret is its own object so the game can traverse it)
clear(); m = mats()
OLIVE, DARK, TRACK, STEEL = m('armor', 0x5a6440, .75, .25), m('armor2', 0x4a5236, .8, .2), m('tracks', 0x2a2a2e, .9, .3), m('steel', 0x6a6e72, .4, .7)
box('hull', (2.2, 4.0, .7), (0, 0, .75), OLIVE, .08)
box('glacis', (2.1, .9, .45), (0, -2.15, .82), OLIVE, .06, rot=(math.radians(-35), 0, 0))
box('deck', (2.4, 3.6, .1), (0, .1, 1.12), DARK)
for sx in (-1, 1):
    box('track', (.55, 4.3, .75), (sx * 1.3, 0, .45), TRACK, .2)
    for k in range(6): cyl('wheel', .3, .58, (sx * 1.3, -1.6 + k * .64, .38), STEEL, rot=(0, math.pi / 2, 0), verts=12)
    box('skirt', (.1, 3.6, .4), (sx * 1.6, -.1, .72), DARK, .03)
tur = box('turret', (1.6, 2.0, .6), (0, .2, 1.48), OLIVE, .12)
cyl('mantlet', .28, .5, (0, -.85, 1.48), DARK, rot=(math.pi / 2, 0, 0))
cyl('gun', .09, 3.0, (0, -2.4, 1.5), STEEL, rot=(math.pi / 2, 0, 0), verts=10)
cyl('muzzle', .13, .3, (0, -3.85, 1.5), STEEL, rot=(math.pi / 2, 0, 0), verts=10)
cyl('hatch', .3, .12, (.35, .45, 1.84), DARK); box('mg', (.06, .6, .06), (.35, .15, 1.98), STEEL)
# parent the turret parts to the turret so they turn together
bpy.context.view_layer.update()
for n in ('mantlet', 'gun', 'muzzle', 'hatch', 'mg'):
    o = bpy.data.objects[n]; mw = o.matrix_world.copy(); o.parent = tur; o.matrix_world = mw
export(OUT + '/tank.glb')

# ---- the jet fighter
clear(); m = mats()
GREY, DARKG, GLASS, BURN = m('jet', 0x8a9098, .45, .5), m('jet2', 0x6a7078, .5, .5), m('canopy', 0x2a3a4a, .1, .6), m('exhaust', 0x3a3a3e, .4, .8)
bm = bmesh.new(); S = 16; rings = []
for i in range(13):
    t = i / 12; y = -3.2 + t * 6.4
    r = .55 * (math.sin(min(1, t / .35) * math.pi / 2) if t < .35 else 1 - max(0, t - .85) * 1.8)
    rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / S), y, r * .85 * math.sin(2 * math.pi * k / S))) for k in range(S)])
for i in range(12):
    for k in range(S): bm.faces.new((rings[i][k], rings[i][(k + 1) % S], rings[i + 1][(k + 1) % S], rings[i + 1][k]))
bm.faces.new(rings[-1])
me = bpy.data.meshes.new('fuselage'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('fuselage', me); bpy.context.collection.objects.link(o); o.data.materials.append(GREY)
for p in me.polygons: p.use_smooth = True
bpy.ops.mesh.primitive_uv_sphere_add(radius=.5, location=(0, -1.5, .42)); c = bpy.context.object; c.scale = (.55, 1.4, .5); c.data.materials.append(GLASS); c.name = 'canopy'
def wing(name, pts, z, mat, thick=.08):
    bm = bmesh.new(); top = [bm.verts.new((x, y, z + thick)) for x, y in pts]; bot = [bm.verts.new((x, y, z)) for x, y in pts]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(pts)): bm.faces.new((bot[i], bot[(i + 1) % len(pts)], top[(i + 1) % len(pts)], top[i]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.data.materials.append(mat); return o
for sx in (-1, 1):
    wing('wing', [(sx * .4, -1.2), (sx * 3.4, 1.5), (sx * 3.4, 2.0), (sx * .4, 2.3)], -.05, GREY)
    wing('stab', [(sx * .4, 2.4), (sx * 1.6, 3.2), (sx * 1.6, 3.5), (sx * .4, 3.5)], 0, DARKG, .05)
    f = wing('fin', [(-.0, 2.0), (1.6, 2.9), (1.6, 3.3), (0, 3.4)], 0, DARKG, .05); f.rotation_euler = (0, -math.pi / 2 + sx * .3, 0); f.location = (sx * .35, 0, .3)
    box('intake', (.32, 1.4, .4), (sx * .62, -.6, -.08), DARKG, .05)
cyl('nozzle', .38, .5, (0, 3.3, 0), BURN, rot=(math.pi / 2, 0, 0), r2=.32)
export(OUT + '/fighter.glb')
print('VEHICLES_DONE')
