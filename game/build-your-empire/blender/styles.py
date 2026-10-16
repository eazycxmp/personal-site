# Regional landmark kits for conquered lands: Austria, Russia, China, the Middle East, Brazil and Canada.
# Each landmark is one object (parts joined) standing on its origin, with named materials the game can
# recolour ("wall" in particular). Fronts face Blender -Y (the game's +Z).
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.75, metal=0.0):
    key = (name, h)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    MATS[key] = m; return m

class Kit:
    """Collects parts into one bmesh with per-face materials, then becomes one object."""
    def __init__(self, name): self.name, self.bm, self.mats = name, bmesh.new(), []
    def mi(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)
    def add(self, t, m):
        me = bpy.data.meshes.new('t'); t.to_mesh(me); t.free(); n0 = len(self.bm.faces); self.bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bm.faces.ensure_lookup_table(); k = self.mi(m)
        for f in list(self.bm.faces)[n0:]: f.material_index = k
    def box(self, size, at, m, rz=0):
        t = bmesh.new(); bmesh.ops.create_cube(t, size=1); bmesh.ops.scale(t, vec=Vector(size), verts=t.verts)
        if rz: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def cyl(self, r, h, at, m, segs=16, r2=None):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        bmesh.ops.translate(t, vec=Vector(at) + Vector((0, 0, h / 2)), verts=t.verts); self.add(t, m)
    def lathe(self, prof, at, m, segs=20):
        """Spin a (radius, height) profile around Z: onion domes, spires, minarets."""
        t = bmesh.new(); rings = []
        for r, z in prof: rings.append([t.verts.new((r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs), z)) for k in range(segs)])
        for i in range(len(rings) - 1):
            for k in range(segs): t.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def gable(self, w, d, h, at, m, over=.15):
        t = bmesh.new(); W, D = w / 2 + over, d / 2 + over
        a = [t.verts.new((-W, y, 0)) for y in (-D, D)]; b = [t.verts.new((W, y, 0)) for y in (-D, D)]; r = [t.verts.new((0, y, h)) for y in (-D, D)]
        t.faces.new((a[0], b[0], r[0])); t.faces.new((a[1], r[1], b[1])); t.faces.new((a[0], r[0], r[1], a[1])); t.faces.new((b[0], b[1], r[1], r[0])); t.faces.new((a[0], a[1], b[1], b[0]))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def curvedRoof(self, w, d, h, at, m, lift=.35):
        """A Chinese roof: a hipped roof whose corners sweep upward."""
        t = bmesh.new(); N = 8; grid = []
        for i in range(N + 1):
            row = []
            for j in range(N + 1):
                u, v = i / N * 2 - 1, j / N * 2 - 1; edge = max(abs(u), abs(v))
                z = h * (1 - edge) + lift * (abs(u) * abs(v)) ** 3
                row.append(t.verts.new((u * w / 2, v * d / 2, z)))
            grid.append(row)
        for i in range(N):
            for j in range(N): t.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def windows(self, w, y, zs, xs, m, size=(.22, .04, .3)):
        for z in zs:
            for x in xs: self.box(size, (x, y, z), m)
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me); col.objects.link(ob); return ob

ONION = lambda r, h: [(r * .55, 0), (r * .95, h * .18), (r, h * .35), (r * .8, h * .55), (r * .4, h * .75), (r * .12, h * .9), (.02, h)]
GLASS = M('glass', 0x2a3a4a, .2, .4)

# ---------------------------------------------------------------- Austria
k = Kit('chalet')
k.box((2.2, 1.8, 1.0), (0, 0, .5), M('wall', 0xf4efe4))
k.box((2.2, 1.8, .9), (0, 0, 1.45), M('timber', 0x7a4a26))
k.gable(2.2, 1.8, .9, (0, 0, 1.9), M('roof', 0x5a3a26), over=.35)
k.box((2.4, .5, .08), (0, -1.15, 1.2), M('timber', 0x7a4a26))
for x in (-.7, 0, .7): k.box((.4, .12, .18), (x, -1.35, 1.32), M('flowers', 0xd9302a))
k.windows(2.2, -.91, [.55, 1.5], [-.6, .6], GLASS); k.box((.4, .05, .7), (0, -.91, .35), M('door', 0x5a3a20))
k.done()
k = Kit('baroqueChurch')
k.box((2.4, 3.6, 2.2), (0, .4, 1.1), M('wall', 0xf2d36b)); k.box((2.5, 3.7, .15), (0, .4, 2.2), M('trim', 0xf4f4f4))
k.gable(2.4, 3.6, 1.0, (0, .4, 2.25), M('roof', 0x8a3a2a), .1)
k.box((1.3, 1.3, 3.6), (0, -1.6, 1.8), M('wall', 0xf2d36b)); k.box((1.4, 1.4, .15), (0, -1.6, 3.6), M('trim', 0xf4f4f4))
k.lathe(ONION(.7, 1.4), (0, -1.6, 3.65), M('copper', 0x4a9a7a, .5, .4)); k.cyl(.04, 1.0, (0, -1.6, 5.0), M('gold', 0xf2c200, .3, .8))
k.windows(1.3, -2.26, [2.4], [0], GLASS, (.3, .04, .5)); k.box((.6, .05, 1.0), (0, -2.26, .5), M('door', 0x5a3a20))
k.done()

# ---------------------------------------------------------------- Russia
k = Kit('onionChurch')
k.box((2.4, 2.4, 2.2), (0, 0, 1.1), M('wall', 0xf4f0e6)); k.box((2.5, 2.5, .15), (0, 0, 2.2), M('trim', 0xd9302a))
for (x, y, r, h, c) in [(0, 0, .75, 1.8, 0xd9302a), (-.8, -.8, .45, 1.1, 0x2f7ac0), (.8, -.8, .45, 1.1, 0x3f9a4a), (-.8, .8, .45, 1.1, 0xf2c200), (.8, .8, .45, 1.1, 0x2f7ac0)]:
    k.cyl(r * .7, .6 if r > .6 else .35, (x, y, 2.25), M('drum', 0xf4f0e6)); k.lathe(ONION(r, h), (x, y, 2.85 if r > .6 else 2.6), M('dome', c, .4, .2)); k.cyl(.03, .5, (x, y, (2.85 if r > .6 else 2.6) + h), M('gold', 0xf2c200, .3, .8))
k.windows(2.4, -1.21, [1.3], [-.6, .6], GLASS, (.3, .04, .6)); k.box((.6, .05, 1.0), (0, -1.21, .5), M('door', 0x5a3a20))
k.done()
k = Kit('kremlinTower')
k.box((1.5, 1.5, 3.2), (0, 0, 1.6), M('wall', 0xb8322a)); k.box((1.1, 1.1, 1.2), (0, 0, 3.8), M('wall', 0xb8322a))
for x in (-.6, -.2, .2, .6):
    for y in (-.75, .75): k.box((.22, .1, .35), (x, y, 3.35), M('wall', 0xb8322a))
k.lathe([(.7, 0), (.05, 2.2)], (0, 0, 4.4), M('spire', 0x3f7a4a, .5, .2), segs=8)
k.cyl(.03, .6, (0, 0, 6.5), M('gold', 0xf2c200, .3, .8)); k.box((.4, .06, .4), (0, 0, 7.15), M('star', 0xe0302a, .3, .3), rz=0)
k.done()
k = Kit('kremlinWall')
k.box((4, .6, 1.8), (0, 0, .9), M('wall', 0xb8322a))
for i in range(8): k.box((.28, .62, .4), (-1.75 + i * .5, 0, 2.0), M('wall', 0xb8322a))
k.done()

# ---------------------------------------------------------------- China
k = Kit('pagoda')
for i in range(5):
    w = 2.4 - i * .35; z = i * 1.0
    k.box((w * .7, w * .7, .75), (0, 0, z + .375), M('wall', 0xb8322a))
    k.curvedRoof(w * 1.15, w * 1.15, .35, (0, 0, z + .75), M('roof', 0x2f6a4a, .5, .1), lift=.3)
k.lathe([(.08, 0), (.02, 1.2)], (0, 0, 5.1), M('gold', 0xf2c200, .3, .8), segs=8)
k.done()
k = Kit('paifang')
for x in (-1.3, -.45, .45, 1.3): k.box((.22, .22, 2.4 if abs(x) < 1 else 1.9), (x, 0, (2.4 if abs(x) < 1 else 1.9) / 2), M('wall', 0xc8302a))
k.box((3.0, .3, .3), (0, 0, 2.1), M('trim', 0x2f6a4a)); k.box((1.2, .12, .45), (0, -.18, 2.0), M('gold', 0xf2c200, .3, .8))
k.curvedRoof(3.4, .9, .35, (0, 0, 2.4), M('roof', 0x2f6a4a, .5, .1), .3)
k.done()
k = Kit('chineseHouse')
k.box((2.4, 1.8, 1.4), (0, 0, .7), M('wall', 0xf4f0e6)); for_x = [-.7, .7]
for x in (-1.15, 1.15): k.box((.16, .16, 1.4), (x, -.92, .7), M('trim', 0xb8322a))
k.curvedRoof(3.0, 2.3, .55, (0, 0, 1.4), M('roof', 0x4a4a52, .6), .25)
k.windows(2.4, -.91, [.8], for_x, M('lattice', 0x8a3a2a), (.45, .04, .45)); k.box((.5, .05, .9), (0, -.91, .45), M('door', 0xb8322a))
k.done()

# ---------------------------------------------------------------- Middle East
k = Kit('mosque')
k.box((3.2, 3.2, 1.9), (0, 0, .95), M('wall', 0xe8d4a8)); k.cyl(1.25, .5, (0, 0, 1.9), M('wall', 0xe8d4a8), 24)
k.lathe([(1.25, 0), (1.25, .2), (1.15, .7), (.85, 1.15), (.4, 1.45), (.05, 1.55)], (0, 0, 2.4), M('dome', 0x2f8a9a, .35, .3), 24)
k.cyl(.03, .5, (0, 0, 3.95), M('gold', 0xf2c200, .3, .8))
k.cyl(.3, 4.2, (1.9, -1.2, 0), M('wall', 0xe8d4a8)); k.cyl(.42, .18, (1.9, -1.2, 3.4), M('trim', 0xc8a878)); k.lathe([(.3, 0), (.05, .9)], (1.9, -1.2, 4.2), M('dome', 0x2f8a9a, .35, .3), 12)
for x in (-.9, 0, .9): k.box((.5, .05, .9), (x, -1.61, .6), M('arch', 0x5a3a20))
k.done()
k = Kit('souk')
k.box((2.0, 1.8, 1.6), (0, 0, .8), M('wall', 0xe0c08a)); k.box((2.1, 1.9, .12), (0, 0, 1.62), M('trim', 0xc8a070))
k.box((1.8, .9, .05), (0, -1.25, 1.05), M('awning', 0xd9443a), rz=0)
k.box((.6, .05, .9), (0, -.91, .45), M('door', 0x5a3a20)); k.windows(2.0, -.91, [1.2], [-.6, .6], GLASS, (.25, .04, .3))
k.done()

# ---------------------------------------------------------------- Brazil
k = Kit('colonial')
k.box((2.4, 1.6, 2.4), (0, 0, 1.2), M('wall', 0xf2c200)); k.box((2.5, 1.7, .12), (0, 0, 1.25), M('trim', 0xf4f4f4))
k.gable(2.4, 1.6, .7, (0, 0, 2.4), M('roof', 0xc8603a), .2)
for z in (.6, 1.8):
    for x in (-.75, 0, .75): k.box((.38, .05, .62), (x, -.81, z), M('shutter', 0x2f7ac0))
k.box((2.3, .4, .06), (0, -1.0, 1.35), M('trim', 0xf4f4f4))
k.done()
k = Kit('statue')
k.box((1.2, 1.2, 1.4), (0, 0, .7), M('stone', 0xd8d4cc)); k.box((.8, .8, .5), (0, 0, 1.65), M('stone', 0xd8d4cc))
k.cyl(.32, 2.2, (0, 0, 1.9), M('robe', 0xeeeae2), 12, .2); k.box((2.4, .22, .26), (0, 0, 3.75), M('robe', 0xeeeae2)); k.cyl(.18, .3, (0, 0, 4.1), M('robe', 0xeeeae2))
k.done()

# ---------------------------------------------------------------- Canada
k = Kit('logCabin')
for i in range(6):
    for (sx, sy, w, d) in [(0, -.85, 2.2, .2), (0, .85, 2.2, .2), (-1.05, 0, .2, 1.7), (1.05, 0, .2, 1.7)]:
        k.box((w + (.25 if d == .2 else 0), d, .26), (sx, sy, .13 + i * .25), M('logs', 0x8a5a2b))
k.gable(2.2, 1.7, .9, (0, 0, 1.5), M('roof', 0x2f5a3a), .3)
k.box((.5, .5, 2.6), (.95, .5, 1.3), M('stone', 0x8a8a84)); k.box((.4, .05, .7), (-.4, -.96, .35), M('door', 0x5a3a20)); k.windows(2.2, -.96, [.9], [.5], GLASS, (.35, .04, .35))
k.done()
k = Kit('maple')
k.cyl(.15, 1.4, (0, 0, 0), M('bark', 0x6a4426), 8)
t = bmesh.new(); bmesh.ops.create_icosphere(t, subdivisions=2, radius=1.0)
for v in t.verts: v.co *= 1 + .12 * math.sin(v.co.x * 7) * math.cos(v.co.y * 6)
bmesh.ops.translate(t, vec=Vector((0, 0, 2.0)), verts=t.verts); k.add(t, M('leaves', 0xd9502a, .8))
k.done()

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('STYLES_DONE', [o.name for o in col.objects])
