import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src); bpy.context.view_layer.update()
mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for o in bpy.context.scene.objects:
    if o.type != 'MESH': continue
    for c in o.bound_box: w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
ctr = (mn + mx)/2; size = max(mx - mn)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = ctr + Vector((size*.7, -size*.8, size*.5)); cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 900; s.render.resolution_y = 600; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.75, .82, .9)
bpy.ops.render.render(write_still=True); print('ONE_DONE')
