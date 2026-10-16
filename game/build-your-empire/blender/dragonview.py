import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src); bpy.context.view_layer.update()
piv = {'dragon_jaw':(0,-3.25,1.5), 'dragon_tail':(0,2.0,.3), 'dragon_wingL':(-.5,-.7,.82), 'dragon_wingR':(.5,-.7,.82)}
for o in bpy.context.scene.objects:
    print(o.name)
    if o.name in piv: o.parent = None; o.location = piv[o.name]
    if o.name == 'dragon_wingL': o.rotation_euler = (0, math.radians(-15), 0)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = Vector((9, -9, 6)); cam.rotation_euler = (Vector((0, 0.5, .8)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 1200; s.render.resolution_y = 800; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.75, .82, .9)
bpy.ops.render.render(write_still=True)
