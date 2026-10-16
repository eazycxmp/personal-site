# Castles in each land's own style (one landmark per city), and a market stall. Each faces Blender -Y (game +Z),
# stands on the ground, ~10 m across. Original designs inspired by the references.
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.75, metal=0.0, emit=0.0):
    k = (name, h)
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
    def box(self, s, at, m, rz=0):
        t = bmesh.new(); bmesh.ops.create_cube(t, size=1); bmesh.ops.scale(t, vec=Vector(s), verts=t.verts)
        if rz: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def cyl(self, r, h, at, m, segs=16, r2=None, smooth=True):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, smooth)
    def dome(self, r, at, m, sz=1.0, onion=False):
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=20, v_segments=12, radius=1)
        bmesh.ops.delete(t, geom=[v for v in t.verts if v.co.z < -.05], context='VERTS')
        for v in t.verts:
            z = v.co.z; k = (1 + .35*math.sin(z*math.pi)) if onion else 1
            v.co = Vector((v.co.x*r*k + at[0], v.co.y*r*k + at[1], z*r*sz + at[2]))
        self.add(t, m, True)
    def crenel(self, x0, x1, y0, y1, z, m, step=.6, s=.32):
        n = max(1, int(abs(x1 - x0 + y1 - y0)/step))
        for i in range(n + 1):
            u = i/n; self.box((s, s, s*1.1), (x0 + (x1 - x0)*u, y0 + (y1 - y0)*u, z + s*.55), m)
    def roof(self, w, d, h, at, m, flare=.25):
        t = bmesh.new(); hw, hd = w/2, d/2
        b = [t.verts.new((at[0] + x, at[1] + y, at[2])) for x, y in ((-hw - flare, -hd - flare), (hw + flare, -hd - flare), (hw + flare, hd + flare), (-hw - flare, hd + flare))]
        top = [t.verts.new((at[0] + x*.35, at[1] + y*.35, at[2] + h)) for x, y in ((-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd))]
        for i in range(4): t.faces.new((b[i], b[(i + 1) % 4], top[(i + 1) % 4], top[i]))
        t.faces.new(top); self.add(t, m)
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        o = bpy.data.objects.new(self.name, me); col.objects.link(o); return o

# ---- a golden-domed palace (Middle East): stepped stone platform, walls with corner towers, a big gold dome, minarets
STONE, SAND, GOLD, TEAL, DARK = M('palStone', 0xc8b490, .85), M('palSand', 0xe0cca0, .85), M('gold', 0xe0a830, .3, .8), M('teal', 0x2a8a8a, .5), M('door', 0x2a1a10, .7)
k = Kit('cPalace')
k.box((10, 10, .6), (0, 0, .3), STONE); k.box((8.6, 8.6, 2.2), (0, 0, 1.7), STONE); k.crenel(-4.3, 4.3, -4.3, -4.3, 2.8, STONE); k.crenel(-4.3, 4.3, 4.3, 4.3, 2.8, STONE)
for sx in (-1, 1):
    for sy in (-1, 1): k.cyl(.7, 3.4, (sx*4.3, sy*4.3, 2.3), STONE, segs=10); k.dome(.55, (sx*4.3, sy*4.3, 4.0), GOLD, 1.2, True)
k.box((5.6, 5.6, 2.4), (0, .3, 4.0), SAND); k.box((5.8, 5.8, .2), (0, .3, 5.25), TEAL)
k.cyl(1.9, 1.0, (0, .3, 5.8), SAND, segs=24); k.dome(2.0, (0, .3, 6.2), GOLD, 1.35, True); k.cyl(.06, 1.2, (0, .3, 9.2), GOLD); k.dome(.18, (0, .3, 9.85), GOLD)
for sx in (-1, 1): k.dome(1.0, (sx*2.0, -1.5, 5.25), GOLD, 1.0, True)
for sx in (-1, 1): k.cyl(.3, 6.5, (sx*3.0, 2.5, 5.3), SAND, segs=12); k.dome(.36, (sx*3.0, 2.5, 8.55), GOLD, 1.3, True)
k.box((1.8, .3, 2.2), (0, -4.35, 1.6), TEAL); k.box((1.1, .32, 1.6), (0, -4.38, 1.3), DARK)
for i in range(5): k.box((3, .6, .18), (0, -5.0 - i*.3, .1 + i*.12 - .0), STONE)
k.done()

# ---- a mud-brick desert fort: crenellated walls round a courtyard, a stepped round tower in three rings
MUD, MUD2 = M('mud', 0xc89a62, .95), M('mud2', 0xb48450, .95)
k = Kit('cFort')
k.box((10, 10, .3), (0, 0, .15), MUD2)
for (x0, x1, y0, y1) in ((-4.8, 4.8, -4.8, -4.8), (-4.8, 4.8, 4.8, 4.8), (-4.8, -4.8, -4.8, 4.8), (4.8, 4.8, -4.8, 4.8)):
    k.box((abs(x1 - x0) + .5, abs(y1 - y0) + .5, 2.4), ((x0 + x1)/2, (y0 + y1)/2, 1.4), MUD); k.crenel(x0, x1, y0, y1, 2.6, MUD, .55, .3)
for sx in (-1, 1): k.cyl(.9, 3.2, (sx*4.8, -4.8, 1.8), MUD, segs=14)
for i, (r, h) in enumerate(((3.0, 2.2), (2.3, 2.0), (1.5, 2.0))):
    z = .3 + sum(hh for _, hh in ((3.0, 2.2), (2.3, 2.0), (1.5, 2.0))[:i])
    k.cyl(r, h, (0, 1.2, z + h/2), MUD, segs=24)
    for a in range(int(r*6)): ang = a/(r*6)*2*math.pi; k.box((.3, .3, .3), (math.cos(ang)*r*.95, 1.2 + math.sin(ang)*r*.95, z + h + .15), MUD)
k.box((1.6, .6, 2.0), (0, -4.85, 1.1), MUD2); k.box((1.0, .62, 1.5), (0, -4.88, .9), DARK)
for i in range(4): k.box((4 - i*.6, .5, .2), (0, -2.0 - i*.0, .3 + i*.2), MUD2)
k.done()

# ---- a tropical stone castle on a rocky rise: arched galleries, a round tower with a conical roof, palms around
GSTONE, ROCK, SHINGLE, PALM, TRUNK, GLASS = M('greyStone', 0xb8b2a0, .9), M('rock', 0x8a8478, .95), M('shingle', 0x8a6a4a, .8), M('palm', 0x3a9a3a, .8), M('trunk', 0x7a5a3a, .9), M('glass', 0x6aa0c0, .1, .4)
k = Kit('cTropic')
k.cyl(5.5, 1.6, (0, 0, .8), ROCK, segs=9, r2=4.4, smooth=False)
k.box((7, 4.2, 2.4), (0, .6, 2.8), GSTONE); k.box((7, 4.2, 2.2), (-.5, 1.0, 5.1), GSTONE)
for row, z in ((0, 2.6), (1, 4.9)):
    for i in range(5): k.box((.9, .1, 1.3), (-2.8 + i*1.4 - row*.5, -1.52 + row*.4, z), GLASS)
k.crenel(-3.5, 3.5, -1.5, -1.5, 3.9, GSTONE, .55, .28); k.crenel(-4, 3, -1.1, -1.1, 6.2, GSTONE, .55, .28)
k.cyl(1.3, 6.5, (3.6, 1.8, 4.85), GSTONE, segs=16); k.cyl(1.5, 2.2, (3.6, 1.8, 9.2), SHINGLE, segs=16, r2=0)
k.cyl(1.0, .1, (-4.5, -2.5, 2.4), SHINGLE, segs=8); k.cyl(1.4, 1.2, (-4.5, -2.5, 3.0), SHINGLE, segs=8, r2=0)
for a in range(7):
    ang = a/7*2*math.pi + .3; x, y = math.cos(ang)*4.6, math.sin(ang)*4.6 + .5
    k.cyl(.12, 4.5, (x, y, 3.5), TRUNK, segs=6)
    for f in range(5): fa = f/5*2*math.pi; k.box((1.6, .45, .05), (x + math.cos(fa)*.7, y + math.sin(fa)*.7, 5.7), PALM, rz=fa)
k.done()

# ---- a spired fairy-tale castle (Austria): sandstone keep and halls, many slate-blue spires
SAND2, SLATE = M('sandstone', 0xd8c49a, .85), M('slate', 0x5a6a80, .6)
k = Kit('cSpires')
k.cyl(5.2, 1.0, (0, 0, .5), M('hill', 0x5a7a3a, .9), segs=10, r2=4.6, smooth=False)
k.box((7.2, 5.2, 3.2), (0, .4, 2.6), SAND2); k.crenel(-3.6, 3.6, -2.2, -2.2, 4.2, SAND2, .5, .26)
k.box((3.2, 3.0, 3.0), (-1.6, 1.2, 5.5), SAND2); k.roof(3.2, 3.0, 2.0, (-1.6, 1.2, 7.0), SLATE, .1)
for (x, y, r, h, sh) in ((3.2, -1.8, .8, 6.0, 2.6), (-3.4, -1.8, .7, 5.0, 2.2), (2.4, 2.4, .9, 7.5, 3.0), (0.4, -0.2, .55, 8.2, 2.6), (-3.2, 2.6, .6, 6.5, 2.4)):
    k.cyl(r, h, (x, y, 1.0 + h/2), SAND2, segs=12); k.cyl(r*1.15, sh, (x, y, 1.0 + h + sh/2), SLATE, segs=12, r2=0)
k.box((1.4, .4, 1.8), (0, -2.05, 1.9), M('door', 0x2a1a10, .7))
k.done()

# ---- a white Japanese castle (Kumo): a stone base, five tiers of white walls under dark flared roofs
WHITE, ROOFJ, STONEJ = M('jWhite', 0xf2f0ea, .7), M('jRoof', 0x3a3e46, .55), M('jStone', 0x9a9284, .95)
k = Kit('cHimeji')
k.cyl(6.0, 2.6, (0, 0, 1.3), STONEJ, segs=4, r2=4.6, smooth=False)
w = 6.0
for i in range(5):
    z = 2.6 + i*1.5; k.box((w, w*.8, 1.2), (0, 0, z + .6), WHITE)
    for c in range(3): k.box((.35, .05, .4), (-w/3 + c*w/3, -w*.4 - .02, z + .65), M('jWin', 0x2a2a2a, .6))
    k.roof(w, w*.8, .55, (0, 0, z + 1.2), ROOFJ, .55); w *= .8
k.roof(w*1.1, w*.9, 1.0, (0, 0, 2.6 + 5*1.5), ROOFJ, .3)
for sx in (-1, 1): k.box((.12, .4, .5), (sx*.5, 0, 2.6 + 5*1.5 + 1.0), M('gold', 0xe0a830, .3, .8))
k.done()

# ---- a market stall: a striped awning on posts over a counter of goods
k = Kit('stall')
for sx in (-1, 1):
    for sy in (-1, 1): k.box((.08, .08, 1.9), (sx*.9, sy*.6, .95), M('wood', 0x6b4a2a, .85))
for i in range(6): k.box((.32, 1.5, .06), (-.8 + i*.32, 0, 2.0 - abs(i - 2.5)*.03), M('awnRed', 0xd0382a, .7) if i % 2 else M('awnCream', 0xf2e8d0, .7))
k.box((1.9, .6, .8), (0, -.3, .4), M('wood', 0x6b4a2a, .85))
for i, c in enumerate((0xe85a2a, 0xf2c200, 0x5aa83a, 0xc83a6a)): k.box((.35, .35, .2), (-.6 + i*.4, -.3, .9), M('goods%d' % i, c, .7))
k.done()

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('CASTLES_DONE', [o.name for o in col.objects])
