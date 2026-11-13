# 3D product-ad style in Blender (headless, scripted)

No manual modelling: one Python script (`../examples/ghostcommits/ghost_scene.py`, Blender 4.2+/5.x)
builds geometry, materials, lights and camera, keyframes per frame, and renders.

Run: `blender -b --factory-startup -P scene.py -- <mode> <out>`
- `still <dir> f1 f2 …` render chosen frames to check looks (do this first, view the PNGs)
- `anim <dir>` render all frames as `f0001.jpg …` into Remotion's `public/`
- `save <file.blend>` save the scene for hand-tweaking in the Blender UI

The look (what makes it read as "Apple ad")
1. One hero object; build it from primitives + modifiers (subdivision, bevel, solidify) matching the logo's proportions.
2. Black world (strength ≈ 0), no floor.
3. Lights: big soft area key upper-left, two coloured rim lights behind, weak fill, plus a long thin
   "streak" area light animated across the object for glints.
4. Materials: Principled BSDF, low roughness (0.15–0.3), clear coat 1.0 for car-paint gloss; emissive bars for UI.
5. Camera: 50–100 mm, depth of field on (f/2.8–4, focus on the hero), motion blur on.
6. Hard cuts: each shot is its own continuous camera move; compute camera state as a pure function
   `state(frame)` and key every frame (`bake(start,end)`) — no fighting with F-curves.
7. Last shot: hero settles exactly where the 2D logo sits on the end card so Remotion text lines up.

Engine: EEVEE (`BLENDER_EEVEE_NEXT` or `BLENDER_EEVEE` depending on version) at 1920×1080,
~64 samples: a few seconds per frame on a laptop GPU. 540 frames ≈ 20–40 min — run in background.
Output JPEG quality 92 to keep `public/` small; gitignore it.

Gotchas
- Socket names differ between versions ("Coat Weight" vs "Clearcoat"): set inputs by trying a list of names.
- Use `--factory-startup` so user add-ons/prefs don't change results.
- Check stills from every shot before the full render; fix framing there, it's 100× cheaper.
