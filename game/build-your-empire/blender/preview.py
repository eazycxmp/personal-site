import bpy, sys, math
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out, az = a[0], a[1], float(a[2]) if len(a) > 2 else 35
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
for o in obs:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
ctr = (mn + mx) / 2; size = max(mx - mn)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
r = size * 1.9; t = math.radians(az)
cam.location = ctr + Vector((math.sin(t) * r, -math.cos(t) * r, size * .35))
d = ctr - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.rotation_euler = (.8, .2, .6); bpy.context.scene.collection.objects.link(sun)
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 640; s.render.resolution_y = 640; s.render.filepath = out
s.world = bpy.data.worlds.new('w'); s.world.color = (.75, .82, .9)
bpy.ops.render.render(write_still=True); print('PREVIEW_DONE')
