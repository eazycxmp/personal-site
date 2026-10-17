# Convert one Quaternius CC0 Fantasy outfit (Peasant or Ranger, male or female) into a lean game file: the outfit's
# skinned meshes on their armature (the same 65-bone rig as the bodies, so the game binds them to each person's own
# skeleton), skin parts given a material named QO_Skin so the game can tint them to the person, textures cut to 512 JPEG.
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
src, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o, do_unlink=True)
tot = 0
for o in list(bpy.data.objects):
    if o.type != 'MESH': continue
    o.name = 'QO_' + o.name
    # boots, bracers and other heavy trim are cut to a third: a crowd wears them, and from the game camera they read the same
    if len(o.data.vertices) > 3500 and not o.name.endswith(('_Body', '_Arms')):
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = .3
        # the armature must come after the decimation
        bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
    tot += len(o.data.vertices)
    print('PART', o.name, len(o.data.vertices), [m.name for m in o.data.materials])
# one mesh per outfit (two materials: cloth and bare skin), so each person draws it in two calls, not nine
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]; bpy.ops.object.join(); meshes[0].name = 'QO_Outfit'
# materials that are copies of each other (MI_Ranger and MI_Ranger.001) become one
ob = meshes[0]; first = {}; remap = []
for i, slot in enumerate(ob.material_slots):
    base = slot.material.name.split('.')[0]
    first.setdefault(base, i); remap.append(first[base])
for p in ob.data.polygons: p.material_index = remap[p.material_index]
bpy.context.view_layer.objects.active = ob; bpy.ops.object.material_slot_remove_unused()
# the outfit's own hands go (their skin is painted into the cloth texture, one tone for everyone): the person's real
# hands, in their own skin, show instead
import bmesh, re
hg = {vg.index for vg in ob.vertex_groups if re.match(r'^(hand|thumb|index|middle|ring|pinky)', vg.name)}
bm = bmesh.new(); bm.from_mesh(ob.data); dl = bm.verts.layers.deform.active
drop = [v for v in bm.verts if sum(w for gi, w in v[dl].items() if gi in hg) > .5]
bmesh.ops.delete(bm, geom=drop, context='VERTS'); bm.to_mesh(ob.data); bm.free()
print('HANDS_REMOVED', len(drop))
for m in bpy.data.materials:
    if m.name.startswith('MI_Regular'): m.name = 'QO_Skin'
    elif m.name.startswith('MI_'): m.name = 'QO_Cloth'
for img in bpy.data.images:
    if img.size[0] > 512: img.scale(512, 512)
print('VERTS', tot)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=80, export_animations=False, export_skins=True)
