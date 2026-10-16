# Buildings, batch 2: a sci-fi research lab, hangars in three tiers, and military-base pieces (watchtowers and
# barracks in three tiers, an army tent, a supply depot, a motor pool). Each is one object, origin at ground centre,
# front (the open side) toward Blender -Y (the game's +Z). Sizes in metres; the game scales them to their plots.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.6, metal=0.0, emit=0.0):
    k = (name, h, emit)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*lin(h), 1); b.inputs['Emission Strength'].default_value = emit
    MATS[k] = m; return m

class Kit:
    def __init__(self, name): self.name, self.bm, self.mats = name, bmesh.new(), []
    def add(self, t, m, smooth=False):
        me = bpy.data.meshes.new('t'); t.to_mesh(me); t.free(); n0 = len(self.bm.faces); self.bm.from_mesh(me); bpy.data.meshes.remove(me)
        if m not in self.mats: self.mats.append(m)
        k = self.mats.index(m); self.bm.faces.ensure_lookup_table()
        for f in list(self.bm.faces)[n0:]: f.material_index = k; f.smooth = smooth
    def box(self, s, at, m, rz=0, rx=0):
        t = bmesh.new(); bmesh.ops.create_cube(t, size=1); bmesh.ops.scale(t, vec=Vector(s), verts=t.verts)
        if rx: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rx, 3, 'X'))
        if rz: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def cyl(self, r, h, at, m, axis='z', segs=16, r2=None, smooth=True):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        if axis == 'y': bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X'))
        if axis == 'x': bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'Y'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, smooth)
    def sph(self, s, at, m, half=False):
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=20, v_segments=12, radius=1)
        if half: bmesh.ops.delete(t, geom=[v for v in t.verts if v.co.z < -.01], context='VERTS')
        for v in t.verts: v.co = Vector((v.co.x*s[0] + at[0], v.co.y*s[1] + at[1], v.co.z*s[2] + at[2]))
        self.add(t, m, True)
    def arch(self, w, d, h, at, m, thick=.12, segs=18, open_front=True, ribs=None, rib_m=None):
        """a half-cylinder shell along y (length d), width w, height h, open at both ends."""
        t = bmesh.new(); rings = []
        for y in (-d/2, d/2):
            ring_o, ring_i = [], []
            for k in range(segs + 1):
                a = math.pi*k/segs; ring_o.append(t.verts.new((math.cos(a)*w/2, y, math.sin(a)*h))); ring_i.append(t.verts.new((math.cos(a)*(w/2 - thick), y, math.sin(a)*(h - thick))))
            rings.append((ring_o, ring_i))
        (o0, i0), (o1, i1) = rings
        for k in range(segs):
            t.faces.new((o0[k], o0[k + 1], o1[k + 1], o1[k])); t.faces.new((i0[k + 1], i0[k], i1[k], i1[k + 1]))
            t.faces.new((o0[k + 1], o0[k], i0[k], i0[k + 1])); t.faces.new((o1[k], o1[k + 1], i1[k + 1], i1[k]))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, True)
        if ribs:
            for j in range(ribs + 1):
                y = at[1] - d/2 + d*j/ribs
                r = bmesh.new()
                for k in range(segs):
                    a0, a1 = math.pi*k/segs, math.pi*(k + 1)/segs
                    for (a, b) in ((a0, a1),):
                        mid = ((math.cos(a) + math.cos(b))/2*(w/2 + .02), (math.sin(a) + math.sin(b))/2*(h + .02))
                        seg = math.hypot(math.cos(a) - math.cos(b), math.sin(a) - math.sin(b))*w/2
                        self.box((seg + .02, .08, .08), (at[0] + mid[0], y, at[2] + mid[1]), rib_m, rx=0)
                        # tilt each rib piece to follow the arch
                        f = list(self.bm.faces)[-6:]
                        ang = math.atan2(math.sin(b) - math.sin(a), math.cos(b) - math.cos(a))
                        cen = Vector((at[0] + mid[0], y, at[2] + mid[1]))
                        bmesh.ops.rotate(self.bm, verts=list({v for fa in f for v in fa.verts}), cent=cen, matrix=Matrix.Rotation(-ang, 3, 'Y'))
                r.free()
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        o = bpy.data.objects.new(self.name, me); col.objects.link(o); return o

# shared materials
CONC, CONC2, STEEL, DARK, WHITE = M('concrete', 0xb8b6b0, .9), M('concreteDark', 0x8a8884, .9), M('steel', 0x9aa2aa, .35, .7), M('dark', 0x22262c, .6), M('white', 0xeef0f2, .5)
CYAN, CYANG, GLASS = M('cyanLight', 0x5af0ff, .3, 0, 6), M('cyanTank', 0x3ad8f0, .1, 0, 2.2), M('glass', 0x2a4a6a, .08, .6)
OLIVE, OLIVE2, GREENROOF, SAND, WOOD, RED, YEL = M('olive', 0x4e5a36, .8), M('olive2', 0x3e4a2a, .8), M('roofGreen', 0x2f5a3a, .6), M('sandbag', 0xc8b088, .95), M('wood', 0x6b4a2a, .85), M('warnRed', 0xc0282a, .5, 0, 1.5), M('warnYellow', 0xf2c200, .6)

# ---- research lab: a white sci-fi block with cyan light strips, a domed roof, and glowing specimen tanks out front
k = Kit('lab')
k.box((4.4, 3.4, .25), (0, 0, .12), CONC2)
k.box((3.6, 2.4, 2.2), (0, .35, 1.35), WHITE)
for z in (.75, 1.5, 2.2): k.box((3.62, .04, .06), (0, -.86, z), CYAN)
k.box((2.4, .04, .9), (0, -.86, 1.3), GLASS)
k.sph((1.0, 1.0, .7), (0, .4, 2.45), GLASS, half=True)
for a in range(8): k.box((.06, .06, .9), (math.cos(a*math.pi/4)*.82, .4 + math.sin(a*math.pi/4)*.82, 2.75), STEEL)
k.cyl(1.05, .08, (0, .4, 2.47), CYAN, segs=24)
for i, x in enumerate((-1.25, 0, 1.25)):
    k.cyl(.36, .2, (x, -1.25, .35), STEEL); k.cyl(.3, 1.3, (x, -1.25, 1.1), CYANG); k.cyl(.36, .18, (x, -1.25, 1.84), STEEL)
    for a in range(4): k.box((.05, .05, 1.3), (x + math.cos(a*math.pi/2 + .78)*.33, -1.25 + math.sin(a*math.pi/2 + .78)*.33, 1.1), STEEL)
    k.cyl(.06, .9, (x, -.82, 1.95), STEEL, axis='y'); k.sph((.1, .1, .1), (x, -1.25, 2.0), CYAN)
k.box((.6, .05, .45), (1.55, -.88, 1.0), CYAN); k.box((.6, .05, .45), (-1.55, -.88, 1.0), CYAN)
k.cyl(.04, 1.4, (1.3, 1.1, 3.0), STEEL); k.sph((.35, .35, .12), (1.3, 1.1, 3.7), WHITE)
k.done()

# ---- hangars: 1 a red barn hangar, 2 a ribbed metal arch, 3 a glass-and-steel arch
k = Kit('hangar1')
k.box((6, 5, .15), (0, 0, .07), CONC)
for sx in (-1, 1): k.box((.2, 5, 2.6), (sx*2.9, 0, 1.3), M('barnRed', 0xa8502a, .8))
k.box((6, .2, 2.6), (0, 2.4, 1.3), M('barnRed', 0xa8502a, .8))
k.box((6.4, 2.8, .12), (-1.5, 0, 3.15), M('roofBrown', 0x5a3a2a, .7), rz=0, rx=0)
for sx in (-1, 1):
    k.box((3.3, 5.2, .1), (sx*1.55, 0, 3.15 - .0), M('roofBrown', 0x5a3a2a, .7))
k.box((5.6, .15, .5), (0, -2.45, 2.4), M('barnRed', 0xa8502a, .8))
for x in (-1.4, 1.4): k.box((.5, .5, .6), (x, .5, 3.6), M('barnRed', 0xa8502a, .8)); k.cyl(.35, .4, (x, .5, 4.05), M('roofBrown', 0x5a3a2a, .7), r2=0, segs=4)
k.box((5.4, 4.6, .02), (0, 0, .16), DARK)
k.done()
k = Kit('hangar2')
k.box((7, 6.4, .15), (0, 0, .07), CONC)
k.arch(6.4, 6, 3.4, (0, 0, .15), M('corrugated', 0x9aa0a8, .45, .6), ribs=6, rib_m=STEEL)
k.box((6.0, .15, 3.0), (0, 3.0, 1.6), M('corrugated', 0x9aa0a8, .45, .6))
k.box((1.6, 2.4, 1.8), (3.9, .5, 1.0), M('office', 0xd8d4c8, .7)); k.box((1.7, 2.5, .12), (3.9, .5, 1.95), DARK)
k.box((6.0, .06, .3), (0, -3.05, 3.3), YEL)
k.done()
k = Kit('hangar3')
k.box((9, 8, .15), (0, 0, .07), CONC)
k.arch(8.4, 7.4, 4.8, (0, 0, .15), M('glassRoof', 0x8ac4e0, .1, .3, .35), thick=.08, ribs=8, rib_m=WHITE)
k.box((8.0, .15, 4.2), (0, 3.7, 2.2), M('glassRoof', 0x8ac4e0, .1, .3, .35))
for sx in (-1, 1): k.box((.4, 7.6, .5), (sx*4.1, 0, .4), WHITE)
k.box((8.6, .3, .35), (0, -3.75, 4.75), WHITE)
for x in range(-3, 4): k.box((.25, .05, .1), (x*1.05, -3.9, 4.5), CYAN)
k.done()

# ---- watchtowers: 1 wooden legs, 2 steel legs and a radio, 3 armoured with a searchlight
def tower(name, tier):
    k = Kit(name); legm = WOOD if tier == 1 else STEEL
    k.box((1.8, 1.8, .12), (0, 0, .06), CONC)
    for sx in (-1, 1):
        for sy in (-1, 1): k.box((.16, .16, 3.2), (sx*.62, sy*.62, 1.7), legm)
    for z in (1.0, 2.2): k.box((1.4, .08, .08), (0, -.62, z), legm); k.box((1.4, .08, .08), (0, .62, z), legm)
    for i in range(8): k.box((.4, .05, .05), (.25, -.7, .5 + i*.36), DARK)
    k.box((1.7, 1.7, .1), (0, 0, 3.3), legm)
    k.box((1.75, .08, .9), (0, -.84, 3.8), OLIVE); k.box((1.75, .08, .9), (0, .84, 3.8), OLIVE); k.box((.08, 1.75, .9), (-.84, 0, 3.8), OLIVE); k.box((.08, 1.75, .9), (.84, 0, 3.8), OLIVE)
    for i in range(3): k.box((.12, .02, .12), (-.4 + i*.18, -.89, 3.85 - (i % 2)*.12), WHITE)
    k.cyl(.03, 1.6, (.75, .75, 4.6), STEEL); k.box((.7, .03, .45), (1.1, .75, 5.15), OLIVE)
    if tier >= 2: k.box((.4, .3, .35), (0, .3, 3.55), OLIVE2); k.cyl(.015, .6, (.1, .3, 4.0), STEEL)
    if tier >= 2:
        for sx in (-1, 1): k.box((.5, .5, .55), (sx*1.15, -.95, .3), CONC2)
    if tier >= 3:
        k.box((1.3, .06, 2.6), (0, -.66, 1.75), DARK); k.cyl(.04, 1.0, (0, 0, 4.7), STEEL); k.cyl(.22, .3, (0, 0, 5.3), DARK, axis='y'); k.cyl(.18, .02, (0, -.16, 5.3), M('lamp', 0xfff2c0, .2, 0, 5), axis='y')
    k.done()
for t in (1, 2, 3): tower(f'tower{t}', t)

# ---- barracks / command post: 1 corrugated hut and a fenced pit, 2 concrete with a radar, 3 armoured bunker
def barracks(name, tier):
    k = Kit(name)
    k.box((7.2, 5.6, .14), (0, 0, .07), SAND if tier == 1 else CONC)
    wall = M('corr', 0x8a8a84, .6, .5) if tier == 1 else CONC if tier == 2 else M('armour', 0x7a7c78, .7, .2)
    k.box((2.6, 4.4, 2.6), (-2.1, .2, 1.4), wall)
    k.box((2.9, 2.4, .12), (-2.1, -.9, 2.85), GREENROOF, rx=.25); k.box((2.9, 2.4, .12), (-2.1, 1.3, 2.85), GREENROOF, rx=-.25)
    k.box((1.2, .06, .9), (-2.1, -2.12, 1.1), DARK)
    for i in range(3): k.box((.5, .04, .35), (-2.5 + i*.42, -2.13, 2.0), GLASS)
    # the training pit, sunk and fenced
    k.box((3.8, 4.0, .05), (1.5, .3, .1), DARK if tier > 1 else M('mud', 0x5a4a32, .95))
    for (x, y, sx, sy) in ((1.5, -1.75, 3.8, .06), (1.5, 2.35, 3.8, .06), (-.4, .3, .06, 4.1), (3.4, .3, .06, 4.1)):
        k.box((sx, sy, 1.1), (x, y, .65), M('fence', 0x6a6e70, .5, .6))
        k.box((sx + .02, sy + .02, .08), (x, y, 1.25), STEEL)
    if tier >= 2:
        k.cyl(.05, 2.4, (-3.0, 2.0, 4.0), STEEL); k.sph((.06, .06, .06), (-3.0, 2.0, 5.25), RED)
        k.box((.9, .08, .7), (-1.0, 2.2, 3.4), DARK, rx=.4)
    if tier >= 3:
        for x in (.6, 1.5, 2.4): k.box((.5, .5, .08), (x, .3, 1.15), RED)
        k.box((3.8, .4, .5), (1.5, -1.9, .35), CONC2)
    for i in range(6): k.box((.5, .3, .22), (-3.4 + (i % 3)*.5, -2.6 + (i // 3)*.0, .2 + (i // 3)*.22), SAND)
    k.done()
for t in (1, 2, 3): barracks(f'barracks{t}', t)

# ---- an army tent, a supply depot of crates and drums, a motor pool shed
k = Kit('armyTent')
k.box((4.2, 3.0, .08), (0, 0, .04), SAND)
t = bmesh.new()
pts = [(-1.8, -1.3, .1), (1.8, -1.3, .1), (1.8, 1.3, .1), (-1.8, 1.3, .1), (-1.8, 0, 2.0), (1.8, 0, 2.0)]
vs = [t.verts.new(p) for p in pts]
for f in ((0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5)): t.faces.new([vs[i] for i in f])
k.add(t, OLIVE)
k.box((.8, .04, 1.1), (0, -1.32, .6), DARK)
k.done()
k = Kit('depot')
k.box((3.4, 2.6, .1), (0, 0, .05), CONC)
for i in range(6): k.box((.7, .5, .45), (-1.1 + (i % 3)*.75, -.6, .32 + (i // 3)*.45), M('crate', 0x4a5a32, .8))
for i in range(5): k.cyl(.22, .7, (-1.0 + i*.5, .7, .45), M('drum', 0x2a3a5a, .5, .4))
k.done()
k = Kit('motorPool')
k.box((7, 5, .1), (0, 0, .05), CONC)
for x in (-2.3, 0, 2.3): k.box((2.1, .08, .02), (x, -.5, .11), YEL)
k.box((7, 1.6, 2.4), (0, 1.8, 1.25), M('corr', 0x8a8a84, .6, .5)); k.box((7.2, 1.8, .12), (0, 1.8, 2.5), GREENROOF)
for x in (-3.4, 3.4): k.box((.1, 5, .9), (x, 0, .5), M('fence', 0x6a6e70, .5, .6))
k.done()

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('B2_DONE', [o.name for o in col.objects])
