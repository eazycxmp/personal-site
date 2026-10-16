# Lifelike (rounded, soft) animals built from metaballs, each an empty with a body and four legs (origins at the hips)
# so the game can walk them; birds get two wings (origins at the shoulders) so they can flap.
# Fronts point to Blender -Y (the game's +Z). Exported in metres; the game scales them.
import bpy, math, sys
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.75, metal=0.0):
    k = (name, h)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    MATS[k] = m; return m

def blob(name, elems, mat, res=None, origin=None):
    """elems: (x, y, z, rad, sx, sy, sz) ellipsoids, fused into one smooth skin (voxel remesh, smooth, decimate)."""
    import bmesh
    bm = bmesh.new()
    for (x, y, z, r, sx, sy, sz) in elems:
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=16, v_segments=10, radius=1)
        for v in t.verts: v.co = Vector((v.co.x*sx*r + x, v.co.y*sy*r + y, v.co.z*sz*r + z))
        me0 = bpy.data.meshes.new('t'); t.to_mesh(me0); t.free(); bm.from_mesh(me0); bpy.data.meshes.remove(me0)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    small = min(min(r*sx, r*sy, r*sz) for (x, y, z, r, sx, sy, sz) in elems)
    rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = max(.008, min(.05, small*.35))
    sm = ob.modifiers.new('sm', 'SMOOTH'); sm.factor = .6; sm.iterations = 4
    dc = ob.modifiers.new('dc', 'DECIMATE'); dc.ratio = .16
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    me.materials.append(mat)
    for p in me.polygons: p.use_smooth = True
    if origin is not None:
        from mathutils import Matrix
        o = Vector(origin); me.transform(Matrix.Translation(-o)); ob.location = o
    return ob

def paint(ob, mat, fn):
    me = ob.data; me.materials.append(mat); k = len(me.materials) - 1; o = ob.location
    for p in me.polygons:
        c = p.center
        if fn(c.x + o.x, c.y + o.y, c.z + o.z): p.material_index = k
    return ob
def tail(x0, y0, z0, dy, dz, n, r, end=0):
    return [(x0, y0 + dy*k/n, z0 + dz*(k/n) - .25*abs(dz)*(k/n)**2, r*(1 - .3*k/n), 1, 1, 1) for k in range(n + 1)] + ([(x0, y0 + dy, z0 + dz*.75, end, 1, 1, 1.3)] if end else [])
def animal(name, parts):
    root = bpy.data.objects.new(name, None); col.objects.link(root)
    for p in parts: p.parent = root
    return root

def legs(prefix, mat, hips, foot, top, r, hoof=None):
    """four legs from hip height `top` down to the ground, each its own object with the origin at the hip."""
    out = []
    for i, (hx, hy) in enumerate(hips):
        L = top - foot
        els = [(hx, hy, top - L*.27, r*1.18, 1.05, 1.1, (L*.34)/(r*1.18)), (hx, hy, foot + L*.3, r*.82, 1, 1, (L*.36)/(r*.82))]
        lg = blob(f'{prefix}_leg{i}', els, mat, origin=(hx, hy, top)); out.append(lg)
        if hoof: paint(lg, hoof, lambda x, y, z, f=foot, L=top - foot: z < f + L*.13)
    return out

# ---- cow: white with black patches, pink muzzle and udder, little horns
W_, B_, PK = M('cowWhite', 0xf6f4ef), M('cowBlack', 0x1d1d1f), M('cowPink', 0xf0a8a0, .6)
cow = [paint(blob('cow_body', [(0, 0, .95, .42, 1, 2.0, 1), (0, -.55, 1.0, .4, 1, 1, 1.05), (0, .55, .95, .4, 1, 1, 1), (0, -.95, 1.08, .24, 1, 1.25, 1)], W_), B_,
             lambda x, y, z: math.sin(x*6 + 1.3)*math.sin(y*4.4 + 2.1)*math.sin(z*5.5 + .4) + .3*math.sin(y*9 + x*3) > .32 and y > -1.05),
       blob('cow_muzzle', [(0, -1.22, .98, .15, 1.15, .75, .8)], PK),
       blob('cow_udder', [(0, .35, .58, .14, 1, 1.1, .7)], PK),
       blob('cow_ears', [(.24, -.9, 1.22, .07, 1.4, .5, .6), (-.24, -.9, 1.22, .07, 1.4, .5, .6)], W_),
       blob('cow_horns', [(.12, -.88, 1.36, .045, 1, 1, 1.6), (-.12, -.88, 1.36, .045, 1, 1, 1.6)], M('horn', 0xe8dcc0, .5)),
       blob('cow_tail', [(0, .95 + .02*k, 1.1 - .055*k, .04, 1, 1, 1) for k in range(12)] + [(0, 1.18, .42, .07, 1, 1, 1.5)], B_),
       blob('cow_eyes', [(.14, -1.08, 1.16, .035, 1, 1, 1), (-.14, -1.08, 1.16, .035, 1, 1, 1)], M('eye', 0x101010, .2))]
cow += legs('cow', W_, [(.24, -.55), (-.24, -.55), (.24, .55), (-.24, .55)], 0, .72, .12, B_)
animal('cow', cow)

# ---- pig: round and pink, a snout, floppy ears, curly tail
P_, P2 = M('pig', 0xf4b4b4, .6), M('pigDark', 0xe08a8a, .6)
pig = [blob('pig_body', [(0, 0, .55, .36, 1, 1.6, .95), (0, -.55, .62, .27, 1, 1, 1)], P_),
       blob('pig_snout', [(0, -.85, .58, .11, 1, .6, .85)], P2),
       blob('pig_ears', [(.15, -.62, .86, .08, 1.2, .5, .9), (-.15, -.62, .86, .08, 1.2, .5, .9)], P2),
       blob('pig_tail', [(.06*math.sin(k*1.3), .62 + .03*k, .6 + .05*math.cos(k*1.3), .035, 1, 1, 1) for k in range(6)], P_),
       blob('pig_eyes', [(.11, -.74, .72, .028, 1, 1, 1), (-.11, -.74, .72, .028, 1, 1, 1)], M('eye', 0x101010, .2))]
pig += legs('pig', P_, [(.17, -.3), (-.17, -.3), (.17, .3), (-.17, .3)], 0, .32, .08, P2)
animal('pig', pig)

# ---- chicken: plump white body, red comb, orange beak and legs
CW, CR, CO = M('chickWhite', 0xfbf8f0), M('comb', 0xd8302a, .5), M('beak', 0xf2a21a, .5)
chick = [blob('chicken_body', [(0, 0, .32, .17, 1, 1.25, 1), (0, -.14, .48, .1, 1, 1, 1.1), (0, .18, .42, .08, .8, 1, 1.6)], CW),
         blob('chicken_comb', [(0, -.16, .6 + .0*k, .03, 1, 1, 1) for k in range(1)] + [(0, -.13, .61, .03, .5, 1.6, 1)], CR),
         blob('chicken_beak', [(0, -.25, .48, .03, 1, 1.4, .8)], CO),
         blob('chicken_wattle', [(0, -.21, .42, .025, 1, 1, 1.4)], CR)]
for i, x in enumerate((.05, -.05)):
    chick.append(blob(f'chicken_leg{i}', [(x, 0, .16 - .04*k, .02, 1, 1, 2) for k in range(4)] + [(x, -.03, .02, .03, 1.2, 1.8, .5)], CO, origin=(x, 0, .18)))
animal('chicken', chick)

# ---- goat: grey, white blaze, curved horns, a beard
GG, GW, GH = M('goat', 0x5a5c60, .85), M('goatWhite', 0xe8e6e0), M('goatHorn', 0xc8b080, .5)
goat = [blob('goat_body', [(0, 0, .82, .3, 1, 1.9, 1.05), (0, -.45, .9, .26, 1, 1, 1.05), (0, -.7, 1.12, .12, 1, 1.2, 1.6), (0, -.82, 1.3, .14, 1, 1.4, 1)], GG),
        blob('goat_blaze', [(0, -1.0, 1.3, .09, .9, 1.2, .9), (0, -.96, 1.42, .07, .8, 1, .7)], GW),
        blob('goat_horns', [(sx*.08, -.78 + .06*k, 1.45 + .06*k - .012*k*k, .035, 1, 1, 1.4) for sx in (1, -1) for k in range(6)], GH),
        blob('goat_beard', [(0, -1.02, 1.12 - .04*k, .03, 1, 1, 1.4) for k in range(3)], GW),
        blob('goat_ears', [(.16, -.82, 1.36, .05, 1.8, .6, .6), (-.16, -.82, 1.36, .05, 1.8, .6, .6)], GG),
        blob('goat_eyes', [(.09, -.95, 1.38, .025, 1, 1, 1), (-.09, -.95, 1.38, .025, 1, 1, 1)], M('eyeGold', 0xc8a020, .2))]
goat += legs('goat', GG, [(.17, -.42), (-.17, -.42), (.17, .42), (-.17, .42)], 0, .62, .07, M('hoof', 0x2a2a2a, .5))
animal('goat', goat)

# ---- lion: lean golden body, a big dark mane, tufted tail
LT, LM, LD = M('lion', 0xd9a35a, .8), M('mane', 0x6a3a1e, .9), M('lionDark', 0x3a2414, .8)
lion = [blob('lion_body', [(0, 0, .9, .32, 1, 2.2, .95), (0, -.55, .98, .3, 1, 1, 1.05), (0, -.9, 1.12, .2, 1, 1.1, 1), (0, -1.12, 1.05, .12, 1, 1, .85)], LT),
        blob('lion_mane', [(0, -.72, 1.12, .34, 1.05, .9, 1.15), (0, -.55, .95, .26, 1, 1, 1.1)], LM),
        blob('lion_nose', [(0, -1.22, 1.08, .04, 1, 1, .8)], LD),
        blob('lion_tail', tail(0, .7, 1.0, .85, -.35, 16, .045, .08), LT),
        blob('lion_eyes', [(.09, -1.08, 1.2, .028, 1, 1, 1), (-.09, -1.08, 1.2, .028, 1, 1, 1)], M('eyeGold', 0xc8a020, .2))]
lion += legs('lion', LT, [(.2, -.5), (-.2, -.5), (.2, .55), (-.2, .55)], 0, .68, .1)
animal('lion', lion)

# ---- tiger: orange with dark stripes and a white belly and face
TO, TS, TW = M('tiger', 0xe0802a, .75), M('stripe', 0x1e1410, .8), M('tigerWhite', 0xf2ece0)
tiger = [paint(blob('tiger_body', [(0, 0, .9, .33, 1, 2.2, .95), (0, -.6, .98, .3, 1, 1, 1.05), (0, -.95, 1.08, .21, 1.05, 1.1, 1)], TO), TS,
               lambda x, y, z: z > .78 and math.sin(y*19 + abs(x)*7 + math.sin(z*9)) > .55),
         blob('tiger_belly', [(0, -.1, .66, .22, 1, 2.0, .45), (0, -1.15, 1.0, .12, 1.2, .8, .8)], TW),
         paint(blob('tiger_tail', tail(0, .7, 1.0, .9, -.3, 16, .05), TO), TS, lambda x, y, z: math.sin(y*30) > .3),
         blob('tiger_eyes', [(.1, -1.1, 1.16, .03, 1, 1, 1), (-.1, -1.1, 1.16, .03, 1, 1, 1)], M('eyeGold', 0xc8a020, .2))]
tiger += [paint(l, TS, lambda x, y, z: math.sin(z*26) > .55) for l in legs('tiger', TO, [(.21, -.55), (-.21, -.55), (.21, .55), (-.21, .55)], 0, .68, .1)]
animal('tiger', tiger)

# ---- elephant: big grey body, flappy ears, a trunk and tusks
EG, ET = M('elephant', 0x8f949a, .9), M('tusk', 0xf4efe2, .4)
ele = [blob('elephant_body', [(0, 0, 1.55, .75, 1, 1.45, .95), (0, -1.0, 1.85, .5, 1, 1, 1)], EG),
       blob('elephant_ears', [(.5, -.85, 1.95, .38, .25, 1.0, 1.25), (-.5, -.85, 1.95, .38, .25, 1.0, 1.25)], EG),
       blob('elephant_trunk', [(0, -1.42 - .05*k, 1.7 - .22*k, .16 - .012*k, 1, 1, 1.2) for k in range(7)], EG),
       blob('elephant_tusks', [(s*.22, -1.45 - .06*k, 1.5 - .1*k + .02*k*k, .05, 1, 1, 1.2) for s in (1, -1) for k in range(5)], ET),
       blob('elephant_eyes', [(.3, -1.32, 2.0, .04, 1, 1, 1), (-.3, -1.32, 2.0, .04, 1, 1, 1)], M('eye', 0x101010, .2))]
ele += legs('elephant', EG, [(.42, -.6), (-.42, -.6), (.42, .65), (-.42, .65)], 0, 1.2, .24)
animal('elephant', ele)

# ---- giraffe: long neck, brown patches, little horns
GY, GB = M('giraffe', 0xe8c060, .8), M('patch', 0x9a5a2a, .8)
gir = [paint(blob('giraffe_body', [(0, 0, 1.75, .38, 1, 1.6, .9)] + [(0, -.45 - .1*k, 2.0 + .32*k, .18 - .008*k, 1, 1, 1.4) for k in range(8)] + [(0, -1.32, 4.6, .16, 1, 1.6, .9)], GY), GB,
             lambda x, y, z: z < 4.4 and math.sin(x*16 + 1)*math.sin(y*13 + 2)*math.sin(z*11) > .12),
       blob('giraffe_horns', [(s*.07, -1.25, 4.85 + .05*k, .03, 1, 1, 1.5) for s in (1, -1) for k in range(3)], GB)]
gir += legs('giraffe', GY, [(.22, -.45), (-.22, -.45), (.22, .45), (-.22, .45)], 0, 1.5, .08)
animal('giraffe', gir)

# ---- zebra: white with black stripes and a short mane
ZW, ZB = M('zebra', 0xf4f2ee), M('zebraBlack', 0x161616, .8)
zeb = [paint(blob('zebra_body', [(0, 0, 1.0, .34, 1, 1.9, .95), (0, -.55, 1.25, .16, 1, 1.2, 1.7), (0, -.82, 1.45, .14, 1, 1.6, .9)], ZW), ZB,
             lambda x, y, z: math.sin(y*24 + z*9 + abs(x)*4) > .15),
       blob('zebra_mane', [(0, -.5 - .07*k, 1.42 + .1*k, .05, .6, 1, 1.3) for k in range(5)], ZB),
       blob('zebra_muzzle', [(0, -1.05, 1.38, .09, 1, .8, .9)], ZB)]
zeb += [paint(l, ZB, lambda x, y, z: math.sin(z*28) > .35) if '_leg' in l.name else l for l in legs('zebra', ZW, [(.18, -.5), (-.18, -.5), (.18, .5), (-.18, .5)], 0, .8, .07, ZB)]
animal('zebra', zeb)

# ---- penguin: upright, black back, white belly, orange beak and feet
PB, PW, PO = M('penguin', 0x1a1c22, .6), M('penguinWhite', 0xf4f4f0, .6), M('penguinOrange', 0xf2a21a, .5)
pen = [blob('penguin_body', [(0, 0, .45, .26, 1, .9, 1.6), (0, -.02, .9, .16, 1, 1, 1)], PB),
       blob('penguin_belly', [(0, -.1, .45, .22, .95, .7, 1.5)], PW),
       blob('penguin_beak', [(0, -.2, .9, .035, 1, 1.6, .7)], PO),
       blob('penguin_wings', [(.24, 0, .55, .07, .5, 1, 2.6), (-.24, 0, .55, .07, .5, 1, 2.6)], PB)]
for i, x in enumerate((.09, -.09)): pen.append(blob(f'penguin_leg{i}', [(x, -.05, .04, .05, 1, 1.6, .5)], PO, origin=(x, -.05, .1)))
animal('penguin', pen)

# ---- bear: chunky brown, round ears, lighter muzzle
BR, BM = M('bear', 0x6a4426, .9), M('bearMuzzle', 0xb8885a, .9)
bear = [blob('bear_body', [(0, 0, .85, .45, 1, 1.5, .95), (0, -.3, 1.05, .38, 1, 1, 1), (0, -.8, 1.05, .26, 1, 1, 1)], BR),
        blob('bear_muzzle', [(0, -1.05, .98, .11, 1, 1, .8)], BM),
        blob('bear_ears', [(.17, -.75, 1.3, .07, 1, .6, 1), (-.17, -.75, 1.3, .07, 1, .6, 1)], BR),
        blob('bear_eyes', [(.1, -.98, 1.12, .03, 1, 1, 1), (-.1, -.98, 1.12, .03, 1, 1, 1)], M('eye', 0x101010, .2))]
bear += legs('bear', BR, [(.25, -.4), (-.25, -.4), (.25, .45), (-.25, .45)], 0, .55, .14)
animal('bear', bear)

# ---- panda: white, black legs, ears and eye patches
PA, PK2 = M('panda', 0xf4f2ee), M('pandaBlack', 0x161616, .8)
panda = [blob('panda_body', [(0, 0, .8, .44, 1, 1.4, .95), (0, -.75, 1.0, .3, 1, 1, 1)], PA),
         blob('panda_black', [(0, -.35, .95, .4, 1.06, .35, .9)], PK2),
         blob('panda_face', [(.13, -1.0, 1.05, .07, 1, .5, 1.3), (-.13, -1.0, 1.05, .07, 1, .5, 1.3), (.2, -.7, 1.27, .08, 1, .6, 1), (-.2, -.7, 1.27, .08, 1, .6, 1), (0, -1.06, .96, .04, 1, 1, .8)], PK2)]
panda += legs('panda', PK2, [(.23, -.4), (-.23, -.4), (.23, .4), (-.23, .4)], 0, .5, .13)
animal('panda', panda)

# ---- birds: a sparrow (brown and orange) and a gull (white and grey); the wings are separate so they flap
def bird(name, body, wing, belly, beak, s=1.0):
    parts = [blob(f'{name}_body', [(0, 0, 0, .14*s, 1, 1.6, .95), (0, -.2*s, .07*s, .09*s, 1, 1, 1), (0, .27*s, .02*s, .06*s, 1.4, 1.4, .4)], body),
             blob(f'{name}_belly', [(0, -.04*s, -.05*s, .11*s, .9, 1.3, .7)], belly),
             blob(f'{name}_beak', [(0, -.3*s, .06*s, .025*s, 1, 1.6, .8)], beak),
             blob(f'{name}_eyes', [(.05*s, -.24*s, .1*s, .015*s, 1, 1, 1), (-.05*s, -.24*s, .1*s, .015*s, 1, 1, 1)], M('eye', 0x101010, .2))]
    for i, sx in enumerate((1, -1)):
        parts.append(blob(f'{name}_wing{i}', [(sx*(.1 + .07*k)*s, (-.02 + .025*k)*s, .03*s, .07*s, 1.4, 1.5 - .18*k, .25) for k in range(5)], wing, origin=(sx*.08*s, 0, .03*s)))
    animal(name, parts)
bird('sparrow', M('sparrow', 0x8a5a30, .8), M('sparrowWing', 0x5a3a20, .8), M('sparrowBelly', 0xe8a060, .8), M('beakDark', 0x3a3028, .5))
bird('gull', M('gull', 0xf4f4f0, .6), M('gullWing', 0x9aa0a8, .6), M('gullBelly', 0xffffff, .6), M('beakY', 0xf2c200, .5), 1.3)

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('ANIMALS_DONE', len([o for o in col.objects if o.type == 'EMPTY']), 'animals')
