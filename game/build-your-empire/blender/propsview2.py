import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src); bpy.context.view_layer.update()
pos = {'item_roast':(-1.8, 0, .1), 'item_patty':(-1.1, 0, .1), 'item_lettuce':(-.4, 0, .05), 'prop_block':(.6, -.2, 0), 'prop_grill':(2.6, 1, 0), 'prop_lettuce':(-1, 1.6, 0), 'item_meat':(9,9,9), 'item_bread':(9,9,9), 'item_log':(9,9,9), 'item_drumstick':(9,9,9), 'prop_oven':(9,9,9), 'prop_stand':(9,9,9)}
for o in bpy.context.scene.objects:
    if o.name in pos: o.parent = None; o.location = pos[o.name]
# a stack of steaks on the stand, like the game will show
src_m = bpy.data.objects['item_roast']
for k in range(5):
    c = src_m.copy(); c.data = src_m.data; bpy.context.scene.collection.objects.link(c); c.location = (-1.9, 1.4, .1 + k*.37)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = Vector((.5, -6.5, 5)); cam.rotation_euler = (Vector((.4, .6, .6)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'; s.display.shading.show_specular_highlight = True
s.render.resolution_x = 1400; s.render.resolution_y = 800; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.55, .58, .64)
bpy.ops.render.render(write_still=True)
