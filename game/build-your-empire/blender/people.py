# Realistic townsfolk, built the same way as the hero (true proportions, about 2.05 tall: hips 1.0, shoulders 1.64,
# head 1.89), as a kit of parts the game colours per person: every part is its own object named pp_<part>_<role>, where
# the role says which colour it takes (skin, top, top2, pants, shoe, hair, white, iris, lip, sole). Arms are exported
# with the origin at the shoulder (pp_arm...), legs at the hip (pp_leg...), so the game can swing them. Male and female
# torsos and hips, a dress, shirt details, ten hairstyles and three kinds of facial hair. Front faces -Y (glTF +Z).
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MATS = {}
def M(name, rgb=(.8, .8, .8), rough=.6):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; MATS[name] = m; return m
def lin(c): return tuple((v/12.92 if v <= .04045 else ((v + .055)/1.055)**2.4) for v in c)
def C(h): return lin(tuple(((h >> s) & 255)/255 for s in (16, 8, 0)))
# role materials (the game recolours by role; these colours are only for the preview)
ROLE = {'skin':C(0xe8b896), 'top':C(0x3f6fb5), 'top2':C(0xd9443a), 'pants':C(0x3a3a4a), 'shoe':C(0x2a1d12), 'hair':C(0x3a2416), 'white':C(0xf4f2ee), 'iris':C(0x3a2a1a), 'lip':C(0x9a5a4a), 'sole':C(0x1a120c)}
def R(role): return M(role, ROLE[role])
HIP, KNEE, ANKLE, SHOULDER_Y, SHW, HZ = 1.0, .53, .09, 1.64, .25, 1.89

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
def split_at(o, z, name_up, name_dn, mat_up, mat_dn, origin):
    import bmesh as _bm
    objs = []
    for keep_up, nm, mt in ((True, name_up, mat_up), (False, name_dn, mat_dn)):
        c = o.copy(); c.data = o.data.copy(); bpy.context.collection.objects.link(c)
        bm = _bm.new(); bm.from_mesh(c.data)
        kill = [f for f in bm.faces if ((f.calc_center_median().z >= z) != keep_up)]
        _bm.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(c.data); bm.free()
        c.data.materials.clear(); c.data.materials.append(mt)
        c.name = nm; c.data.transform(Matrix.Translation(-Vector(origin))); c.location = (0, 0, 0); objs.append(c)
    bpy.data.objects.remove(o, do_unlink=True)
    return objs
def prim(kind, name, mat, loc, scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    if kind == 'sph': bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=loc, segments=kw.get('seg', 20), ring_count=kw.get('rings', 10))
    elif kind == 'cyl': bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, location=loc, vertices=kw.get('v', 20))
    elif kind == 'cone': bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=kw.get('r2', 0), depth=1, location=loc, vertices=kw.get('v', 20))
    elif kind == 'torus': bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=kw.get('minor', .2), location=loc, major_segments=kw.get('v', 24), minor_segments=8)
    else: bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale; o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if kind != 'cube': bpy.ops.object.shade_smooth()
    o.data.materials.append(mat); return o
def join(objs, name, origin=(0, 0, 0)):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.object; o.name = name; o.data.transform(Matrix.Translation(-Vector(origin))); o.location = (0, 0, 0); return o

# ---- torsos: male (broader shoulders) and female (narrower shoulders, a waist, a bust), and hips
def torso(name, female):
    v = [(0, 0, HIP + .02), (0, 0, 1.18), (0, -.005, 1.42), (0, 0, 1.6), (0, 0, 1.7)]
    r = [(.155, .11), (.13, .095), (.16, .115), (.2, .115), (.1, .085)] if female else [(.16, .11), (.145, .1), (.18, .12), (.22, .12), (.105, .09)]
    parts = [skinned(name, v, [(i, i + 1) for i in range(4)], r, R('top'))]
    for sx in (-1, 1): parts.append(prim('sph', 'shoulder', R('top'), (sx*(SHW - .02 - (.02 if female else 0)), 0, SHOULDER_Y - .03), (.058 if female else .062, .058, .052)))
    if female:
        for sx in (-1, 1): parts.append(prim('sph', 'bust', R('top'), (sx*.065, -.085, 1.4), (.07, .06, .065)))
    return join(parts, name)
torso('pp_torsoM_top', False); torso('pp_torsoF_top', True)
join([prim('cyl', 'hips', R('pants'), (0, 0, HIP + .03), (.16, .11, .1), v=24)], 'pp_hipsM_pants')
join([prim('cyl', 'hips', R('pants'), (0, 0, HIP + .03), (.17, .115, .1), v=24)], 'pp_hipsF_pants')
join([prim('cyl', 'belt', R('sole'), (0, 0, HIP + .1), (.163, .113, .03), v=24)], 'pp_belt_sole')
join([prim('cone', 'dress', R('top'), (0, 0, .82), (.29, .2, .7), r2=.55, v=32)], 'pp_dress_top')
join([prim('sph', 'belly', R('top'), (0, -.035, 1.24), (.16, .125, .16))], 'pp_belly_top')
# shirt details (on the torso, in the second colour or white)
join([prim('cube', 'placket', R('top2'), (0, -.123, 1.36), (.03, .01, .4))], 'pp_placket_top2')
join([prim('cube', 'jacketL', R('top2'), (-.1, -.118, 1.34), (.09, .02, .5)), prim('cube', 'jacketR', R('top2'), (.1, -.118, 1.34), (.09, .02, .5)), prim('cube', 'jacketBack', R('top2'), (0, .1, 1.34), (.34, .03, .5))], 'pp_jacket_top2')
join([prim('cube', 'tie', R('lip'), (0, -.126, 1.4), (.03, .008, .26))], 'pp_tie_lip')
for k, z in enumerate((1.22, 1.34, 1.46)): pass
join([prim('cyl', 'band', R('top2'), (0, 0, z), (.168 + (z - 1.2)*.12, .118, .035), v=24) for z in (1.22, 1.34, 1.46)], 'pp_stripes_top2')
join([prim('sph', 'flower', R('top2'), (x, -.12, z), (.025, .006, .025)) for x, z in [(-.08, 1.25), (.07, 1.32), (-.03, 1.45), (.09, 1.5), (-.1, 1.52), (.02, 1.2)]], 'pp_hawaii_top2')
join([prim('sph', 'hood', R('top'), (0, .1, 1.66), (.13, .1, .09)), prim('cube', 'pocket', R('top2'), (0, -.12, 1.17), (.18, .015, .08))], 'pp_hoodie_top')
join([prim('cyl', 'neck', R('skin'), (0, 0, 1.73), (.06, .058, .1), v=16)], 'pp_neck_skin')
join([prim('cube', 'apron', R('top2'), (0, -.125, 1.18), (.3, .015, .56))], 'pp_apron_top2')

# ---- the head: skull, jaw, nose, ears; eyes, brows and lips as their own parts
join([prim('sph', 'skull', R('skin'), (0, .005, HZ), (.115, .13, .14), seg=32, rings=16), prim('sph', 'jaw', R('skin'), (0, -.035, HZ - .075), (.085, .085, .07), seg=24),
      prim('sph', 'nose', R('skin'), (0, -.128, HZ - .015), (.018, .025, .03))] + [prim('sph', 'ear', R('skin'), (sx*.115, .01, HZ - .005), (.018, .03, .04)) for sx in (-1, 1)], 'pp_head_skin')
join([prim('sph', 'eyeW', R('white'), (sx*.042, -.105, HZ + .02), (.022, .012, .015)) for sx in (-1, 1)], 'pp_eyes_white')
join([prim('sph', 'iris', R('iris'), (sx*.042, -.115, HZ + .02), (.011, .006, .011)) for sx in (-1, 1)], 'pp_iris_iris')
join([prim('cube', 'brow', R('hair'), (sx*.043, -.113, HZ + .05), (.04, .01, .01), rot=(0, sx*.12, 0)) for sx in (-1, 1)], 'pp_brows_hair')
join([prim('cube', 'mouth', R('lip'), (0, -.116, HZ - .07), (.035, .008, .008))], 'pp_mouth_lip')
# ---- hairstyles
H = R('hair')
join([prim('sph', 'h', H, (0, .02, HZ + .03), (.122, .135, .125), seg=24)], 'pp_hairShort_hair')
join([prim('sph', 'h', H, (0, .015, HZ + .035), (.118, .132, .118), seg=24)], 'pp_hairBuzz_hair')
join([prim('sph', 'h', H, (0, .02, HZ + .035), (.124, .137, .127), seg=24), prim('sph', 'part', H, (-.05, -.03, HZ + .12), (.08, .09, .035))], 'pp_hairSidepart_hair')
join([prim('sph', 'h', H, (0, .025, HZ + .06), (.17, .17, .16), seg=24)], 'pp_hairAfro_hair')
join([prim('sph', 'h', H, (0, .03, HZ + .01), (.125, .14, .15), seg=24), prim('cube', 'back', H, (0, .09, HZ - .14), (.21, .06, .24))], 'pp_hairLong_hair')
join([prim('sph', 'h', H, (0, .02, HZ + .03), (.122, .135, .125), seg=24), prim('sph', 'bun', H, (0, .1, HZ + .1), (.06, .06, .06))], 'pp_hairBun_hair')
join([prim('sph', 'h', H, (0, .02, HZ + .03), (.122, .135, .125), seg=24), prim('cone', 'tail', H, (0, .15, HZ - .07), (.045, .04, .22), rot=(.35, 0, 0))], 'pp_hairPonytail_hair')
join([prim('sph', 'h', H, (0, .03, HZ + .01), (.125, .14, .15), seg=24), prim('cube', 'fringe', H, (0, -.1, HZ + .07), (.19, .04, .05))], 'pp_hairBangs_hair')
join([prim('cube', 'h', H, (0, .02, HZ + .1), (.03, .22, .1))], 'pp_hairMohawk_hair')
join([prim('sph', 'beard', H, (0, -.06, HZ - .1), (.08, .065, .065))], 'pp_beard_hair')
join([prim('cube', 'stache', H, (0, -.122, HZ - .052), (.06, .012, .014))], 'pp_mustache_hair')
join([prim('sph', 'goatee', H, (0, -.105, HZ - .12), (.03, .025, .035))], 'pp_goatee_hair')

# ---- arms (origin at the shoulder): upper arm, forearm, hand
for side, sx in (('L', -1), ('R', 1)):
    x = sx*SHW; o = (x, 0, SHOULDER_Y)
    a = skinned('arm', [(x, 0, SHOULDER_Y - .02), (x + sx*.03, 0, SHOULDER_Y - .3), (x + sx*.035, -.03, SHOULDER_Y - .56)], [(0, 1), (1, 2)], [(.068, .068), (.053, .056), (.044, .046)], R('top'))
    split_at(a, SHOULDER_Y - .26, f'pp_arm{side}Up_top', f'pp_arm{side}Fore_skin', R('top'), R('skin'), o)
    join([prim('sph', 'hand', R('skin'), (x + sx*.036, -.035, SHOULDER_Y - .615), (.046, .036, .066)), prim('sph', 'thumb', R('skin'), (x + sx*.012, -.07, SHOULDER_Y - .595), (.018, .018, .035))], f'pp_arm{side}Hand_skin', o)
# ---- legs (origin at the hip): thigh, shin, shoe
for side, sx in (('L', -1), ('R', 1)):
    x = sx*.12; o = (x, 0, HIP)
    lg = skinned('leg', [(x, 0, HIP), (x, -.01, (HIP + KNEE)/2 + .05), (x, .01, KNEE), (x, .02, (KNEE + ANKLE)/2), (x, .01, ANKLE + .04)], [(0, 1), (1, 2), (2, 3), (3, 4)], [(.105, .11), (.095, .1), (.072, .077), (.065, .07), (.05, .055)], R('pants'))
    split_at(lg, KNEE + .1, f'pp_leg{side}Thigh_pants', f'pp_leg{side}Shin_pants', R('pants'), R('pants'), o)
    join([prim('sph', 'foot', R('shoe'), (x, -.07, .055), (.065, .135, .06)), prim('cyl', 'shaft', R('shoe'), (x, 0, .12), (.062, .062, .16), v=16)], f'pp_leg{side}Shoe_shoe', o)
    join([prim('cube', 'sole', R('sole'), (x, -.065, .012), (.085, .22, .02))], f'pp_leg{side}Sole_sole', o)
n = 0
for ob in bpy.data.objects:
    if ob.type == 'MESH' and ob.name.startswith('pp_'): n += 1; ob.data.name = ob.name
print('parts', n)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
