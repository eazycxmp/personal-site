# Space kit, original designs: a chunky suit helmet with a gold visor and a backpack; a wedge-shaped
# capital ship with a stepped command tower; a white-and-red starfighter with split wings and twin engines;
# and Moon-base fuel tanks. Fronts point to Blender -Y (the game's +Z).
import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.6, metal=0.0):
    if (name, h) in MATS: return MATS[(name, h)]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    MATS[(name, h)] = m; return m
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
    def sph(self, s, at, m, segs=(16, 10)):
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=segs[0], v_segments=segs[1], radius=1)
        for v in t.verts: v.co = Vector((v.co.x * s[0], v.co.y * s[1], v.co.z * s[2])) + Vector(at)
        self.add(t, m, True)
    def cyl(self, r, h, at, m, axis='z', segs=16, r2=None):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        if axis == 'y': bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, True)
    def poly(self, pts, z0, z1, m):
        t = bmesh.new(); top = [t.verts.new((x, y, z1)) for x, y in pts]; bot = [t.verts.new((x, y, z0)) for x, y in pts]
        t.faces.new(top); t.faces.new(list(reversed(bot)))
        for i in range(len(pts)): t.faces.new((bot[i], bot[(i + 1) % len(pts)], top[(i + 1) % len(pts)], top[i]))
        self.add(t, m)
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        o = bpy.data.objects.new(self.name, me); col.objects.link(o); return o

WHITE, RED, GOLD, GREY, DARK, GLOW = M('suit', 0xf2f2f0, .55), M('red', 0xc8302a, .5), M('visor', 0xd9a52a, .08, .9), M('hull', 0x9aa0a6, .55, .4), M('dark', 0x3a3e44, .6, .3), M('glow', 0x8fd8ff, .3)

# the helmet: a big round shell, a red stripe, a gold mirrored visor and side lights
k = Kit('helmet'); k.sph((.5, .5, .48), (0, 0, 0), WHITE); k.box((.1, .9, .05), (0, .02, .43), RED)
k.sph((.38, .2, .3), (0, -.36, -.02), GOLD); for_ = [k.cyl(.08, .1, (sx * .5, 0, 0), DARK) for sx in (-1, 1)]; k.done()
# the backpack: chunky, with red panels, vents and a light
k = Kit('pack'); k.box((.9, .45, 1.0), (0, 0, 0), WHITE); k.box((.92, .2, .35), (0, .12, .25), RED)
for x in (-.25, .25): k.cyl(.12, .2, (x, .25, -.35), DARK, axis='y')
k.box((.12, .1, .12), (.35, .25, .4), GLOW); k.done()

# a capital ship: a long flat wedge, stepped decks, a command tower with a bridge and two domes, engines astern
k = Kit('destroyer')
k.poly([(0, -10), (6, 7), (-6, 7)], -.6, .6, GREY)                          # the wedge hull
k.poly([(0, -6), (4, 6), (-4, 6)], .6, 1.3, GREY)                          # upper deck
for i, (w, y, h) in enumerate([(3.6, 4.0, .7), (2.8, 4.6, .7), (2.0, 5.2, .7)]): k.box((w, 2.4 - i * .4, h), (0, y, 1.3 + .35 + i * .7), GREY)
k.box((.5, .5, 1.6), (0, 5.6, 3.6), DARK); k.box((3.2, 1.0, .5), (0, 5.6, 4.6), GREY)
for x in (-1.2, 1.2): k.sph((.35, .35, .35), (x, 5.6, 5.05), GREY)
for x in (-3.5, 0, 3.5): k.cyl(.7, .8, (x, 7.3, 0), DARK, axis='y'); k.cyl(.55, .1, (x, 7.75, 0), GLOW, axis='y')
for i in range(14): k.box((.18, .08, .1), (-5 + i * .75 * (1 if i % 2 else 1), 4 + (i % 5) * .5 - abs(-5 + i * .75) * .9, .62), GLOW)
k.done()

# a starfighter: white with red stripes, a long nose, split wings with tip cannons and two engines
k = Kit('starfighter')
k.cyl(.35, 4.0, (0, -.6, 0), WHITE, axis='y', r2=.08)
k.sph((.3, .7, .25), (0, -.8, .3), M('canopy', 0x1a2a3a, .1, .5))
k.box((.12, 3.2, .1), (0, -.4, .34), RED)
for sx in (-1, 1):
    # swept delta wings with a red edge, small canards up front and a pod on each tip
    k.poly([(sx * .3, -.6), (sx * 2.5, 1.2), (sx * 2.5, 1.5), (sx * .3, 1.5)], -.05, .05, WHITE)
    k.poly([(sx * 2.0, .75), (sx * 2.5, 1.2), (sx * 2.5, 1.35), (sx * 1.95, .9)], .05, .07, RED)
    k.poly([(sx * .3, -2.0), (sx * 1.0, -1.6), (sx * 1.0, -1.4), (sx * .3, -1.4)], -.03, .03, WHITE)
    k.cyl(.12, 1.0, (sx * 2.5, 1.0, 0), WHITE, axis='y', r2=.05)
    k.poly([(sx * .45, 1.0), (sx * .55, 1.8), (sx * .55, 1.9), (sx * .45, 1.9)], .3, .9, RED)
    k.cyl(.28, 1.4, (sx * .5, 1.1, 0), WHITE, axis='y'); k.cyl(.22, .1, (sx * .5, 1.85, 0), GLOW, axis='y'); k.box((.08, 1.0, .05), (sx * .5, 1.1, .29), RED)
k.done()

# Moon-base fuel tanks in a frame
k = Kit('tanks')
for x in (-.7, .7): k.cyl(.6, 2.2, (x, 0, 1.1), M('tank', 0xc89a5a, .5, .3)); k.cyl(.62, .08, (x, 0, 1.8), DARK); k.cyl(.62, .08, (x, 0, .4), DARK)
for x in (-1.4, 1.4):
    for y in (-.7, .7): k.box((.08, .08, 2.4), (x, y, 1.2), DARK)
k.box((2.9, 1.5, .08), (0, 0, 2.4), DARK); k.done()

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('SPACEKIT_DONE', [o.name for o in col.objects])
