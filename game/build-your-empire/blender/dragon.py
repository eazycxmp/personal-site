# The red dragon: a long scaled body with a spined back, a horned head with a hinged jaw, four clawed legs tucked in
# flight, a swaying tail and two great bat wings (arm and finger bones with a membrane between). Exports the parts the
# game animates, each with its origin at its pivot: dragon_body, dragon_jaw (hinge), dragon_tail (base),
# dragon_wingL / dragon_wingR (shoulder). Front faces -Y (glTF +Z).
import bpy, sys, math
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def M(name, rgb, rough=.6, metal=0., emit=None, double=False):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 3
    m.use_backface_culling = not double
    MATS[name] = m; return m
def srgb(h): return tuple(((h >> s) & 255)/255 for s in (16, 8, 0))
def lin(c): return tuple((v/12.92 if v <= .04045 else ((v + .055)/1.055)**2.4) for v in c)
def C(h): return lin(srgb(h))
SCALE = M('scales', C(0x9e1f17), .45, .05); BELLY = M('belly', C(0xd9a24a), .55); MEMB = M('membrane', C(0x6e1410), .65, double=True)
HORN = M('horn', C(0xeee4cc), .4); CLAW = M('claw', C(0x1e1a18), .3); EYE = M('eye', C(0xffd23a), .2, emit=C(0xffb020)); MOUTH = M('mouth', C(0x3a0a08), .8)

def skinned(name, verts, edges, radii, mat, sub=2):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, edges, []); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    mod = o.modifiers.new('skin', 'SKIN'); mod.use_smooth_shade = True
    for i, r in enumerate(radii): me.skin_vertices[0].data[i].radius = r
    me.skin_vertices[0].data[0].use_root = True
    s = o.modifiers.new('sub', 'SUBSURF'); s.levels = sub; s.render_levels = sub
    bpy.ops.object.modifier_apply(modifier='skin'); bpy.ops.object.modifier_apply(modifier='sub')
    o.select_set(False); me.materials.append(mat); return o
def chain(name, pts, rad, mat, sub=2): return skinned(name, pts, [(i, i + 1) for i in range(len(pts) - 1)], rad, mat, sub)
def prim(kind, name, mat, loc, scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    if kind == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc, segments=kw.get('seg', 20), ring_count=kw.get('rings', 10))
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=0, depth=1, location=loc, vertices=kw.get('v', 12))
    else: bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True); bpy.ops.object.shade_smooth()
    o.data.materials.append(mat); return o
def aim_cone(name, mat, base, tip, r):
    # a cone from base to tip
    b, t = Vector(base), Vector(tip); d = t - b
    o = prim('cone', name, mat, (0, 0, 0), (r, r, d.length))
    o.data.transform(Matrix.Translation((0, 0, d.length/2)))
    q = Vector((0, 0, 1)).rotation_difference(d.normalized()); o.data.transform(q.to_matrix().to_4x4()); o.data.transform(Matrix.Translation(b))
    return o
def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join(); o = bpy.context.object; o.name = name; return o
def set_origin(o, p): o.data.transform(Matrix.Translation(-Vector(p))); o.location = (0, 0, 0)

# ---- the body: chest, belly, neck and head along one spine
spine = [(0, 2.2, .3), (0, 1.2, .38), (0, .2, .44), (0, -.8, .5), (0, -1.6, .78), (0, -2.2, 1.18), (0, -2.75, 1.5), (0, -3.2, 1.66), (0, -3.65, 1.66), (0, -4.1, 1.6), (0, -4.45, 1.55)]
rad = [(.42, .4), (.62, .56), (.74, .66), (.66, .6), (.42, .4), (.32, .3), (.27, .26), (.3, .27), (.25, .2), (.19, .14), (.12, .09)]
parts = [chain('torso', spine, rad, SCALE)]
parts.append(prim('sph', 'belly', BELLY, (0, -.2, .26), (.6, 1.6, .4)))
parts.append(prim('sph', 'throat', BELLY, (0, -2.05, .95), (.2, .55, .22), (math.radians(-40), 0, 0)))
# eyes, brow ridges, nostrils and horns
for sx in (-1, 1):
    parts.append(prim('sph', 'eye', EYE, (sx*.2, -3.62, 1.8), (.07, .08, .06)))
    parts.append(prim('sph', 'brow', SCALE, (sx*.19, -3.55, 1.88), (.08, .13, .035), (math.radians(-12), 0, sx*math.radians(-15))))
    parts.append(prim('sph', 'nostril', CLAW, (sx*.07, -4.47, 1.62), (.025, .02, .02)))
    parts.append(aim_cone('horn', HORN, (sx*.15, -3.3, 1.86), (sx*.42, -2.6, 2.3), .07))
    parts.append(aim_cone('horn2', HORN, (sx*.22, -3.2, 1.72), (sx*.5, -2.85, 1.85), .045))
# the upper teeth
for i in range(5):
    for sx in (-1, 1): parts.append(aim_cone('tooth', HORN, (sx*(.09 + i*.02), -4.35 + i*.18, 1.47), (sx*(.09 + i*.02), -4.35 + i*.18, 1.36), .022))
# spines down the back, from head to the base of the tail
for i in range(12):
    y = -2.9 + i*.45
    zz = 1.75 - i*.12 if i < 4 else .95 - (i - 4)*.04
    h = .28 if 3 < i < 9 else .2
    parts.append(aim_cone('spine', HORN if i % 2 else CLAW, (0, y, zz), (0, y + .18, zz + h), .07))
# four legs, tucked up in flight: thigh, shin, foot with claws
def legset(sx, y0, front):
    hip = (sx*.48, y0, .35); knee = (sx*.62, y0 + (.15 if front else .35), -.15); ank = (sx*.55, y0 + (.45 if front else .7), -.4); toe = (sx*.55, y0 + (.6 if front else .95), -.55)
    out = [chain('leg', [hip, knee, ank, toe], [(.24, .24), (.15, .15), (.1, .1), (.08, .06)], SCALE)]
    for k in (-1, 0, 1): out.append(aim_cone('claw', CLAW, (toe[0] + k*.06, toe[1], toe[2]), (toe[0] + k*.09, toe[1] + .22, toe[2] - .1), .03))
    return out
for sx in (-1, 1): parts += legset(sx, -.7, True) + legset(sx, 1.2, False)
body = join(parts, 'dragon_body')

# ---- the jaw, hinged under the skull
jaw = [chain('jawbone', [(0, -3.25, 1.48), (0, -3.8, 1.42), (0, -4.3, 1.4)], [(.2, .1), (.15, .07), (.09, .05)], SCALE)]
jaw.append(prim('sph', 'tongue', MOUTH, (0, -3.85, 1.47), (.1, .35, .03)))
for i in range(4):
    for sx in (-1, 1): jaw.append(aim_cone('ltooth', HORN, (sx*(.07 + i*.02), -4.2 + i*.18, 1.46), (sx*(.07 + i*.02), -4.2 + i*.18, 1.56), .02))
J = join(jaw, 'dragon_jaw'); set_origin(J, (0, -3.25, 1.5))

# ---- the tail: tapering, with a spade at the tip
tp = [(0, 2.0, .3), (0, 3.0, .26), (0, 4.0, .22), (0, 5.0, .2), (0, 6.0, .2), (0, 6.9, .24)]
tail = [chain('tailbone', tp, [(.4, .38), (.3, .28), (.22, .2), (.15, .13), (.09, .08), (.05, .05)], SCALE)]
for i in range(6): tail.append(aim_cone('tspine', HORN if i % 2 else CLAW, (0, 2.4 + i*.75, .55 - i*.06), (0, 2.6 + i*.75, .72 - i*.07), .05))
bpy.ops.mesh.primitive_cone_add(radius1=.42, radius2=0, depth=.7, vertices=3, location=(0, 7.2, .25)); sp = bpy.context.object; sp.name = 'spade'
sp.rotation_euler = (math.radians(-90), 0, 0); sp.scale = (1, .12, 1); bpy.ops.object.transform_apply(rotation=True, scale=True); sp.data.materials.append(SCALE); tail.append(sp)
T = join(tail, 'dragon_tail'); set_origin(T, (0, 2.0, .3))

# ---- the wings: arm and finger bones with a scalloped membrane, pivot at the shoulder
def wing(sx):
    S = (sx*.5, -.7, .82); E = (sx*2.3, -.35, 1.35); Wr = (sx*3.8, .15, 1.55)
    tips = [(sx*6.9, .7, 1.2), (sx*6.2, 2.2, .85), (sx*4.9, 3.1, .7), (sx*3.2, 2.8, .65)]
    root = (sx*.5, 1.5, .55)
    bones = [chain('arm', [S, E, Wr], [(.13, .13), (.1, .1), (.08, .08)], SCALE)]
    for t in tips: bones.append(chain('finger', [Wr, t], [(.06, .06), (.02, .02)], SCALE, 1))
    bones.append(aim_cone('thumb', CLAW, Wr, (Wr[0] + sx*.1, Wr[1] - .35, Wr[2] + .15), .05))
    # the membrane: a fan from the wrist, sagging in scallops between the fingers, back to the body
    pts = [S, E, Wr]; ring = [tips[0]]
    for a, b in zip(tips, tips[1:] + [root]):
        mid = ((a[0] + b[0])/2, (a[1] + b[1])/2 - .35, (a[2] + b[2])/2 - .12); ring += [mid, b]
    verts = [Wr, S, E] + ring
    faces = []
    for i in range(3, len(verts) - 1): faces.append((0, i, i + 1))
    faces += [(0, len(verts) - 1, 1), (0, 1, 2)]
    me = bpy.data.meshes.new('memb'); me.from_pydata(verts, [], faces); me.update()
    mo = bpy.data.objects.new('memb', me); bpy.context.collection.objects.link(mo); me.materials.append(MEMB)
    # give it a little thickness so it shades from both sides
    bpy.context.view_layer.objects.active = mo; mo.select_set(True); s = mo.modifiers.new('sol', 'SOLIDIFY'); s.thickness = .03; bpy.ops.object.modifier_apply(modifier='sol'); mo.select_set(False)
    w = join(bones + [mo], 'dragon_wing' + ('L' if sx < 0 else 'R')); set_origin(w, S); return w
wing(-1); wing(1)
for o in bpy.data.objects:
    if o.type == 'MESH': print(o.name, len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
