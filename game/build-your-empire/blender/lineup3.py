import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out, x0, x1 = a[0], a[1], float(a[2]), float(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src); bpy.context.view_layer.update()
cx = (x0 + x1)/2; span = x1 - x0
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = Vector((cx + span*.15, -span*.55 - 8, span*.35 + 6)); cam.rotation_euler = (Vector((cx, 0, 3)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 1400; s.render.resolution_y = 600; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.75, .82, .9)
bpy.ops.render.render(write_still=True); print('DONE')
