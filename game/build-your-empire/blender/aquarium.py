# The aquarium: a big glass tank (frame, coral reef, rocks, a walk-through glass tunnel and an entrance pavilion),
# a separate translucent water volume, and swimmers: a shark and two kinds of tropical fish (tails separate so they wag).
# Front toward Blender -Y (the game's +Z). The tank is ~9 m x 6 m.
import bpy, bmesh, math, sys, random
from mathutils import Vector, Matrix
OUT = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.context.collection; random.seed(7)
lin = lambda h: tuple((c / 255 / 12.92) if c / 255 <= .04045 else (((c / 255) + .055) / 1.055) ** 2.4 for c in ((h >> 16) & 255, (h >> 8) & 255, h & 255))
MATS = {}
def M(name, h, rough=.6, metal=0.0, emit=0.0, alpha=1.0):
    k = (name, h)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(h), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*lin(h), 1); b.inputs['Emission Strength'].default_value = emit
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
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
    def blob(self, s, at, m, segs=(12, 8)):
        t = bmesh.new(); bmesh.ops.create_uvsphere(t, u_segments=segs[0], v_segments=segs[1], radius=1)
        for v in t.verts: v.co = Vector((v.co.x*s[0] + at[0], v.co.y*s[1] + at[1], v.co.z*s[2] + at[2]))
        self.add(t, m, True)
    def cone(self, r, h, at, m, tilt=(0, 0)):
        t = bmesh.new(); bmesh.ops.create_cone(t, cap_ends=True, segments=8, radius1=r, radius2=r*.35, depth=h)
        bmesh.ops.translate(t, vec=Vector((0, 0, h/2)), verts=t.verts)
        bmesh.ops.rotate(t, verts=t.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(tilt[0], 3, 'X') @ Matrix.Rotation(tilt[1], 3, 'Y'))
        bmesh.ops.translate(t, vec=Vector(at), verts=t.verts); self.add(t, m, True)
    def done(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        o = bpy.data.objects.new(self.name, me); col.objects.link(o); return o

FRAME, CONC, SAND, ROCK = M('frame', 0x2e3a48, .4, .5), M('aquaConc', 0x9aa4ae, .8), M('reefSand', 0xe8dcb8, .95), M('reefRock', 0x5a6670, .9)
CORALS = [M('coralPink', 0xf0608a, .7), M('coralOrange', 0xf28a2a, .7), M('coralPurple', 0x8a4ad8, .7), M('coralCyan', 0x3ad8e8, .6, 0, .6), M('coralYellow', 0xf2d23a, .7), M('weed', 0x3aa04a, .8)]
LIGHT = M('aquaLight', 0xd8f4ff, .2, 0, 4)

# ---- the tank: base, a dark steel frame with posts, the reef floor, rocks and coral, a glass tunnel, an entrance pavilion
k = Kit('aquariumTank')
W_, D_, H_ = 9.0, 6.0, 3.0
k.box((W_ + .6, D_ + .6, .3), (0, 0, .15), CONC)
k.box((W_, D_, .1), (0, 0, .35), SAND)
for sx in (-1, 1):
    for sy in (-1, 1): k.box((.18, .18, H_), (sx*W_/2, sy*D_/2, .3 + H_/2), FRAME)
for y in (-D_/2, D_/2):
    for z in (.4, .3 + H_): k.box((W_, .14, .14), (0, y, z), FRAME)
for x in (-W_/2, W_/2):
    for z in (.4, .3 + H_): k.box((.14, D_, .14), (x, 0, z), FRAME)
for x in (-3, -1, 1, 3): k.box((.1, .1, H_), (x, -D_/2, .3 + H_/2), FRAME)
for i in range(16):
    x, y = random.uniform(-W_/2 + .6, W_/2 - .6), random.uniform(-D_/2 + .6, D_/2 - .6)
    if abs(y) < .9: continue
    k.blob((random.uniform(.35, .7), random.uniform(.3, .6), random.uniform(.25, .5)), (x, y, .45), ROCK)
for i in range(70):
    x, y = random.uniform(-W_/2 + .4, W_/2 - .4), random.uniform(-D_/2 + .4, D_/2 - .4)
    if abs(y) < .95: continue
    c = CORALS[i % len(CORALS)]
    if i % 3 == 0: k.blob((.22, .22, .18), (x, y, .5), c)
    else:
        for j in range(3): k.cone(.06, random.uniform(.35, .8), (x, y, .4), c, tilt=(random.uniform(-.5, .5), random.uniform(-.5, .5)))
# the walk-through glass tunnel along the middle, with ribs
t = bmesh.new(); seg = 14; L = W_
for y0 in (0,):
    rings = []
    for xx in (-L/2, L/2):
        rings.append([t.verts.new((xx, math.cos(math.pi*a/seg)*.85, .4 + math.sin(math.pi*a/seg)*1.25)) for a in range(seg + 1)])
    for a in range(seg): t.faces.new((rings[0][a], rings[0][a + 1], rings[1][a + 1], rings[1][a]))
k.add(t, M('tunnelGlass', 0xbfe8ff, .05, .3, .25, alpha=.35), True)
for x in range(-4, 5):
    for a in range(seg):
        a0, a1 = math.pi*a/seg, math.pi*(a + 1)/seg
        k.box((.06, .09, .09), (x, (math.cos(a0) + math.cos(a1))/2*.87, .4 + (math.sin(a0) + math.sin(a1))/2*1.27), M('rib', 0xdfe4ea, .3, .6))
k.box((L, 1.5, .06), (0, 0, .43), M('walk', 0x3a4450, .6))
for x in range(-4, 5): k.box((.3, .05, .02), (x, -.6, .47), LIGHT); k.box((.3, .05, .02), (x, .6, .47), LIGHT)
# the entrance pavilion out front, with a wavy roof and a glowing sign strip
k.box((3.4, 1.8, 2.2), (0, -D_/2 - 1.2, 1.4), M('pavilion', 0xeef6fa, .4))
k.box((3.8, 2.2, .15), (0, -D_/2 - 1.2, 2.55), M('pavRoof', 0x2a7ab0, .4, .3))
k.box((3.0, .05, .3), (0, -D_/2 - 2.11, 2.2), M('aquaSign', 0x5af0ff, .3, 0, 5))
k.box((1.2, .05, 1.4), (0, -D_/2 - 2.11, .9), M('door', 0x1a2a3a, .2, .5))
k.done()

# ---- the water: one translucent volume filling the tank (its own object so the game can make it see-through)
k = Kit('aquariumWater')
k.box((W_ - .1, D_ - .1, H_ - .25), (0, 0, .4 + (H_ - .25)/2), M('water', 0x2a90c8, .05, 0, 0, alpha=.3))
k.done()

# ---- swimmers
def fish(name, body_c, fin_c, s, stripes=None, shark=False):
    k = Kit(name)
    if shark:
        k.blob((.42*s, 1.6*s, .45*s), (0, 0, 0), body_c, (16, 10))
        k.blob((.36*s, 1.1*s, .2*s), (0, -.1*s, -.2*s), M('sharkBelly', 0xeef0f0, .5), (14, 8))
        t = bmesh.new(); vs = [t.verts.new(p) for p in ((0, -.2*s, .3*s), (0, .5*s, .3*s), (0, .45*s, 1.0*s))]; t.faces.new(vs); k.add(t, fin_c)
        for sx in (-1, 1):
            t = bmesh.new(); vs = [t.verts.new(p) for p in ((sx*.3*s, -.5*s, -.15*s), (sx*1.0*s, .1*s, -.4*s), (sx*.3*s, .1*s, -.15*s))]; t.faces.new(vs); k.add(t, fin_c)
        for sx in (-1, 1): k.blob((.05*s, .05*s, .05*s), (sx*.28*s, -1.1*s, .12*s), M('eyeBlack', 0x0a0a0a, .2))
    else:
        k.blob((.12*s, .45*s, .32*s), (0, 0, 0), body_c, (12, 8))
        if stripes:
            for y in (-.12, .1): k.blob((.13*s, .05*s, .3*s), (0, y*s, 0), stripes)
        t = bmesh.new(); vs = [t.verts.new(p) for p in ((0, -.1*s, .28*s), (0, .25*s, .3*s), (0, .25*s, .4*s))]; t.faces.new(vs); k.add(t, fin_c)
        for sx in (-1, 1): k.blob((.03*s, .03*s, .03*s), (sx*.1*s, -.32*s, .06*s), M('eyeBlack', 0x0a0a0a, .2))
    body = k.done()
    k = Kit(name + '_tail')
    t = bmesh.new(); L = (.9 if shark else .3)*s
    vs = [t.verts.new(p) for p in ((0, 0, 0), (0, L, L*.7), (0, L*.8, 0), (0, L, -L*.5 if shark else -L*.7))]
    t.faces.new((vs[0], vs[1], vs[2])); t.faces.new((vs[0], vs[2], vs[3])); k.add(t, fin_c)
    tail = k.done(); tail.location = (0, (1.45 if shark else .4)*s, 0)
    root = bpy.data.objects.new(name + 'Fish', None); col.objects.link(root); body.parent = root; tail.parent = root
fish('shark', M('shark', 0x6a7a88, .5), M('sharkFin', 0x5a6a78, .5), 1.0, shark=True)
fish('clown', M('clown', 0xf27a1a, .5), M('clownFin', 0xf29a3a, .5), .5, stripes=M('clownStripe', 0xffffff, .5))
fish('tang', M('tang', 0x2a5ae0, .4), M('tangFin', 0xf2d23a, .5), .55)

for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_apply=True)
print('AQUA_DONE', [o.name for o in col.objects if o.parent is None])
