import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, name, out = a
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
for o in list(bpy.context.scene.objects):
    if o.type == 'MESH' and o.name != name: bpy.data.objects.remove(o)
o = bpy.data.objects[name]; mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for c in o.bound_box: w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
ctr = (mn + mx) / 2; size = max(mx - mn)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = ctr + Vector((size * .9, -size * .9, size * .7)); cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 500; s.render.resolution_y = 400; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.1, .12, .2)
bpy.ops.render.render(write_still=True)
