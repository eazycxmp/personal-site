# Lighten the Quaternius bodies for crowds: the body and the clothing shells are cut to about a third of their
# triangles (collapse decimation keeps the skin weights and UVs); eyes, brows and hair stay as they are.
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
src, out, ratio = a[0], a[1], float(a[2]) if len(a) > 2 else .35
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.data.objects):
    if o.type != 'MESH' or len(o.data.polygons) < 1500: continue
    if not any(k in o.name for k in ('SuperHero', 'Superhero', 'Wear_')): continue
    before = len(o.data.polygons)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = ratio
    bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
    print('DEC', o.name, before, '->', len(o.data.polygons))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='AUTO', export_animations=False, export_skins=True)
