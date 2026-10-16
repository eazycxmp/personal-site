# Builds the three stages of the round venue and exports each as a .glb for the game.
# Blender is Z-up; the glTF exporter converts to Y-up. Blender X = game x, Blender -Y = game z.
import bpy, bmesh, math, sys

OUT = sys.argv[sys.argv.index('--') + 1]
RX, RY = 3.95, 5.15          # the inner edge of the bowl (half-width across x, half-length along the pitch)
SEG = 72

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if 'mats' in globals(): mats()

def material(name, rgb, rough=.7, metal=0.0, alpha=1.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    return m

def srgb(h):
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

def ellipse(off, t):
    return ((RX + off) * math.cos(t), (RY + off) * math.sin(t))

def sweep(name, profile, mats, a0=0.0, a1=2 * math.pi, closed=True):
    """Sweep a list of (offset, height, material index) points around the oval. Faces between
    profile points i and i+1 take the material of point i."""
    me = bpy.data.meshes.new(name); ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    for m in mats: me.materials.append(m)
    bm = bmesh.new()
    n = SEG if closed else SEG + 1
    rings = []
    for k in range(n):
        t = a0 + (a1 - a0) * k / SEG
        ring = []
        for off, h, _ in profile:
            x, y = ellipse(off, t); ring.append(bm.verts.new((x, y, h)))
        rings.append(ring)
    for k in range(SEG):
        A, B = rings[k], rings[(k + 1) % n]
        for i in range(len(profile) - 1):
            f = bm.faces.new((A[i], B[i], B[i + 1], A[i + 1]))
            f.material_index = profile[i][2]
    bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    return ob

def export(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True)

def mats():
    global SEAT, SEAT2, CONC, WHITE, LED, STEEL, GRASS, STONE, GLASS
    SEAT = material('seats', srgb(0x23345e), .8)
    SEAT2 = material('seats2', srgb(0x2c4378), .8)
    CONC = material('concrete', srgb(0xc9c6bf), .9)
    WHITE = material('skin', srgb(0xeef0f2), .45, .1)
    LED = material('led', srgb(0x2a6cff), .4, 0, 1, srgb(0x3a8cff), 4.0)
    STEEL = material('steel', srgb(0x9aa0a8), .35, .8)
    GRASS = material('lawn', srgb(0x5aa83c), .95)
    STONE = material('stone', srgb(0xd8ccb2), .9)
    GLASS = material('canopy', srgb(0xe8f4ff), .1, .0, .35)

def bowl_profile(tiers, rise, depth, start_h=.35):
    pts = [(0, 0, 1), (0, start_h, 1)]
    off, h = 0, start_h
    for k in range(tiers):
        mat = 0 if k % 2 == 0 else 2
        off += depth; pts.append((off, h, mat))
        h += rise; pts.append((off, h, mat))
    return pts, off, h

# ---- stage 1: an open-air amphitheater, a horseshoe of stone and grass steps facing a stage at the north end
clear()
prof, off, h = bowl_profile(4, .3, .45, .2)
prof = [(o, hh, 1 if m == 1 else 0) for o, hh, m in prof]
prof += [(off + .3, h, 0), (off + .3, 0, 0)]
ob = sweep('amph', prof, [STONE, GRASS], a0=-math.pi * .02 + math.pi * .62, a1=math.pi * 2.38, closed=False)
export(OUT + '/venue_amph.glb')

# ---- stage 2: a full stadium bowl, lower and upper tiers split by an LED ribbon, a white diamond skin outside
clear()
pts, off, h = bowl_profile(4, .3, .25)
pts[-1] = (pts[-1][0], pts[-1][1], 3)                          # the LED ribbon
pts.append((off + .12, h + .18, 1))
pts2 = [(o + off + .12, hh + h + .18, 0 if m == 0 else 2) for o, hh, m in bowl_profile(4, .34, .24, .0)[0][2:]]
o2, h2 = pts2[-1][0], pts2[-1][1]
prof = pts + pts2 + [(o2 + .15, h2 + .1, 4), (o2 + .35, h2 + .1, 4), (o2 + .55, 0, 4)]
sweep('bowl', prof, [SEAT, CONC, SEAT2, LED, WHITE])
# floodlight masts on the rim
for i in range(6):
    t = math.pi / 6 + i * math.pi / 3
    x, y = ellipse(o2 + .3, t)
    bpy.ops.mesh.primitive_cylinder_add(radius=.08, depth=2.2, location=(x, y, h2 + 1.1))
    bpy.context.object.data.materials.append(STEEL)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x * .97, y * .97, h2 + 2.2))
    o = bpy.context.object; o.scale = (.7, .2, .4); o.rotation_euler.z = t; o.data.materials.append(STEEL)
export(OUT + '/venue_bowl.glb')

# ---- stage 3: a floating glass canopy on slim columns, like the big new stadiums
clear()
TOP = 4.7
me = bpy.data.meshes.new('canopy'); ob = bpy.data.objects.new('canopy', me); bpy.context.collection.objects.link(ob)
me.materials.append(GLASS); me.materials.append(STEEL)
bm = bmesh.new(); inner, outer = [], []
for k in range(SEG):
    t = 2 * math.pi * k / SEG
    x, y = ellipse(-1.3, t); inner.append(bm.verts.new((x, y, TOP + .25)))
    x, y = ellipse(2.55, t); outer.append(bm.verts.new((x, y, TOP - .35 + .25 * math.sin(t))))
for k in range(SEG):
    f = bm.faces.new((inner[k], inner[(k + 1) % SEG], outer[(k + 1) % SEG], outer[k])); f.material_index = 0
bm.to_mesh(me); bm.free()
# steel ribs across the glass, rings at both edges and the columns that carry it
for k in range(0, SEG, 4):
    t = 2 * math.pi * k / SEG
    xi, yi = ellipse(-1.3, t); xo, yo = ellipse(2.55, t)
    zi, zo = TOP + .27, TOP - .33 + .25 * math.sin(t)
    L = math.dist((xi, yi, zi), (xo, yo, zo))
    bpy.ops.mesh.primitive_cube_add(size=1, location=((xi + xo) / 2, (yi + yo) / 2, (zi + zo) / 2))
    o = bpy.context.object; o.scale = (L, .06, .06)
    o.rotation_euler = (0, math.atan2(zi - zo, math.hypot(xo - xi, yo - yi)), math.atan2(yo - yi, xo - xi))
    o.data.materials.append(STEEL)
for k in range(0, SEG, 9):
    t = 2 * math.pi * k / SEG; x, y = ellipse(2.4, t)
    zt = TOP - .35 + .25 * math.sin(t)
    bpy.ops.mesh.primitive_cylinder_add(radius=.14, depth=zt, location=(x, y, zt / 2))
    bpy.context.object.data.materials.append(WHITE)
export(OUT + '/venue_roof.glb')
print('VENUE_DONE')
