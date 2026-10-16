# An original sport speedboat: a lofted V hull with a sheer line that rises to a sharp bow, a navy boot stripe, a
# teak-coloured deck, a curved wraparound windshield, two seats, a chrome rail and a big outboard motor on the transom.
import bpy, bmesh, sys, math
from mathutils import Vector
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, rough=.4, metal=0., alpha=1.):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    return m
WHITE, NAVY, TEAK, BLACK, CHROME, GLASS, SEAT, RED = mat('hull', (.93, .94, .95), .25), mat('stripe', (.04, .1, .3), .3), mat('deck', (.55, .36, .2), .6), mat('engine', (.05, .05, .06), .35), mat('chrome', (.85, .86, .88), .15, 1.), mat('glass', (.55, .7, .8), .05, 0., .45), mat('seat', (.92, .9, .84), .7), mat('accent', (.75, .08, .08), .4)

L = 5.0   # length (bow at +y)
def section(t):
    # half-beam, sheer height, keel depth, deadrise at station t (0 = transom, 1 = bow)
    hb = 1.0 * (1 - max(0, t - .55)/.45)**1.3 if t > .55 else 1.0 - .05*(.55 - t)
    sheer = .55 + .25*max(0, t - .5)**1.5
    keel = -.45 + .3*max(0, t - .7)/.3
    return max(.02, hb), sheer, keel

def hull():
    bm = bmesh.new(); N = 24; rings = []
    for i in range(N + 1):
        t = i / N; y = -L/2 + t*L; hb, sh, kl = section(t)
        # points from port sheer, down the chine, to the keel, up to starboard sheer
        pts = [(-hb, sh), (-hb*.98, .05), (-hb*.55, kl*.55 + .02), (0, kl), (hb*.55, kl*.55 + .02), (hb*.98, .05), (hb, sh)]
        rings.append([bm.verts.new((x, y, z)) for x, z in pts])
    for i in range(N):
        a, b = rings[i], rings[i + 1]
        for k in range(len(a) - 1): bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
    bm.faces.new(list(reversed(rings[0])))  # transom
    me = bpy.data.meshes.new('boat_hull'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('boat_hull', me); bpy.context.collection.objects.link(o); me.materials.append(WHITE)
    for p in me.polygons: p.use_smooth = True
    return o

def box(name, m, size, loc, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True, rotation=True); o.data.materials.append(m); return o
def cyl(name, m, r, d, loc, rot=(0, 0, 0), v=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc, rotation=rot, vertices=v); o = bpy.context.object; o.name = name
    bpy.ops.object.transform_apply(rotation=True); o.data.materials.append(m); return o

parts = [hull()]
# the navy boot stripe just under the sheer, as a thin skin following the hull at a few stations
for sx in (-1, 1): parts.append(box(f'boat_stripe{sx}', NAVY, (.02, L*.52, .1), (sx*(section(.2)[0] + .005), -L/2 + L*.27, section(.2)[1] - .16)))
# deck: a flat teak sole aft and a white foredeck that rises to the bow
parts.append(box('boat_deck', TEAK, (1.7, 2.3, .06), (0, -1.1, .48)))
bm = bmesh.new()
for t0, t1 in [(.48, 1.0)]:
    vs = []
    for i in range(9):
        t = t0 + (t1 - t0)*i/8; y = -L/2 + t*L; hb, sh, kl = section(t)
        vs.append((bm.verts.new((-hb + .02, y, sh + .01)), bm.verts.new((0, y, sh + .12*(1 - i/8) + .04)), bm.verts.new((hb - .02, y, sh + .01))))
    for i in range(8):
        a, b = vs[i], vs[i + 1]; bm.faces.new((b[0], b[1], a[1], a[0])); bm.faces.new((b[1], b[2], a[2], a[1]))
me = bpy.data.meshes.new('boat_fore'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('boat_fore', me); bpy.context.collection.objects.link(o); me.materials.append(WHITE); parts.append(o)
# a curved wraparound windshield on a chrome frame
bm = bmesh.new(); ring = []
for k in range(13):
    a = -1.2 + 2.4*k/12; x = math.sin(a)*.8; y = .1 + math.cos(a)*.3
    ring.append((bm.verts.new((x, y, .6)), bm.verts.new((x*.94, y - .14, .9))))
for k in range(12): bm.faces.new((ring[k][0], ring[k + 1][0], ring[k + 1][1], ring[k][1]))
me = bpy.data.meshes.new('boat_glass'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('boat_glass', me); bpy.context.collection.objects.link(o); me.materials.append(GLASS); parts.append(o)
parts.append(box('boat_dash', BLACK, (1.5, .35, .25), (0, .15, .62)))
parts.append(cyl('boat_wheel', CHROME, .16, .04, (-.4, -.05, .85), (1.1, 0, 0), 20))
# two seats and a rear bench
for sx in (-.42, .42):
    parts.append(box(f'boat_seat{sx}', SEAT, (.55, .5, .25), (sx, -.55, .62))); parts.append(box(f'boat_back{sx}', SEAT, (.55, .12, .55), (sx, -.85, .85), (-.15, 0, 0)))
parts.append(box('boat_bench', SEAT, (1.6, .5, .28), (0, -1.9, .64)))
# the outboard: cowling, leg, and a red accent stripe
parts.append(box('boat_motor', BLACK, (.5, .45, .6), (0, -L/2 - .2, .75)))
parts.append(box('boat_motorStripe', RED, (.52, .47, .06), (0, -L/2 - .2, .9)))
parts.append(box('boat_leg', BLACK, (.14, .2, .9), (0, -L/2 - .25, .05)))
parts.append(cyl('boat_prop', CHROME, .16, .06, (0, -L/2 - .25, -.4), (math.pi/2, 0, 0), 6))
root = bpy.data.objects.new('speedboat', None); bpy.context.collection.objects.link(root)
for p in parts: p.parent = root
for p in parts: print(p.name, len(p.data.polygons))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
