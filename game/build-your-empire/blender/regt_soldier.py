# One standing soldier for the regiment field, built from the same realistic body as the yard soldiers: the body
# (only head and hands kept), the long-sleeved shirt, trousers, shoes and short hair, posed in the idle stance and
# frozen, then cut to a few hundred triangles. Two meshes: the uniform (white, tinted per age in the game) and the
# rest (skin, boots, hair in vertex colours).
import bpy, sys, re, bmesh
a = sys.argv[sys.argv.index('--') + 1:]
body_glb, anims_glb, out, target = a[0], a[1], a[2], int(a[3]) if len(a) > 3 else 600
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=body_glb)
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
before = set(bpy.data.actions)
bpy.ops.import_scene.gltf(filepath=anims_glb)
# exactly Idle_Loop: Crouch_Idle_Loop also matches and is one of the pack's empty T-pose clips
idle = next(ac for ac in bpy.data.actions if ac not in before and ac.name.split('.')[0] == 'Idle_Loop')
for o in [o for o in bpy.data.objects if o.type == 'ARMATURE' and o is not arm]: bpy.data.objects.remove(o, do_unlink=True)
for o in [o for o in bpy.data.objects if o.type == 'MESH' and o.parent is None]: bpy.data.objects.remove(o, do_unlink=True)
arm.animation_data_create(); arm.animation_data.action = idle
# Blender 4.4+ actions hold slots: without binding one the armature stays in its rest (T) pose
if hasattr(arm.animation_data, 'action_suitable_slots'): arm.animation_data.action_slot = arm.animation_data.action_suitable_slots[0]
bpy.context.scene.frame_set(5); bpy.context.view_layer.update()
keep = {'body':re.compile('Super[hH]ero'), 'shirt':re.compile('Wear_ShirtLong'), 'pants':re.compile('Wear_Pants'), 'shoes':re.compile('Wear_Shoes'), 'hair':re.compile('Hair_Buzzed$|Hair_Buzzed\\.')}
parts = {}
for o in list(bpy.data.objects):
    if o.type != 'MESH': continue
    k = next((k for k, r in keep.items() if r.search(o.name)), None)
    if not k: bpy.data.objects.remove(o, do_unlink=True); continue
    parts[k] = o
# the body keeps only head, neck and hands (the uniform covers the rest)
b = parts['body']; bm = bmesh.new(); bm.from_mesh(b.data); dl = bm.verts.layers.deform.active
cover = {vg.index for vg in b.vertex_groups if re.match(r'^(spine|clavicle|upperarm|lowerarm|pelvis|thigh|calf|foot|ball)', vg.name)}
drop = [v for v in bm.verts if sum(w for gi, w in v[dl].items() if gi in cover) > .5]
bmesh.ops.delete(bm, geom=drop, context='VERTS'); bm.to_mesh(b.data); bm.free()
COL = {'body':(.78, .55, .4), 'shoes':(.08, .07, .06), 'hair':(.1, .07, .05), 'shirt':(1, 1, 1), 'pants':(1, 1, 1)}
for k, o in parts.items():
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        if m.type == 'ARMATURE': bpy.ops.object.modifier_apply(modifier=m.name)   # freeze the pose
    o.parent = None
    for old in list(o.data.color_attributes): o.data.color_attributes.remove(old)
    ca = o.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    o.data.color_attributes.active_color = ca; o.data.color_attributes.render_color_index = 0
    # COL is sRGB; the attribute (and the game's vertex colours) are linear
    for i in range(len(o.data.vertices)): ca.data[i].color = (*(c ** 2.2 for c in COL[k]), 1)
    o.data.materials.clear()
def join(names, nm):
    objs = [parts[n] for n in names if n in parts]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); objs[0].name = nm; return objs[0]
uni = join(['shirt', 'pants'], 'regt_uniform'); rest = join(['body', 'shoes', 'hair'], 'regt_rest')
tot = sum(len(o.data.polygons) for o in (uni, rest))
for o in (uni, rest):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = min(1, target / tot); bpy.ops.object.modifier_apply(modifier='dec')
    for vg in list(o.vertex_groups): o.vertex_groups.remove(vg)
ws = [o.matrix_world @ v.co for o in (uni, rest) for v in o.data.vertices]
print('SPAN_X', round(max(v.x for v in ws) - min(v.x for v in ws), 3), 'HEIGHT', round(max(v.z for v in ws) - min(v.z for v in ws), 3))
print('TRIS', len(uni.data.polygons), len(rest.data.polygons), 'from', tot)
bpy.data.objects.remove(arm, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_skins=False, export_vertex_color='ACTIVE')
