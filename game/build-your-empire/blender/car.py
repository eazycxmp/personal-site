# An original mid-engine sports car: a low lofted body with flowing fenders, a glass canopy, big wheels with spokes,
# LED head and tail lights, side intakes and a rear wing. The wheels are separate objects (origin at the hub) so they spin.
# Front points to Blender -Y (the game's +Z). Length ~4.5 m.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
def M(name, h, rough=.3, metal=.0, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*lin(h), 1); b.inputs['Emission Strength'].default_value = emit
    return m
RED, GLASS, BLACK, CHROME = M('paint', 0xd0121a, .18, .35), M('glass', 0x0e1622, .05, .6), M('trim', 0x141416, .5, .2), M('rim', 0xc8ccd0, .2, .9)
HEAD, TAIL, TYRE = M('headlight', 0xfff4dc, .1, 0, 3), M('taillight', 0xff2a1a, .2, 0, 4), M('tyre', 0x1a1a1a, .9)

def loft(name, sections, mat, smooth=True):
    """sections: (y, half-width, z-bottom, z-top, roundness) cross sections along the car, joined into a closed skin."""
    bm = bmesh.new(); rings = []; K = 18
    for (y, w, zb, zt, rnd) in sections:
        ring = []
        for k in range(K):
            a = 2*math.pi*k/K; c, s = math.cos(a), math.sin(a)
            # a superellipse: flat-ish sides and a rounded top
            px = w * math.copysign(abs(c)**rnd, c); pz = (zb + zt)/2 + (zt - zb)/2 * math.copysign(abs(s)**rnd, s)
            ring.append(bm.verts.new((px, y, pz)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for k in range(K): bm.faces.new((rings[i][k], rings[i][(k + 1) % K], rings[i + 1][(k + 1) % K], rings[i + 1][k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob); me.materials.append(mat)
    sub = ob.modifiers.new('s', 'SUBSURF'); sub.levels = 1
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier='s')
    for p in me.polygons: p.use_smooth = smooth
    return ob

def box(name, s, at, mat, rx=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at); o = bpy.context.object; o.name = name; o.scale = s; o.rotation_euler = (rx, 0, 0); o.data.materials.append(mat); return o

# the body: a long low wedge, wide at the hips, with a sharp nose
body = loft('car_body', [(-2.25, .62, .28, .5, .55), (-2.0, .86, .24, .62, .45), (-1.4, .95, .22, .74, .35), (-.6, .96, .22, .78, .3),
                         (.2, .98, .22, .8, .3), (1.0, 1.0, .22, .82, .32), (1.7, .98, .24, .8, .38), (2.15, .9, .3, .72, .45), (2.3, .7, .36, .62, .6)], RED)
# the glass canopy, set back, teardrop shaped
cab = loft('car_glass', [(-.75, .5, .7, .78, .6), (-.4, .66, .7, 1.12, .55), (.2, .66, .7, 1.18, .55), (.8, .58, .7, 1.05, .6), (1.15, .42, .7, .86, .65)], GLASS)
# side intakes, a splitter, a diffuser, a rear wing on two posts
for sx in (-1, 1):
    box('car_intake', (.06, .7, .2), (sx*.99, .55, .5), BLACK)
    box('car_mirror', (.16, .1, .08), (sx*.72, -.55, .95), RED)
box('car_splitter', (1.7, .25, .05), (0, -2.2, .25), BLACK)
box('car_diffuser', (1.6, .3, .18), (0, 2.25, .32), BLACK)
box('car_wing', (1.8, .32, .05), (0, 2.0, 1.02), BLACK, -.12)
for sx in (-.6, .6): box('car_wingpost', (.05, .08, .2), (sx, 2.02, .9), BLACK)
# lights: slim LED headlights and a light bar across the tail
for sx in (-1, 1):
    box('car_head', (.34, .08, .05), (sx*.55, -2.18, .5), HEAD, .4)
    box('car_tail', (.42, .05, .06), (sx*.5, 2.32, .62), TAIL)
    for k in range(2): bpy.ops.mesh.primitive_cylinder_add(radius=.07, depth=.1, location=(sx*(.25 + k*.17), 2.33, .4), rotation=(math.pi/2, 0, 0)); e = bpy.context.object; e.name = 'car_exhaust'; e.data.materials.append(CHROME)
# wheels: a tyre and a spoked rim each, origin at the hub
for i, (x, y) in enumerate([(-.88, -1.45), (.88, -1.45), (-.9, 1.35), (.9, 1.35)]):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.36, depth=.3, location=(x, y, .36), rotation=(0, math.pi/2, 0)); t = bpy.context.object; t.name = f'car_wheel{i}'; t.data.materials.append(TYRE)
    for p in t.data.polygons: p.use_smooth = True
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.25, depth=.32, location=(x, y, .36), rotation=(0, math.pi/2, 0)); r = bpy.context.object; r.data.materials.append(CHROME)
    for k in range(5):
        a = k*2*math.pi/5; bpy.ops.mesh.primitive_cube_add(size=1, location=(x + math.copysign(.165, x), y + math.cos(a)*.12, .36 + math.sin(a)*.12)); sp = bpy.context.object; sp.scale = (.02, .05, .24); sp.rotation_euler = (a, 0, 0); sp.data.materials.append(BLACK)
        bpy.ops.object.select_all(action='DESELECT'); sp.select_set(True); r.select_set(True); bpy.context.view_layer.objects.active = r; bpy.ops.object.join()
    bpy.ops.object.select_all(action='DESELECT'); r.select_set(True); t.select_set(True); bpy.context.view_layer.objects.active = t; bpy.ops.object.join()
    bpy.context.scene.cursor.location = (x, y, .36); bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)   # so the wheel spins about its own axle (x)
# group everything under one root
root = bpy.data.objects.new('sportscar', None); col.objects.link(root)
for o in list(col.objects):
    if o is not root and o.parent is None: o.parent = root
for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('CAR_DONE', len(col.objects))
