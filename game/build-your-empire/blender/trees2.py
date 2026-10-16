# Lifelike trees for the forest: a tall pine, a dense spruce and a broadleaf. Lumpy, irregular foliage, tapered trunks,
# and shading baked into vertex colours (darker deep inside and low down, brighter on the sunlit outer tips).
import bpy, bmesh, sys, math, random
from mathutils import Vector, noise
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
random.seed(7)

def material(name, rgb, rough=.85):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    a = m.node_tree.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
    mix = m.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1
    mix.inputs['A'].default_value = (*rgb, 1); m.node_tree.links.new(a.outputs['Color'], mix.inputs['B']); m.node_tree.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    return m
LEAF_C, LEAF_B, BARK = material('leafConifer', (1, 1, 1)), material('leafBroad', (1, 1, 1)), material('bark', (1, 1, 1), .95)

def obj_from_bm(bm, name, mat, shade):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    col = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER'); me.color_attributes.active_color = col
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co; f = shade(v)
            col.data[li].color = (f[0], f[1], f[2], 1)
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); me.materials.append(mat); return o

def trunk(bm, h, r0, r1, seg=8, lean=(0, 0)):
    rings = 5; prev = None
    for i in range(rings + 1):
        t = i / rings; r = r0 + (r1 - r0)*t; y = h*t
        ring = [bm.verts.new((math.cos(a)*r*(1 + .08*noise.noise(Vector((math.cos(a)*3, t*4, 1)))) + lean[0]*t*t, math.sin(a)*r + lean[1]*t*t, y)) for a in [k/seg*math.tau for k in range(seg)]]
        if prev:
            for k in range(seg): bm.faces.new((prev[k], prev[(k + 1) % seg], ring[(k + 1) % seg], ring[k]))
        prev = ring

def bark_shade(v):   # grey-brown bark, darker at the foot
    f = .55 + .45*min(1, v.z/3); return (.42*f, .33*f, .25*f)

def tier(bm, y, r, h, segs, droop, jit, seed):
    # one layer of branches: a ring of drooping, ragged tips around a cone
    tip = bm.verts.new((0, 0, y + h))
    mid, rim = [], []
    for k in range(segs):
        a = k/segs*math.tau + seed; rr = r*(1 + random.uniform(-jit, jit))
        # alternate long branch tips and short gaps for a ragged outline
        if k % 2: rr *= .72
        mid.append(bm.verts.new((math.cos(a + .1)*rr*.55, math.sin(a + .1)*rr*.55, y + h*.48 + random.uniform(-.06, .06)*h)))
        rim.append(bm.verts.new((math.cos(a)*rr, math.sin(a)*rr, y - droop*rr*(1.2 if k % 2 == 0 else .7))))
    for k in range(segs):
        n = (k + 1) % segs
        bm.faces.new((tip, mid[k], mid[n])); bm.faces.new((mid[k], rim[k], rim[n], mid[n]))
    # the underside, so the tier reads as solid from low angles
    under = bm.verts.new((0, 0, y + h*.12))
    for k in range(segs): bm.faces.new((under, rim[(k + 1) % segs], rim[k]))

def conifer(name, height, base_r, tiers, segs, top_r, droop, tint):
    bm = bmesh.new(); trunk(bm, height*.92, base_r*.11, base_r*.03); tr = obj_from_bm(bm, name + '_bark', BARK, bark_shade)
    bm = bmesh.new(); y0 = height*.16
    for i in range(tiers):
        t = i/(tiers - 1); r = base_r*(1 - t)**.9 + top_r; y = y0 + (height*.9 - y0)*t**.92; h = (height - y0)/tiers*2.1
        tier(bm, y, r, h, segs, droop, .16, random.random()*6)
    def shade(v):
        rad = math.hypot(v.x, v.y); maxr = base_r*max(0., min(1., 1 - (v.z - y0)/(height - y0)))**.9 + top_r + .01
        outer = min(1, rad/maxr); hf = max(0, min(1, v.z/height)); n = noise.noise(v*1.7)*.08
        f = .38 + .42*outer + .22*hf + n
        return (f*tint[0], f*tint[1], f*tint[2])
    lv = obj_from_bm(bm, name + '_leaf', LEAF_C, shade)
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root); tr.parent = root; lv.parent = root

def broadleaf(name, height, spread, blobs, tint, sub=2):
    bm = bmesh.new(); trunk(bm, height*.62, .26, .11, lean=(.25, .1))
    # main limbs reaching into the crown
    for k in range(3):
        a = k/3*math.tau + .4; b2 = bmesh.new()
    tr_bm = bm
    for k in range(3):
        a = k/3*math.tau + .4; seg = 6; base = Vector((.05, .02, height*.45)); tipv = Vector((math.cos(a)*spread*.55, math.sin(a)*spread*.55, height*.78))
        prev = None
        for i in range(3):
            t = i/2; c = base.lerp(tipv, t); r = .12*(1 - t) + .04
            d = (tipv - base).normalized(); u = d.cross(Vector((0, 0, 1))).normalized(); w = d.cross(u)
            ring = [tr_bm.verts.new(c + (u*math.cos(q) + w*math.sin(q))*r) for q in [j/seg*math.tau for j in range(seg)]]
            if prev:
                for j in range(seg): tr_bm.faces.new((prev[j], prev[(j + 1) % seg], ring[(j + 1) % seg], ring[j]))
            prev = ring
    tr = obj_from_bm(tr_bm, name + '_bark', BARK, bark_shade)
    bm = bmesh.new(); cy = height*.72
    for i in range(blobs):
        # clumps on the surface of an ellipsoid crown, bigger toward the middle
        th = random.uniform(0, math.tau); ph = math.acos(random.uniform(-.55, 1)); rr = random.uniform(.55, 1.0)
        c = Vector((math.sin(ph)*math.cos(th)*spread*rr, math.sin(ph)*math.sin(th)*spread*rr, cy + math.cos(ph)*height*.26*rr))
        s = random.uniform(.38, .66)*spread*.5
        g = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=s)
        for v in g['verts']:
            p = v.co.copy(); p.z *= .8
            p = p + p.normalized()*(noise.noise(p*2.3 + c)*.42 + noise.noise(p*7.1 + c)*.18)*s
            v.co = p + c
    def shade(v):
        d = Vector((v.x/spread, v.y/spread, (v.z - cy)/(height*.3))); outer = min(1, d.length/1.15); hf = max(0, min(1, (v.z - cy + height*.3)/(height*.6)))
        f = .22 + .42*outer + .2*hf + noise.noise(v*2.1)*.1
        return (f*tint[0], f*tint[1], f*tint[2])
    lv = obj_from_bm(bm, name + '_leaf', LEAF_B, shade)
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root); tr.parent = root; lv.parent = root

conifer('pineR', 10, 2.5, 9, 14, .25, .32, (1, 1, .96))
conifer('spruceR', 9, 2.0, 13, 16, .15, .42, (.92, .98, 1))
random.seed(21); broadleaf('oakR', 7.5, 2.6, 34, (1.04, 1, .88))
random.seed(21); broadleaf('oakL', 7.5, 2.6, 34, (1.04, 1, .88), sub=1)   # the same tree, lighter, for phones
for o in bpy.data.objects: print(o.name, len(o.data.polygons) if o.type == 'MESH' else '')
try:
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True, export_vertex_color='ACTIVE')
except TypeError:
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
