# Convert the Quaternius CC0 base characters into lean game files: one GLB per body (armature, body, eyes, eyebrows and
# every hairstyle re-parented onto the body's armature, textures cut to 1024 and stored as JPEG), and one GLB holding
# only the animations the game plays.
import bpy, sys, os
a = sys.argv[sys.argv.index('--') + 1:]
mode, out = a[0], a[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def clean_icos():
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name.startswith('Icosphere'): bpy.data.objects.remove(o, do_unlink=True)
if mode == 'body':
    body, hairdir, hairs = a[2], a[3], a[4].split(',')
    bpy.ops.import_scene.gltf(filepath=body); clean_icos()
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]; arm.name = 'QN_Armature'
    for h in hairs:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(hairdir, h + '.gltf')); clean_icos()
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            if o.type == 'MESH':
                o.name = 'QN_' + h
                mw = o.matrix_world.copy(); o.parent = arm; o.matrix_world = mw
                for m in o.modifiers:
                    if m.type == 'ARMATURE': m.object = arm
        for o in new:
            if o.type == 'ARMATURE': bpy.data.objects.remove(o, do_unlink=True)
    for o in bpy.data.objects:
        if o.type == 'MESH' and not o.name.startswith('QN_'): o.name = 'QN_' + o.name
    # clothes: shells grown off the body, smoothed so they read as cloth, bound to the same skeleton
    import bmesh, re
    body = [o for o in bpy.data.objects if o.type == 'MESH' and re.search('Super[hH]ero', o.name)][0]
    GARMENTS = {'Shirt':(r'^(spine|clavicle|upperarm)', .012, .12), 'ShirtLong':(r'^(spine|clavicle|upperarm|lowerarm)', .013, .1), 'Pants':(r'^(pelvis|thigh|calf|foot)', .016, .14),
      'Shorts':(r'^(pelvis|thigh)', .016, .16), 'Shoes':(r'^(foot|ball)', .016, .3)}
    for gname, (pat, push, thr) in GARMENTS.items():
        c = body.copy(); c.data = body.data.copy(); bpy.context.collection.objects.link(c); c.name = 'QN_Wear_' + gname
        groups = [vg.index for vg in c.vertex_groups if re.match(pat, vg.name)]
        bm = bmesh.new(); bm.from_mesh(c.data); dl = bm.verts.layers.deform.active
        drop = [v for v in bm.verts if sum(v[dl].get(gi, 0) for gi in groups) < thr]
        bmesh.ops.delete(bm, geom=drop, context='VERTS'); bm.to_mesh(c.data); bm.free()
        bpy.ops.object.select_all(action='DESELECT'); c.select_set(True); bpy.context.view_layer.objects.active = c
        # take the armature off while we reshape, then put it back
        for m in list(c.modifiers): c.modifiers.remove(m)
        # smooth the inside only: the open edge (and the ring next to it) stays put, so hems stay clean
        bm = bmesh.new(); bm.from_mesh(c.data); bm.verts.ensure_lookup_table()
        edge = {v.index for e in bm.edges if e.is_boundary for v in e.verts}
        ring = {w.index for i in edge for e in bm.verts[i].link_edges for w in e.verts}
        bm.free()
        inner = c.vertex_groups.new(name='qn_inner'); inner.add([v.index for v in c.data.vertices if v.index not in ring], 1.0, 'REPLACE')
        sm = c.modifiers.new('sm', 'SMOOTH'); sm.factor = .55; sm.iterations = 10; sm.vertex_group = 'qn_inner'; bpy.ops.object.modifier_apply(modifier='sm')
        vgi = c.vertex_groups.get('qn_inner')
        if vgi: c.vertex_groups.remove(vgi)
        dp = c.modifiers.new('dp', 'DISPLACE'); dp.strength = push; dp.mid_level = 0; dp.direction = 'NORMAL'; bpy.ops.object.modifier_apply(modifier='dp')
        am = c.modifiers.new('Armature', 'ARMATURE'); am.object = arm
        c.parent = arm
        mat = bpy.data.materials.new('Wear_' + gname); mat.use_nodes = True; mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
        c.data.materials.clear(); c.data.materials.append(mat)
        print('WEAR', gname, len(c.data.vertices))
    for img in bpy.data.images:
        if img.size[0] > 1024: img.scale(1024, 1024)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=82, export_animations=False, export_skins=True)
else:
    keep = set(a[2].split(','))
    bpy.ops.import_scene.gltf(filepath=a[3])
    for o in list(bpy.data.objects):
        if o.type != 'ARMATURE': bpy.data.objects.remove(o, do_unlink=True)
    for ac in list(bpy.data.actions):
        if ac.name not in keep: bpy.data.actions.remove(ac)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    # every kept action as its own animation (NLA tracks), none on the armature itself
    arm.animation_data_create(); arm.animation_data.action = None
    for ac in bpy.data.actions:
        t = arm.animation_data.nla_tracks.new(); t.name = ac.name; t.strips.new(ac.name, int(ac.frame_range[0]), ac)
    print('KEPT', [ac.name for ac in bpy.data.actions])
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True)
