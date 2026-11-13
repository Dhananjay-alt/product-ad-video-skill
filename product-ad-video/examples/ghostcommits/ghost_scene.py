"""GhostCommits V2 — 3D product-ad scene, built entirely from code.

Run headless:
  blender -b --factory-startup -P ghost_scene.py -- still 60 out.png
  blender -b --factory-startup -P ghost_scene.py -- anim  <frames_dir> [start end]
  blender -b --factory-startup -P ghost_scene.py -- save  ghost.blend
"""
import math
import os
import sys

import bpy
from mathutils import Vector

FPS = 30
TOTAL = 540  # 18 s

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["still", "1", "//out.png"]
MODE = argv[0]


# ------------------------------------------------------------------ helpers
def srgb(hex_):
    hex_ = hex_.lstrip("#")
    c = [int(hex_[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)


def set_input(node, names, value):
    for n in names:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return True
    return False


def material(name, color, rough=0.3, metallic=0.0, coat=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    set_input(b, ["Base Color"], color)
    set_input(b, ["Roughness"], rough)
    set_input(b, ["Metallic"], metallic)
    set_input(b, ["Coat Weight", "Coat", "Clearcoat"], coat)
    set_input(b, ["Coat Roughness", "Clearcoat Roughness"], 0.04)
    if emission is not None:
        set_input(b, ["Emission Color", "Emission"], emission)
        set_input(b, ["Emission Strength"], strength)
    return m


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def ease(t):  # smooth ease in-out
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def seg(f, a, b, e=ease):
    return e((f - a) / (b - a)) if b != a else 0.0


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


# ------------------------------------------------------------------ reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = TOTAL
scene.render.fps = FPS

# ------------------------------------------------------------------ materials
RED = material("GhostRed", srgb("#ef233c"), rough=0.2, coat=1.0)
EYE = material("Eye", (0.002, 0.002, 0.003, 1), rough=0.06, coat=1.0)
DARK = material("Slab", srgb("#111114"), rough=0.28, coat=0.6)
TILE = material("Tile", srgb("#14070a"), rough=0.22, coat=0.8)
GLOW_RED = material("GlowRed", srgb("#ef233c"), rough=0.4, emission=srgb("#ef233c"), strength=2.4)
GLOW_WHITE = material("GlowWhite", srgb("#f5f5f7"), rough=0.4, emission=srgb("#f5f5f7"), strength=2.2)
GLOW_GREY = material("GlowGrey", srgb("#6a6a75"), rough=0.4, emission=srgb("#8a8a96"), strength=1.0)
STEEL = material("ShieldBody", srgb("#3a0d14"), rough=0.22, coat=1.0)


# ------------------------------------------------------------------ ghost
def build_ghost():
    SEG, DOME, BODY, SC = 96, 14, 12, 8
    verts = [(0, 0, 1.0)]
    faces = []
    for i in range(1, DOME + 1):
        phi = (i / DOME) * math.pi / 2
        for s in range(SEG):
            th = 2 * math.pi * s / SEG
            verts.append((math.sin(phi) * math.cos(th), math.sin(phi) * math.sin(th), math.cos(phi)))
    for j in range(1, BODY + 1):
        for s in range(SEG):
            th = 2 * math.pi * s / SEG
            u = (th * SC / (2 * math.pi) + 0.5) % 1.0
            tri = abs(u * 2 - 1)  # 1 at the points of the hem
            zb = -(0.94 + 0.28 * tri)
            verts.append((math.cos(th), math.sin(th), zb * j / BODY))
    for s in range(SEG):
        faces.append((0, 1 + s, 1 + (s + 1) % SEG))
    rings = DOME + BODY
    for r in range(rings - 1):
        a = 1 + r * SEG
        b = a + SEG
        for s in range(SEG):
            s2 = (s + 1) % SEG
            faces.append((a + s, b + s, b + s2, a + s2))
    me = bpy.data.meshes.new("GhostMesh")
    me.from_pydata(verts, [], faces)
    me.update()
    body = link(bpy.data.objects.new("GhostBody", me))
    body.data.materials.append(RED)
    smooth(body)
    sol = body.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = 0.09
    sol.offset = -1
    sub = body.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 2

    root = link(bpy.data.objects.new("Ghost", None))
    body.parent = root
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.185)
        eye = bpy.context.active_object
        eye.name = "Eye"
        ang = math.asin(0.39)
        eye.location = (sx * 0.39, -math.cos(ang) * 0.985, -0.055)
        eye.scale = (1, 0.42, 1.12)
        eye.rotation_euler = (0, 0, sx * ang)
        eye.data.materials.append(EYE)
        smooth(eye)
        eye.parent = root
    return root


def rounded_slab(name, w, h, d, r, mat, segs=10):
    """Rounded rectangle in the XZ plane, thickness d along Y."""
    pts = []
    for cx, cz, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180),
                       (w / 2 - r, -h / 2 + r, 270)):
        for i in range(segs + 1):
            a = math.radians(a0 + 90 * i / segs)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    n = len(pts)
    verts = [(x, -d / 2, z) for x, z in pts] + [(x, d / 2, z) for x, z in pts]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    me = bpy.data.meshes.new(name + "Mesh")
    me.from_pydata(verts, [], faces)
    me.update()
    ob = link(bpy.data.objects.new(name, me))
    ob.data.materials.append(mat)
    bev = ob.modifiers.new("Bevel", "BEVEL")
    bev.width = min(0.03, d * 0.4)
    bev.segments = 3
    return ob


def bar(name, w, h, mat, parent, x, z, y=-0.045):
    ob = rounded_slab(name, w, h, 0.02, h * 0.45, mat, segs=4)
    ob.modifiers.clear()
    ob.parent = parent
    ob.location = (x, y, z)
    return ob


def build_card():
    card = rounded_slab("FileCard", 1.7, 2.2, 0.07, 0.16, DARK)
    rows = [(0.55, GLOW_GREY), (1.15, GLOW_WHITE), (0.9, GLOW_GREY), (1.25, GLOW_RED), (0.7, GLOW_GREY)]
    for i, (w, m) in enumerate(rows):
        bar(f"CodeLine{i}", w, 0.085, m, card, -0.62 + w / 2, 0.66 - i * 0.27)
    bar("Button", 1.36, 0.24, GLOW_WHITE, card, 0, -0.78)
    return card


def build_shield():
    half = [(0, 1.0), (0.86, 0.74), (0.86, 0.0), (0.74, -0.44), (0.42, -0.78), (0, -1.0)]
    pts = half + [(-x, z) for x, z in reversed(half[1:-1])]
    n = len(pts)
    d = 0.16
    verts = [(x, -d / 2, z) for x, z in pts] + [(x, d / 2, z) for x, z in pts]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    me = bpy.data.meshes.new("ShieldMesh")
    me.from_pydata(verts, [], faces)
    me.update()
    sh = link(bpy.data.objects.new("Shield", me))
    sh.data.materials.append(STEEL)
    bev = sh.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.07
    bev.segments = 5
    # glowing inner outline
    cu = bpy.data.curves.new("ShieldRim", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.022
    cu.bevel_resolution = 4
    sp = cu.splines.new("POLY")
    sp.points.add(n - 1)
    for p, (x, z) in zip(sp.points, pts):
        p.co = (x * 0.8, -d / 2 - 0.012, z * 0.8, 1)
    sp.use_cyclic_u = True
    rim = link(bpy.data.objects.new("ShieldRim", cu))
    rim.data.materials.append(GLOW_RED)
    rim.parent = sh
    return sh


def build_tile():
    tile = rounded_slab("LogoTile", 4.44, 4.44, 0.3, 1.33, TILE, segs=16)
    cu = bpy.data.curves.new("TileRim", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.035
    cu.bevel_resolution = 4
    sp = cu.splines.new("POLY")
    pts = []
    w = 4.44 - 0.12
    r = 1.33 - 0.06
    for cx, cz, a0 in ((w / 2 - r, w / 2 - r, 0), (-w / 2 + r, w / 2 - r, 90), (-w / 2 + r, -w / 2 + r, 180),
                       (w / 2 - r, -w / 2 + r, 270)):
        for i in range(17):
            a = math.radians(a0 + 90 * i / 16)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    sp.points.add(len(pts) - 1)
    for p, (x, z) in zip(sp.points, pts):
        p.co = (x, -0.17, z, 1)
    sp.use_cyclic_u = True
    rim = link(bpy.data.objects.new("TileRim", cu))
    rim.data.materials.append(GLOW_RED)
    rim.parent = tile
    return tile


ghost = build_ghost()
card = build_card()
shield = build_shield()
tile = build_tile()


# ------------------------------------------------------------------ lights
def area(name, loc, target, size, power, color=(1, 1, 1), size_y=None):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = power
    li.color = color
    if size_y:
        li.shape = "RECTANGLE"
        li.size = size
        li.size_y = size_y
    else:
        li.size = size
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    look_at(ob, target)
    return ob


key = area("Key", (-3.2, -4.5, 4.2), (0, 0, 0), 4.5, 1100)
fill = area("Fill", (4.5, -5, -0.5), (0, 0, 0), 5, 130)
rim_r = area("RimRight", (4.2, 4.5, 2.2), (0, 0, 0), 3, 2600, (1.0, 0.16, 0.2))
rim_l = area("RimLeft", (-4.6, 3.8, -0.4), (0, 0, 0), 3, 1500, (1.0, 0.22, 0.26))
streak = area("Streak", (0, -3.2, 3), (0, 0, 0), 0.22, 0, (1, 1, 1), size_y=7)

world = bpy.data.worlds.new("Void")
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.0015, 0.0012, 0.0014, 1)
scene.world = world

# ------------------------------------------------------------------ camera
cam_data = bpy.data.cameras.new("Cam")
cam = link(bpy.data.objects.new("Cam", cam_data))
focus = link(bpy.data.objects.new("Focus", None))
scene.camera = cam
cam_data.dof.use_dof = True
cam_data.dof.focus_object = focus
cam_data.sensor_width = 36


# ------------------------------------------------------------------ choreography
def orbit(subject, r, deg, h, off=0.0, zoff=0.0):
    """Camera on a circle round `subject`; `off` slides the view so the subject sits right of centre."""
    a = math.radians(deg)
    right = (math.cos(a), math.sin(a))
    cx = subject[0] + r * math.sin(a) - right[0] * off
    cy = subject[1] - r * math.cos(a) - right[1] * off
    aim = (subject[0] - right[0] * off, subject[1] - right[1] * off, subject[2] + zoff)
    return (cx, cy, subject[2] + h + zoff), aim


def clamp01(x):
    return max(0.0, min(1.0, x))


def state(f):
    """Everything about frame f. Positions are (x, y, z); the camera looks at `aim`."""
    s = {
        "ghost_loc": (0, 0, 0), "ghost_rot": (0, 0, 0), "ghost_scale": 1.0,
        "card_loc": (0, 0, -40), "card_rot": (0, 0, 0),
        "shield_loc": (0, 0, -40), "shield_rot": (0, 0, 0), "shield_scale": 1.0,
        "tile_loc": (0, 0, -40), "tile_scale": 1.0,
        "cam": (0, -12, 0.2), "aim": (0, 0, 0), "focus": (0, -1, 0), "lens": 50, "fstop": 4.0,
        "streak": 0.0, "streak_x": 0.0, "key": 1100, "rim": 1.0,
    }
    bob = 0.05 * math.sin(f / 22)

    if f <= 75.75:  # 1 — macro along the dome, light streak races across
        t = seg(f, 1, 75)
        s["cam"], s["aim"] = orbit((0, 0, 0.45), lerp(2.7, 3.1, t), lerp(-42, 26, t), lerp(1.0, 0.65, t))
        c = Vector(s["cam"]) - Vector((0, 0, 0.2))
        s["focus"] = tuple(c.normalized() * 1.0 + Vector((0, 0, 0.2)))
        s["lens"], s["fstop"] = 60, 5.6
        s["ghost_rot"] = (0, 0, math.radians(lerp(-150, -96, t)))
        s["key"] = 150
        s["streak"] = 380 * math.sin(math.pi * clamp01((f - 6) / 58))
        s["streak_x"] = lerp(-3.4, 3.4, seg(f, 6, 64))
    elif f <= 150.75:  # 2 — pull back and swing round: meet the ghost
        t = seg(f, 76, 150, ease_out)
        s["ghost_loc"] = (0, 0, bob)
        s["ghost_rot"] = (0, 0, math.radians(lerp(46, -8, t)))
        s["cam"], s["aim"] = orbit((0, 0, -0.1), lerp(5.2, 12.5, t), lerp(-58, 8, t), lerp(1.5, 0.25, t),
                                   off=lerp(0, 2.0, t))
        s["focus"] = (0, -0.9, 0)
        s["lens"], s["fstop"] = 50, 2.8
    elif f <= 235.75:  # 3 — macro on the eyes
        t = seg(f, 151, 235)
        s["ghost_rot"] = (0, 0, math.radians(lerp(-22, -6, t)))
        s["cam"], s["aim"] = orbit((0.12, -0.8, -0.03), lerp(4.3, 3.7, t), lerp(26, -4, t), lerp(0.3, 0.02, t),
                                   off=0.42)
        s["focus"] = (0.3, -0.98, -0.05)
        s["lens"], s["fstop"] = 90, 3.2
        s["streak"] = 420 * math.sin(math.pi * clamp01((f - 165) / 57))
        s["streak_x"] = lerp(2.8, -2.8, seg(f, 165, 222))
        s["key"] = 520
    elif f <= 320.75:  # 4 — the file card
        t = seg(f, 236, 320)
        tin = seg(f, 236, 264, ease_out)
        s["ghost_loc"] = (-1.25, 0.45, bob)
        s["ghost_rot"] = (0, 0, math.radians(lerp(34, 14, t)))
        s["card_loc"] = (lerp(5.5, 0.95, tin), lerp(-3.5, -0.75, tin), lerp(-1.0, -0.02, tin) + 0.04 * math.sin(f / 15))
        s["card_rot"] = (math.radians(lerp(-50, -5, tin)), math.radians(lerp(70, 3, tin)),
                         math.radians(lerp(-90, 0, tin) + lerp(-20, -6, t)))
        s["cam"], s["aim"] = orbit((0, 0, -0.05), lerp(12.6, 11.4, t), lerp(-16, 10, t), lerp(0.9, 0.2, t), off=1.7)
        s["focus"] = (0.95, -0.8, 0)
        s["lens"], s["fstop"] = 50, 3.2
    elif f <= 405.75:  # 5 — the shield
        t = seg(f, 321, 405)
        tin = seg(f, 321, 352, ease_out)
        s["ghost_loc"] = (0, 0.35, 0.42 + bob * 0.6)
        s["ghost_rot"] = (0, 0, math.radians(lerp(18, -6, t)))
        s["shield_loc"] = (0, lerp(-9.0, -1.05, tin), lerp(-1.6, -0.72, tin))
        s["shield_rot"] = (math.radians(lerp(-60, 0, tin)), 0, math.radians(lerp(200, 0, tin) + lerp(14, -10, t)))
        s["shield_scale"] = 0.95
        s["cam"], s["aim"] = orbit((0, 0, -0.2), lerp(11.8, 10.8, t), lerp(24, -12, t), lerp(-0.3, 0.3, t), off=1.7)
        s["focus"] = (0, -1.1, -0.3)
        s["lens"], s["fstop"] = 50, 3.2
        s["streak"] = 520 * math.sin(math.pi * clamp01((f - 354) / 44))
        s["streak_x"] = lerp(-3, 3, seg(f, 354, 398))
    else:  # 6 — hero swing, settling front-on so the 3D ghost lands exactly on the logo
        t = seg(f, 406, 505)
        tin = seg(f, 406, 442, ease_out)
        s["ghost_loc"] = (0, 0, lerp(0.0, 0.22, t) + bob * (1 - t))
        s["ghost_rot"] = (0, 0, math.radians(lerp(-220, 0, seg(f, 406, 490, ease_out))))
        s["tile_loc"] = (0, lerp(9, 1.45, tin), 0)
        s["tile_scale"] = lerp(0.2, 1.0, tin)
        s["cam"], s["aim"] = orbit((0, 0, 0), lerp(15.0, 59.0, t), lerp(-46, 0, t), lerp(-2.2, 0.0, t),
                                   off=lerp(0, -7.57, t), zoff=lerp(0, -0.65, t))
        s["focus"] = (0, -1, 0)
        s["lens"], s["fstop"] = 85, lerp(2.8, 11, t)
        s["key"] = lerp(1100, 700, t)
        s["rim"] = lerp(1.0, 0.5, t)
    return s


def apply(f):
    s = state(f)
    ghost.location = s["ghost_loc"]
    ghost.rotation_euler = s["ghost_rot"]
    ghost.scale = (s["ghost_scale"],) * 3
    card.location = s["card_loc"]
    card.rotation_euler = s["card_rot"]
    shield.location = s["shield_loc"]
    shield.rotation_euler = s["shield_rot"]
    shield.scale = (s["shield_scale"],) * 3
    tile.location = s["tile_loc"]
    tile.scale = (s["tile_scale"],) * 3
    cam.location = s["cam"]
    look_at(cam, s["aim"])
    focus.location = s["focus"]
    cam_data.lens = s["lens"]
    cam_data.dof.aperture_fstop = s["fstop"]
    streak.location = (s["streak_x"], -3.0, 3.2)
    look_at(streak, (s["streak_x"] * 0.25, 0, 0))
    streak.data.energy = s["streak"]
    key.data.energy = s["key"]
    rim_r.data.energy = 2600 * s["rim"]
    rim_l.data.energy = 1500 * s["rim"]
    return s


CUTS = (75, 150, 235, 320, 405)


def bake(start, end):
    frames = [float(f) for f in range(start, end + 1)]
    frames += [c + 0.5 for c in CUTS if start <= c <= end]
    for f in sorted(frames):
        apply(f)
        for ob in (ghost, card, shield, tile, cam, focus, streak):
            ob.keyframe_insert("location", frame=f)
            ob.keyframe_insert("rotation_euler", frame=f)
        for ob in (ghost, shield, tile):
            ob.keyframe_insert("scale", frame=f)
        cam_data.keyframe_insert("lens", frame=f)
        cam_data.dof.keyframe_insert("aperture_fstop", frame=f)
        for li in (streak, key, rim_r, rim_l):
            li.data.keyframe_insert("energy", frame=f)


# ------------------------------------------------------------------ render settings
r = scene.render
engines = [e.identifier for e in type(r).bl_rna.properties["engine"].enum_items]
r.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100
r.film_transparent = False
ee = scene.eevee
for attr, val in (("taa_render_samples", 48), ("use_raytracing", True), ("use_shadows", True),
                  ("use_gtao", True), ("motion_blur_shutter", 0.5),
                  ("motion_blur_position", "START")):
    if hasattr(ee, attr):
        try:
            setattr(ee, attr, val)
        except Exception as ex:  # noqa: BLE001
            print("skip", attr, ex)
if hasattr(r, "use_motion_blur"):
    r.use_motion_blur = True
vs = scene.view_settings
vs.view_transform = "Standard"
try:
    vs.look = "Medium High Contrast"
except Exception:  # noqa: BLE001
    pass


def cut_frames():
    return (75, 150, 235, 320, 405)


if MODE == "still":
    frames = [int(x) for x in argv[1].split(",")]
    out = argv[2]
    scale = int(argv[3]) if len(argv) > 3 else 50
    r.resolution_percentage = scale
    r.image_settings.file_format = "PNG"
    r.use_motion_blur = False
    for f in frames:
        bake(max(1, f - 1), min(TOTAL, f + 1))
        scene.frame_set(f)
        r.filepath = os.path.join(out, f"s{f:04d}.png")
        bpy.ops.render.render(write_still=True)
elif MODE == "anim":
    out = argv[1]
    start = int(argv[2]) if len(argv) > 2 else 1
    end = int(argv[3]) if len(argv) > 3 else TOTAL
    bake(1, TOTAL)
    r.image_settings.file_format = "JPEG"
    r.image_settings.quality = 95
    r.filepath = os.path.join(out, "f")
    scene.frame_start, scene.frame_end = start, end
    bpy.ops.render.render(animation=True)
elif MODE == "save":
    bake(1, TOTAL)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(argv[1]))
print("ENGINE", r.engine, "DONE", MODE)
