# Road kit: gas stations in five levels, a sport motorcycle (wheels separate), and highway traffic (box truck, pickup, van).
# Each object stands on the ground, front toward Blender -Y (game +Z). Gas stations face the road on -Y.
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
    def box(self, s, at, m, rx=0, rz=0):
        t = bmesh.new(); bmesh.ops.create_cube(t, size=1); bmesh.ops.scale(t, vec=Vector(s), verts=t.verts)
        if rx: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rx, 3, 'X'))
        if rz: bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(rz, 3, 'Z'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m)
    def cyl(self, r, h, at, m, axis='z', segs=16, r2=None):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
        if axis == 'x': bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'Y'))
        if axis == 'y': bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi/2, 3, 'X'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, True)
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        o = bpy.data.objects.new(self.name, me); col.objects.link(o); return o

ASP, CONC, WHITE, GLASS, DARK, STEEL = M('asphalt', 0x34373c, .85), M('apron', 0xb8b6b0, .9), M('white', 0xf2f4f6, .4), M('shopGlass', 0x2a4a6a, .1, .5), M('dark', 0x1e2226, .6), M('steel', 0xaab2ba, .3, .7)
LED, WARM, RED, YEL = M('led', 0xffffff, .2, 0, 6), M('warmGlow', 0xffc870, .3, 0, 3), M('brandRed', 0xd0282a, .5), M('lime', 0xc8e83a, .4, 0, 1.2)

def pump(k, x, y, m=RED):
    k.box((.7, .5, .12), (x, y, .06), CONC); k.box((.36, .26, 1.0), (x, y, .6), m); k.box((.3, .02, .22), (x, y - .14, .82), M('screen', 0x5ad0ff, .2, 0, 1.5)); k.box((.4, .3, .06), (x, y, 1.13), WHITE)
def canopy(k, cx, cy, w, d, h, trim, posts=4, lights=True):
    k.box((w, d, .35), (cx, cy, h), WHITE); k.box((w + .04, d + .04, .14), (cx, cy, h + .12), trim)
    for i in range(posts):
        x = cx - w/2 + .6 + i*(w - 1.2)/max(1, posts - 1)
        k.box((.22, .22, h), (x, cy, h/2), WHITE)
    if lights:
        for i in range(int(w)):
            for j in range(int(d)): k.box((.3, .3, .02), (cx - w/2 + .5 + i, cy - d/2 + .5 + j, h - .19), LED)

# level 1: a small corner station, one island of two pumps, a red awning shop with string lights
k = Kit('gas1'); k.box((9, 7, .1), (0, 0, .05), ASP)
k.box((4.2, 2.8, 2.4), (-1.8, 1.8, 1.25), WHITE); k.box((4.4, 3.0, .2), (-1.8, 1.8, 2.5), DARK)
k.box((4.4, .9, .1), (-1.8, .1, 2.0), RED, rx=.35); k.box((3.4, .05, 1.2), (-1.8, .38, .95), GLASS)
for i in range(9): k.box((.07, .07, .07), (-3.8 + i*.5, -.32, 1.85), WARM)
pump(k, 2.0, -.6); pump(k, 3.0, -.6); k.cyl(.07, 4.2, (3.9, 2.6, 2.1), M('pole', 0xd04a2a, .5)); k.box((.4, .4, .2), (3.9, 2.4, 4.2), LED)
k.done()
# level 2: a canopy over four pumps, a bigger shop
k = Kit('gas2'); k.box((11, 8, .1), (0, 0, .05), ASP); k.box((5.6, 2.2, .06), (1.0, -.8, .12), CONC)
canopy(k, 1.0, -.8, 5.6, 3.2, 3.0, RED, posts=2)
for x in (-.6, .4, 1.6, 2.6): pump(k, x, -.8)
k.box((5.0, 3.0, 2.6), (-2.5, 2.4, 1.35), WHITE); k.box((5.2, 3.2, .3), (-2.5, 2.4, 2.75), RED); k.box((4.2, .05, 1.3), (-2.5, .88, 1.0), GLASS)
k.done()
# level 3: a modern canopy with a lime LED band and a glowing brand disc, six pumps, a glass-front shop
k = Kit('gas3'); k.box((14, 10, .1), (0, 0, .05), ASP)
canopy(k, 1.5, -1.2, 8.4, 4.4, 3.4, M('navy', 0x1e2a5a, .4), posts=3)
k.box((8.5, .05, .12), (1.5, -3.45, 3.45), YEL); k.cyl(.7, .12, (1.5, -3.5, 4.1), WHITE, axis='y', segs=24); k.cyl(.55, .14, (1.5, -3.5, 4.1), YEL, axis='y', segs=24)
for x in (-1.6, 0, 1.5, 3.0, 4.6):
    for y in (-2.0, -.4): pump(k, x, y, M('navy', 0x1e2a5a, .4))
k.box((6.4, 3.4, 3.0), (-3.4, 3.2, 1.55), M('shopGrey', 0xd8d6d0, .7)); k.box((5.4, .05, 1.8), (-3.4, 1.48, 1.2), GLASS); k.box((6.6, 3.6, .3), (-3.4, 3.2, 3.1), M('navy', 0x1e2a5a, .4))
for i in range(5): k.box((.12, .12, .5), (-.6 + i*.6, -4.4, .25), WHITE)
k.done()
# level 4: a travel center: two canopies, a large store with a warm glass front and a parking strip
k = Kit('gas4'); k.box((22, 14, .1), (0, 0, .05), ASP)
for cx in (-4.5, 4.5):
    canopy(k, cx, -3, 7.4, 4.2, 3.6, M('orangeTrim', 0xe8902a, .4), posts=3)
    for x in (cx - 2.6, cx - 1.0, cx + .6, cx + 2.2):
        for y in (-3.8, -2.2): pump(k, x, y, M('orangeTrim', 0xe8902a, .4))
k.box((12, 4.6, 3.6), (0, 4.4, 1.85), M('stucco', 0xd8b890, .8)); k.box((10, .05, 2.2), (0, 2.08, 1.3), WARM); k.box((12.4, 5, .4), (0, 4.4, 3.7), M('roofBrown', 0x5a3a2a, .7))
for x in range(-5, 6, 2): k.box((1.6, .06, .02), (x, .6, .11), WHITE)
k.done()
# level 5: a giant travel stop: four long canopies of pumps in rows, a huge lit store, lamp posts
k = Kit('gas5'); k.box((30, 20, .1), (0, 0, .05), ASP)
for i, y in enumerate((-7, -3.2)):
    for cx in (-7, 7):
        canopy(k, cx, y, 11, 2.6, 3.8, M('goldTrim', 0xe8a83a, .4, 0, 1.5), posts=4)
        for x in range(-4, 5, 2): pump(k, cx + x, y, M('goldTrim', 0xe8a83a, .4))
k.box((22, 5.6, 4.2), (0, 6.2, 2.15), M('stucco', 0xd8b890, .8)); k.box((8, 5.8, 5.4), (0, 6.2, 2.75), M('stucco2', 0xc8a070, .8))
k.box((7, .05, 3.2), (0, 3.38, 1.8), WARM); for_ = [k.box((5.5, .05, 1.6), (sx*7, 3.38, 1.2), WARM) for sx in (-1, 1)]
for x in range(-13, 14, 6): k.cyl(.08, 5, (x, -9.2, 2.5), DARK); k.box((.8, .3, .1), (x, -9.2, 5.0), LED)
k.done()

# motorcycle: a sport bike, red and black, with wheels as separate objects (origin at the axle)
k = Kit('moto_body')
k.box((.24, 1.2, .3), (0, 0, .62), M('bikeRed', 0xc8141a, .25, .3)); k.box((.3, .5, .28), (0, -.45, .78), M('bikeRed', 0xc8141a, .25, .3), rx=-.3)
k.box((.26, .4, .1), (0, .35, .84), DARK); k.box((.2, .45, .18), (0, .62, .72), M('bikeRed', 0xc8141a, .25, .3), rx=.25)
k.box((.32, .3, .22), (0, -.05, .42), DARK); k.cyl(.05, .5, (.12, .55, .4), STEEL, axis='y'); k.box((.2, .08, .25), (0, -.82, .95), M('screenTint', 0x2a3a4a, .1, .5), rx=-.6)
k.box((.6, .05, .05), (0, -.6, .98), DARK); k.box((.16, .04, .08), (0, -.83, .7), LED); k.box((.12, .04, .06), (0, .86, .76), M('tail', 0xff2a1a, .3, 0, 4))
k.box((.05, .5, .05), (.08, -.6, .45), STEEL, rx=.45); k.box((.05, .5, .05), (-.08, -.6, .45), STEEL, rx=.45)
k.done()
for i, y in enumerate((-.72, .68)):
    k = Kit(f'moto_wheel{i}'); k.cyl(.3, .14, (0, 0, 0), M('tyre', 0x161616, .9), axis='x', segs=24); k.cyl(.2, .16, (0, 0, 0), STEEL, axis='x', segs=18)
    w = k.done(); w.location = (0, y, .3)
root = bpy.data.objects.new('motorcycle', None); col.objects.link(root)
for o in col.objects:
    if o.name.startswith('moto_'): o.parent = root

# highway traffic: a box truck, a pickup and a van, ~4-6 m long
def wheels(k, xs, ys, r):
    for x in xs:
        for y in ys: k.cyl(r, .2, (x, y, r), M('tyre', 0x161616, .9), axis='x', segs=14)
k = Kit('truck'); k.box((2.2, 4.6, 2.6), (0, .8, 1.75), M('boxWhite', 0xe8eaec, .6)); k.box((2.1, 1.6, 1.7), (0, -2.3, 1.25), M('cab', 0x3a6ab0, .4, .3))
k.box((1.9, .05, .7), (0, -3.11, 1.55), GLASS); k.box((2.0, .1, .3), (0, -3.15, .55), DARK); wheels(k, (-.95, .95), (-2.3, .2, 2.4), .42); k.done()
k = Kit('pickup'); k.box((1.9, 4.6, .8), (0, 0, .85), M('pickupGrey', 0xc8ccd0, .4, .4)); k.box((1.8, 1.8, .8), (0, -.4, 1.6), M('pickupGrey', 0xc8ccd0, .4, .4))
k.box((1.7, .05, .55), (0, -1.31, 1.62), GLASS, rx=-.3); k.box((1.8, 1.7, .5), (0, 1.4, 1.5), M('bedLiner', 0x2a2a2a, .8)); wheels(k, (-.92, .92), (-1.45, 1.45), .38); k.done()
k = Kit('van'); k.box((2.0, 4.8, 2.1), (0, .1, 1.35), M('vanWhite', 0xf2f2f0, .5)); k.box((1.9, .8, 1.0), (0, -2.55, .95), M('vanWhite', 0xf2f2f0, .5))
k.box((1.8, .05, .7), (0, -2.15, 1.85), GLASS, rx=-.5); wheels(k, (-.95, .95), (-1.7, 1.7), .38); k.done()

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('ROAD_DONE', [o.name for o in col.objects if o.parent is None])
