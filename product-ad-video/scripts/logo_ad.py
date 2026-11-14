"""Turn any SVG logo into a glossy 3D product ad, headless in Blender 4.2+.

  blender -b --factory-startup -P logo_ad.py -- ad.json still <out_dir> [frames=auto] [scale%=50]
  blender -b --factory-startup -P logo_ad.py -- ad.json anim  <out_dir> [start end]
  blender -b --factory-startup -P logo_ad.py -- ad.json save  <file.blend>

Reads the logo, colours, aspect and shot count from ad.json, so the camera cuts line up with
the Remotion text overlay (template/src/styles/Apple3D.tsx). Writes f0001.jpg ... into out_dir.

Logo rules: filled shapes only (convert strokes/text to paths first); gradients become their
first colour; each SVG shape becomes a layer, later shapes sit slightly in front.
"""
import math
import os
import sys

import addon_utils
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import adspec  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:]
AD = adspec.load(argv[0])
MODE = argv[1]
TOTAL = AD["_total"]
W, H = AD["_size"]
VERTICAL = H > W
N = len(AD["shots"])
STARTS = AD["_shot_starts"]
END_START = AD["_end_start"]
CUTS = [s - 1 for s in STARTS] + [END_START - 1]


# ------------------------------------------------------------------ helpers
def srgb(hex_):
    hex_ = hex_.lstrip("#")
    c = [int(hex_[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c) + (1.0,)


def set_input(node, names, value):
    for n in names:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return


def glossy(name, color, rough=0.2, metallic=0.0, coat=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    set_input(b, ["Base Color"], color)
    set_input(b, ["Roughness"], rough)
    set_input(b, ["Metallic"], metallic)
    set_input(b, ["Coat Weight", "Coat", "Clearcoat"], coat)
    set_input(b, ["Coat Roughness", "Clearcoat Roughness"], 0.04)
    return m


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def seg(f, a, b, e=ease):
    return e((f - a) / (b - a)) if b != a else 0.0


def lerp(a, b, t):
    return a + (b - a) * t


def clamp01(x):
    return max(0.0, min(1.0, x))


# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, TOTAL
scene.render.fps = adspec.FPS


def build_hero(svg_path, size=2.4, depth=0.34, step=0.1):
    """Import the SVG, extrude every shape, stack later shapes in front, centre it, face -Y."""
    addon_utils.enable("io_curve_svg", default_set=True)
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg_path)
    shapes = [o for o in bpy.data.objects if o not in before and o.type == "CURVE"]
    if not shapes:
        raise SystemExit(f"No filled shapes found in {svg_path}")
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in shapes for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), 0))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), 0))
    centre = (lo + hi) / 2
    s = size / max(hi.x - lo.x, hi.y - lo.y)

    hero = link(bpy.data.objects.new("Hero", None))
    pivot = link(bpy.data.objects.new("LogoPivot", None))  # flat SVG plane -> upright, facing the camera
    pivot.parent = hero
    pivot.rotation_euler = (math.radians(90), 0, 0)
    pivot.scale = (s, s, s)
    accent_only = AD.get("logo_colors") == "accent"
    for i, o in enumerate(shapes):
        mw = o.matrix_world.copy()
        for col in list(o.users_collection):
            col.objects.unlink(o)
        link(o)
        o.parent = pivot
        o.matrix_parent_inverse.identity()
        o.matrix_basis = mw
        o.location = (o.location.x - centre.x, o.location.y - centre.y, (i * step) / s)
        cu = o.data
        cu.dimensions = "2D"
        cu.fill_mode = "BOTH"
        cu.extrude = (depth / 2 - 0.03 * min(i, 1)) / s
        cu.bevel_depth = 0.035 / s
        cu.bevel_resolution = 4
        cu.resolution_u = 24
        old = o.active_material
        c = old.diffuse_color if old is not None else srgb(AD["colors"]["accent"])
        if accent_only and i > 0:
            c = srgb(AD["colors"]["accent"])
        lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
        mat = glossy(f"Logo{i}", (c[0], c[1], c[2], 1), rough=0.16 if lum > 0.02 else 0.12)
        cu.materials.clear()
        cu.materials.append(mat)
    # thickness centred on the hero origin
    pivot.location = (0, (len(shapes) - 1) * step / 2, 0)
    return hero


hero = build_hero(adspec.rel(AD, AD.get("logo", "public/logo.svg")))


# ------------------------------------------------------------------ lights (rims take the brand accent)
def area(name, loc, target, size, power, color=(1, 1, 1), size_y=None):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = power
    li.color = color
    li.size = size
    if size_y:
        li.shape = "RECTANGLE"
        li.size_y = size_y
    ob = link(bpy.data.objects.new(name, li))
    ob.location = loc
    look_at(ob, target)
    return ob


acc = srgb(AD["colors"]["accent"])[:3]
mx = max(acc) or 1
rim_col = tuple(0.25 + 0.75 * c / mx for c in acc)
key = area("Key", (-3.2, -4.5, 4.2), (0, 0, 0), 4.5, 1100)
fill = area("Fill", (4.5, -5, -0.5), (0, 0, 0), 5, 160)
rim_r = area("RimRight", (4.2, 4.5, 2.2), (0, 0, 0), 3, 2400, rim_col)
rim_l = area("RimLeft", (-4.6, 3.8, -0.4), (0, 0, 0), 3, 1400, rim_col)
streak = area("Streak", (0, -3.2, 3), (0, 0, 0), 0.22, 0, (1, 1, 1), size_y=7)

world = bpy.data.worlds.new("Void")
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.0015, 0.0013, 0.0014, 1)
scene.world = world

cam_data = bpy.data.cameras.new("Cam")
cam = link(bpy.data.objects.new("Cam", cam_data))
focus = link(bpy.data.objects.new("Focus", None))
scene.camera = cam
cam_data.dof.use_dof = True
cam_data.dof.focus_object = focus
cam_data.sensor_width = 36
cam_data.sensor_fit = "AUTO"  # 36 mm across the longer side


# ------------------------------------------------------------------ choreography
def view_size(r, lens):
    """Visible (width, height) in scene units at distance r."""
    long_side = 36 / lens * r
    return (long_side, long_side * H / W) if W >= H else (long_side * W / H, long_side)


def framed(r, lens, deg, h, subject=(0, 0, 0), side=1.0):
    """Camera on a circle round the hero, shifted so the hero clears the text block.
    Landscape: text lower-left, hero right of centre. Vertical/square: text at the bottom, hero high."""
    vw, vh = view_size(r, lens)
    off = 0.2 * vw * side if W > H else 0.0
    zoff = 0.0 if W > H else -0.17 * vh * side
    a = math.radians(deg)
    right = (math.cos(a), math.sin(a))
    cx = subject[0] + r * math.sin(a) - right[0] * off
    cy = subject[1] - r * math.cos(a) - right[1] * off
    aim = (subject[0] - right[0] * off, subject[1] - right[1] * off, subject[2] + zoff)
    return (cx, cy, subject[2] + h + zoff), aim


def streak_pass(s, f, a, b, power, left_to_right=True):
    s["streak"] = power * math.sin(math.pi * clamp01((f - a) / (b - a)))
    x0, x1 = (-3.4, 3.4) if left_to_right else (3.4, -3.4)
    s["streak_x"] = lerp(x0, x1, seg(f, a, b))


def shot_move(kind, f, a, b, s):
    """Four reusable camera moves for the stat shots; they cycle A B C D A ..."""
    t = seg(f, a, b)
    bob = 0.05 * math.sin(f / 22)
    if kind == 0:  # A: swing round as the hero turns to face us
        t = seg(f, a, b, ease_out)
        s["rot"] = (0, 0, math.radians(lerp(50, -8, t)))
        s["loc"] = (0, 0, bob)
        r = lerp(9.5, 12.5, t)
        s["cam"], s["aim"] = framed(r, 50, lerp(-50, 6, t), lerp(1.4, 0.25, t))
        s["lens"], s["fstop"], s["focus"] = 50, 2.8, (0, -0.3, 0)
    elif kind == 1:  # B: macro along the bevel, light streak crosses (text gets a scrim)
        s["rot"] = (0, 0, math.radians(lerp(-28, -12, t)))
        s["cam"], s["aim"] = framed(lerp(4.6, 4.0, t), 85, lerp(28, 2, t), lerp(0.5, 0.1, t),
                                    subject=(0.6, -0.2, 0.35), side=0.6)
        s["lens"], s["fstop"], s["focus"] = 85, 3.2, (0.7, -0.3, 0.3)
        s["key"] = 520
        streak_pass(s, f, a + 12, b - 10, 440, left_to_right=False)
    elif kind == 2:  # C: low hero angle, slow orbit, looking up
        s["rot"] = (math.radians(-8), 0, math.radians(lerp(24, 4, t)))
        s["loc"] = (0, 0, bob)
        s["cam"], s["aim"] = framed(lerp(12.8, 11.4, t), 50, lerp(-20, 14, t), lerp(-2.0, -1.2, t))
        s["lens"], s["fstop"], s["focus"] = 50, 3.2, (0, -0.3, 0)
    else:  # D: from above as the hero tips upright, streak across the face
        tin = seg(f, a, a + 34, ease_out)
        s["rot"] = (math.radians(lerp(-55, 0, tin)), 0, math.radians(lerp(-14, 10, t)))
        s["loc"] = (0, 0, bob)
        s["cam"], s["aim"] = framed(lerp(11.8, 10.8, t), 50, lerp(18, -10, t), lerp(3.0, 1.4, t))
        s["lens"], s["fstop"], s["focus"] = 50, 3.2, (0, -0.3, 0)
        streak_pass(s, f, a + 30, b - 8, 520)


def state(f):
    s = {"loc": (0, 0, 0), "rot": (0, 0, 0), "cam": (0, -12, 0), "aim": (0, 0, 0), "focus": (0, -0.3, 0),
         "lens": 50, "fstop": 4.0, "streak": 0.0, "streak_x": 0.0, "key": 1100, "rim": 1.0}
    if f < (STARTS[0] if N else END_START):  # hook: macro across the face, streak races over
        t = seg(f, 1, adspec.HOOK)
        s["rot"] = (0, 0, math.radians(lerp(-38, -18, t)))
        r = lerp(3.4, 3.9, t)
        a = math.radians(lerp(-40, 22, t))
        s["cam"] = (0.35 + r * math.sin(a), -r * math.cos(a), lerp(1.1, 0.7, t))
        s["aim"] = (0.35, 0, 0.45)
        s["focus"] = (0.4, -0.25, 0.55)
        s["lens"], s["fstop"], s["key"] = 60, 5.6, 160
        streak_pass(s, f, 6, 64, 380)
        return s
    for i in range(N - 1, -1, -1):
        if f >= STARTS[i] and f < (STARTS[i + 1] if i + 1 < N else END_START):
            shot_move(i % 4, f, STARTS[i], (STARTS[i + 1] if i + 1 < N else END_START) - 1, s)
            return s
    # end: one spin, settle front-on, centred high so the end-card text sits underneath
    t = seg(f, END_START, END_START + 95)
    lens = 85
    vw, vh = view_size(1, lens)
    target_h = 0.3 if W > H else 0.22   # hero height as a share of the frame height
    r_end = 2.4 / (target_h * vh)
    zoff_end = -0.12 * vh * r_end
    s["rot"] = (0, 0, math.radians(lerp(-330, 0, seg(f, END_START, END_START + 80, ease_out))))
    r = lerp(r_end * 0.45, r_end, t)
    a = math.radians(lerp(-46, 0, t))
    z = lerp(-1.6, 0, t) + zoff_end * t
    s["cam"] = (r * math.sin(a), -r * math.cos(a), z)
    s["aim"] = (0, 0, zoff_end * t)
    s["focus"] = (0, -0.3, 0)
    s["lens"], s["fstop"] = lens, lerp(2.8, 11, t)
    s["key"], s["rim"] = lerp(1100, 750, t), lerp(1.0, 0.55, t)
    return s


def apply(f):
    s = state(f)
    hero.location = s["loc"]
    hero.rotation_euler = s["rot"]
    cam.location = s["cam"]
    look_at(cam, s["aim"])
    focus.location = s["focus"]
    cam_data.lens = s["lens"]
    cam_data.dof.aperture_fstop = s["fstop"]
    streak.location = (s["streak_x"], -3.0, 3.2)
    look_at(streak, (s["streak_x"] * 0.25, 0, 0))
    streak.data.energy = s["streak"]
    key.data.energy = s["key"]
    rim_r.data.energy = 2400 * s["rim"]
    rim_l.data.energy = 1400 * s["rim"]


def bake(start, end):
    frames = [float(f) for f in range(start, end + 1)]
    frames += [c + 0.5 for c in CUTS if start <= c <= end]  # hard cuts: no motion blur smear across shots
    for f in sorted(frames):
        apply(f)
        for ob in (hero, cam, focus, streak):
            ob.keyframe_insert("location", frame=f)
            ob.keyframe_insert("rotation_euler", frame=f)
        cam_data.keyframe_insert("lens", frame=f)
        cam_data.dof.keyframe_insert("aperture_fstop", frame=f)
        for li in (streak, key, rim_r, rim_l):
            li.data.keyframe_insert("energy", frame=f)


# ------------------------------------------------------------------ render settings
r = scene.render
engines = [e.identifier for e in type(r).bl_rna.properties["engine"].enum_items]
r.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
ee = scene.eevee
for attr, val in (("taa_render_samples", 48), ("use_raytracing", True), ("use_shadows", True),
                  ("use_gtao", True), ("motion_blur_shutter", 0.5), ("motion_blur_position", "START")):
    if hasattr(ee, attr):
        try:
            setattr(ee, attr, val)
        except Exception as ex:  # noqa: BLE001
            print("skip", attr, ex)
if hasattr(r, "use_motion_blur"):
    r.use_motion_blur = True
scene.view_settings.view_transform = "Standard"
try:
    scene.view_settings.look = "Medium High Contrast"
except Exception:  # noqa: BLE001
    pass

if MODE == "still":
    out = os.path.abspath(argv[2])  # Blender resolves relative paths oddly; pin it
    auto = [40] + [s + 40 for s in STARTS] + [TOTAL - 5]
    frames = auto if len(argv) < 4 or argv[3] == "auto" else [int(x) for x in argv[3].split(",")]
    r.resolution_percentage = int(argv[4]) if len(argv) > 4 else 50
    r.image_settings.file_format = "PNG"
    r.use_motion_blur = False
    bake(1, TOTAL)
    for f in frames:
        scene.frame_set(f)
        r.filepath = os.path.join(out, f"s{f:04d}.png")
        bpy.ops.render.render(write_still=True)
elif MODE == "anim":
    out = os.path.abspath(argv[2])  # Blender resolves relative paths oddly; pin it
    bake(1, TOTAL)
    r.image_settings.file_format = "JPEG"
    r.image_settings.quality = 92
    r.filepath = os.path.join(out, "f")
    scene.frame_start = int(argv[3]) if len(argv) > 3 else 1
    scene.frame_end = int(argv[4]) if len(argv) > 4 else TOTAL
    bpy.ops.render.render(animation=True)
elif MODE == "save":
    bake(1, TOTAL)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(argv[2]))
print("ENGINE", r.engine, "FRAMES", TOTAL, "DONE", MODE)
