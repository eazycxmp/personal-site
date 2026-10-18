# The ridden horse: Quaternius's animated horse (Ultimate Animated Animal Pack, CC0), kept with only the clips the game
# plays (walk, gallop, idles, grazing) and exported as one GLB.
# usage: blender -b -P horse.py -- Horse.gltf horse.glb
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
src, out = a[0], a[1]
KEEP = {'Walk', 'Gallop', 'Idle', 'Idle_2', 'Idle_Headlow', 'Eating'}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for ac in list(bpy.data.actions):
    if ac.name.split('_Armature')[0].split('.')[0] not in KEEP and ac.name not in KEEP: bpy.data.actions.remove(ac)
# the importer parks every clip on an NLA track; drop the tracks whose clip is gone
for o in bpy.data.objects:
    ad = o.animation_data
    if not ad: continue
    for t in list(ad.nla_tracks):
        if not t.strips or any(s.action is None for s in t.strips): ad.nla_tracks.remove(t)
print('ACTIONS', sorted(ac.name for ac in bpy.data.actions))
ms = [o for o in bpy.data.objects if o.type == 'MESH']
bpy.context.view_layer.update()
ws = [o.matrix_world @ v.co for o in ms for v in o.data.vertices]
print('SIZE x', round(max(v.x for v in ws) - min(v.x for v in ws), 3), 'y', round(max(v.y for v in ws) - min(v.y for v in ws), 3), 'z', round(max(v.z for v in ws) - min(v.z for v in ws), 3))
print('TRIS', sum(len(o.data.polygons) for o in ms))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS', export_skins=True)
