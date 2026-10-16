import bpy, sys
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]; src, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src); bpy.context.view_layer.update()
# place each costume's parts at their pivots so the figure stands assembled
piv = {'body':(0,0,0), 'armL':(-.25,0,1.64), 'armR':(.25,0,1.64), 'legL':(-.12,0,1.0), 'legR':(.12,0,1.0)}
for o in bpy.context.scene.objects:
    for k, p in piv.items():
        if o.name.endswith('_' + k) and o.name.startswith('hero'):
            i = int(o.name[4]); o.parent = None; o.location = (i*1.0 + p[0], p[1], p[2])
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = Vector((2.5, -6.5, 1.6)); cam.rotation_euler = (Vector((2.5, 0, 1.05)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = cam
s = bpy.context.scene; s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'MATERIAL'
s.render.resolution_x = 1500; s.render.resolution_y = 700; s.render.filepath = out; s.world = bpy.data.worlds.new('w'); s.world.color = (.75, .82, .9)
bpy.ops.render.render(write_still=True); print('DONE')
