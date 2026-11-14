# GhostCommits — V2 script (Blender product-ad style)

**Reference:** the AirPods ad in Rourke's "Claude Opus 5.5: How To Make Motion Graphics" (Level 3: Blender, 13:47 onward).
**Format:** 18 seconds · 16:9 (1920×1080) · 30 fps · 540 frames
**Audio:** music bed and sound effects only. No voiceover.
**Other versions:** `script.md` (V1, 2D Spotify style) and `script-60s-explainer.md`.

---

## 1. What makes the reference work

1. **A real 3D object as the star.** One glossy product, modelled and lit, not flat shapes.
2. **Black void.** No floor, no set. Only the product and the light on it.
3. **Macro close-ups.** The camera starts so close you cannot tell what you are looking at, then reveals it.
4. **Light as motion.** A streak of light races across the glossy surface; reflections of soft boxes slide as the object turns.
5. **Shallow depth of field and motion blur** on every move.
6. **Hard cuts between camera angles**, each shot one continuous camera move.
7. **Stat text in the lower left:** one big number or word, with a small caption under it ("2× more Active Noise Cancellation").
8. **Ends on the real thing.** The reference lands its last frame on real product footage. Ours lands the 3D ghost exactly on the real logo.

GhostCommits has no physical product, so the star is the logo's ghost, built as a 3D object.

---

## 2. The 3D cast

| Object    | What it is                                                                 | Material                              |
| --------- | -------------------------------------------------------------------------- | ------------------------------------- |
| Ghost     | The logo ghost in 3D: dome, straight body, scalloped hem, two eyes. Same proportions as `public/ghost.svg`. | Glossy red `#ef233c` with a clear coat; glossy black eyes |
| File card | A dark slab with glowing bars for code lines (one red) and a white button  | Dark `#111114` with emissive bars     |
| Shield    | A thick bevelled shield with a glowing red inner outline                   | Deep glossy red-black                 |
| Logo tile | The logo's rounded square, as a slab with a glowing red rim                | Dark red-black `#14070a`              |

## 3. Lighting

- **Key:** one large soft box, upper left front, white.
- **Rims:** two red lights behind the subject, left and right, for the red edge glow.
- **Fill:** weak, front right.
- **Streak:** a long thin light that sweeps across in shots 1, 3 and 5.
- **World:** near black.

---

## 4. Storyboard

### Shot 1 — Macro on the dome · 0:00–0:02.5 · frames 1–75

**Camera:** very close on the top of the ghost, orbiting slowly. You see only curved red gloss.
**Light:** the streak races left to right across the surface.
**Text:** none.
**Sound:** low swell, a sharp glint as the streak passes.

### Shot 2 — Meet the ghost · 0:02.5–0:05 · frames 76–150

**Camera:** cuts wide, then pulls back and swings round as the ghost turns to face us. Ghost settles right of centre.
**Text:** **Meet your Ghost.** — A signing key made in your browser.
**Sound:** whoosh on the swing, soft hit as it settles.

### Shot 3 — The eyes · 0:05–0:07.8 · frames 151–235

**Camera:** macro on the two glossy black eyes, drifting across the face.
**Light:** the streak passes right to left; the soft box reflects in each eye.
**Text:** **0** — personal GitHub logins needed.
**Sound:** quiet, one glint.

### Shot 4 — The file · 0:07.8–0:10.7 · frames 236–320

**Camera:** medium shot, slow orbit.
**Action:** a dark file card tumbles in from the right and settles upright beside the ghost.
**Text:** **1 file** — per contribution, opened as a bot-authored PR.
**Sound:** tumbling whoosh, a click as it lands.

### Shot 5 — The shield · 0:10.7–0:13.5 · frames 321–405

**Camera:** medium shot, orbiting the other way.
**Action:** a shield spins in from the front and stops below the ghost's eyes, so the ghost looks out over it.
**Light:** the streak crosses the shield.
**Text:** **Shielded** — Zcash testnet rewards. Sender, recipient and amount stay hidden.
**Sound:** heavy whoosh, a lock click.

### Shot 6 — Hero to logo · 0:13.5–0:18 · frames 406–540

**Camera:** starts low and to the side, then swings round and pulls far back until it is exactly front-on.
**Action:** the logo tile rushes in behind the ghost. The ghost spins once and stops facing forward. The pair settle on the left of frame at exactly the size and place of the 2D logo.
**Text (from frame 494):**

- **GhostCommits.**
- Public code. Your own identity.
- `ghostcommits.netlify.app` · Zcash testnet MVP

**Sound:** rising whoosh into a final soft hit; music tail.

---

## 5. Timing sheet

| # | Shot           | Start  | End    | Frames  | Text                                   |
| - | -------------- | ------ | ------ | ------- | -------------------------------------- |
| 1 | Macro on dome  | 0:00.0 | 0:02.5 | 1–75    | —                                      |
| 2 | Meet the ghost | 0:02.5 | 0:05.0 | 76–150  | Meet your Ghost.                       |
| 3 | The eyes       | 0:05.0 | 0:07.8 | 151–235 | 0 personal GitHub logins needed.       |
| 4 | The file       | 0:07.8 | 0:10.7 | 236–320 | 1 file per contribution.               |
| 5 | The shield     | 0:10.7 | 0:13.5 | 321–405 | Shielded Zcash testnet rewards.        |
| 6 | Hero to logo   | 0:13.5 | 0:18.0 | 406–540 | GhostCommits. Public code. Your own identity. |

---

## 6. How it is built

| Step            | Tool                     | File                                   |
| --------------- | ------------------------ | -------------------------------------- |
| 3D scene, lights, camera moves | Blender 5.3, driven by one Python script, no manual modelling | `video/blender/ghost_scene.py` |
| Rendered frames | Blender EEVEE, 1920×1080 with depth of field and motion blur | `video/public/v2/f0001.jpg` … `f0540.jpg` |
| Text overlay and final encode | Remotion | `video/src/GhostAdV2.tsx` |
| Editable scene  | Blender file             | `video/blender/ghost.blend`            |

Re-render the 3D frames (from `video/blender`):

```
blender -b --factory-startup -P ghost_scene.py -- anim ../public/v2
```

Re-encode the video (from `video`):

```
npx remotion render GhostCommitsAdV2 out/ghostcommits-ad-v2.mp4
```

---

## 7. Claims to keep honest

- "0 personal GitHub logins" refers to the contributor. Maintainers do sign in with GitHub.
- "testnet" appears in shot 5 and on the end card. Testnet ZEC has no monetary value.
- "Hidden" describes what a shielded Zcash transaction shows on-chain. The operator and maintainer can still see the reward address and claim, so nothing says "anonymous".
- Nothing says "paid" or "confirmed", and there are no user counts or testimonials.
