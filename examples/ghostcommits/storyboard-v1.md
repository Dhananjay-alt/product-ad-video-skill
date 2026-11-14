# GhostCommits — motion graphic script (Spotify-ad style)

**Reference:** the Spotify ad in Rourke's "Claude Opus 5.5: How To Make Motion Graphics" (Level 1, 2:02–8:43).
**Format:** 20 seconds · 16:9 (1920×1080) · 30 fps · 600 frames
**Audio:** music bed and sound effects only. No voiceover.
**Earlier version:** the 60-second voiceover explainer is kept in `script-60s-explainer.md`.

---

## 1. What makes the reference work

These are the rules taken from the Spotify ad. The GhostCommits video follows all of them.

1. **One hero shape, never cut away from.** The Spotify logo circle becomes a rounded square, which becomes an album cover, which becomes a Now Playing card, which becomes one tile in a wall of tiles, and finally becomes the logo again.
2. **Every shot transforms into the next.** No cross dissolves, no hard cuts. A shape in shot N is the starting shape of shot N+1.
3. **Dark stage, one brand-colour glow.** Near-black background with a large soft radial glow in the brand colour that drifts slowly. Nothing else in the background.
4. **Very few words.** One short line per shot, bold white sans-serif, centred or directly under the hero. Three to four words.
5. **Real UI, simplified.** Cards are rebuilt from real product screens, not invented. Light 3D: cards tilt, flip and sit in a perspective grid.
6. **Logo opens and closes.** Shot 1 is the logo arriving in the dark; the last shot is logo, wordmark and one call to action.
7. **Sound sells the motion.** Each transform gets one sound effect (whoosh, pop, click, morph) over a music bed.
8. **Eight shots, about two and a half seconds each.**

The reference's storyboard, for comparison:

| # | Spotify shot       | GhostCommits equivalent     |
| - | ------------------ | --------------------------- |
| 1 | Logo in the dark   | Ghost in the dark           |
| 2 | Music for everyone | Build in public. Stay private. |
| 3 | Now Playing card builds | Submission card builds  |
| 4 | Millions of songs  | Wall of open bounties       |
| 5 | Made for you       | Bot-authored PR, merged     |
| 6 | Release Radar      | Shielded reward             |
| 7 | Logo returns       | Ghost returns               |
| 8 | Your sound. Your Spotify. | Public code. Your own identity. |

---

## 2. Visual system

### Stage

- Background `#09090b`.
- One radial glow, `#ef233c` at roughly 35% opacity fading to transparent, about 1100 px wide, sitting behind the hero. It drifts a few dozen pixels over the whole video and brightens slightly on each transform.
- A second, much fainter glow in `#fa5268` offset to one side for depth.
- No stars, particles, grid lines or mesh.

### Colour

| Use                | Value                       |
| ------------------ | --------------------------- |
| Background         | `#09090b`                   |
| Card surface       | `#111114`                   |
| Card border        | `#29292f`, strong `#46464f` |
| Text               | `#f5f5f7`                   |
| Secondary text     | `#b0b0ba`                   |
| Hero red           | `#ef233c`                   |
| Accent red         | `#fa5268`                   |
| Logo tile gradient | `#1f0609` → `#0a0203`       |
| Merged / verified  | `#6edbb0`                   |
| Pending            | `#efc078`                   |

### Type

- **Inter**, weight 700 for shot lines, 96 px at 1080p, tight tracking (−2%).
- Monospace (SF Mono / Consolas) only for code, the address and the transaction ID.
- Wordmark: "Ghost" in `#f5f5f7`, "Commits" in `#fa5268`.

### Motion

- Transforms take 500–700 ms with a spring-like ease: `cubic-bezier(0.23, 1, 0.32, 1)`, slight overshoot on scale.
- Text enters 150 ms after its shape settles: rise 20 px and fade in over 300 ms; exits by fading as the next transform starts.
- Cards have 16–24 px corner radius, a 1 px border and a soft drop shadow so they lift off the glow.
- 3D is light: maximum tilt about 25°, perspective around 1400 px.

### The hero

The red ghost from `public/ghost.svg`: a rounded dome with a three-point scalloped hem and two black eyes. It is the shape that carries through every shot.

---

## 3. Storyboard

### Shot 1 — Ghost in the dark · 0:00–0:02.5 · frames 0–75

**Frame:** Black. A red dot appears centre and blooms into a red circle. The glow rises behind it. The bottom of the circle drops and cuts into the ghost's scalloped hem; the two eyes pop in one after the other.

**Text:** none.

**Sound:** low swell, then two soft pops for the eyes.

**Transforms into shot 2 by:** the ghost sliding up about 120 px to make room for the line.

---

### Shot 2 — The promise · 0:02.5–0:05 · frames 75–150

**Frame:** Ghost in the upper centre, glow behind it. The line rises in beneath.

**Text:** **Build in public. Stay private.**

**Sound:** soft whoosh as the line lands.

**Transforms into shot 3 by:** the text fading while the ghost's hem flattens and its dome squares off, becoming a red rounded square (the same move as the Spotify circle becoming a square).

---

### Shot 3 — Submission card builds · 0:05–0:08 · frames 150–240

**Frame:** The red square tilts in 3D and flips. Its back face is a dark file card. The card grows taller and builds itself piece by piece:

1. filename tab in monospace: `README.md`
2. four lines of code, typing on, one highlighted in red
3. a small ghost avatar and the label `Ghost #a1b2`
4. a solid white button: **Create GitHub PR**

The eyes of the ghost stay visible as the avatar, so the hero is still on screen.

**Text:** **One file. No GitHub login.**

**Sound:** morph on the flip, light ticks as lines type, a click on the button.

**Transforms into shot 4 by:** the camera pulling back. The card shrinks and settles into a slot in a grid.

---

### Shot 4 — Wall of bounties · 0:08–0:11 · frames 240–330

**Frame:** A tilted perspective grid of bounty cards filling the frame and drifting slowly on a diagonal, exactly like the reference's wall of playlists. Our card is the one in the centre, with a red border. Each card shows a short task title, a repository name in monospace and a reward tag.

Card titles are generic examples only: "Fix README example", "Clarify install step", "Repair one function", "Update usage docs". Reward tags read `0.01 ZEC · testnet`.

**Text:** **Pick a bounty.**

**Sound:** wide whoosh on the pull-back, low hum under the drift.

**Transforms into shot 5 by:** the centre card pushing forward out of the grid toward the camera while the others fall back and blur into the glow.

---

### Shot 5 — Merged · 0:11–0:13.5 · frames 330–405

**Frame:** The card arrives centre and its contents swap in place to a pull-request card: title, a bot author badge, the ghost avatar. A status pill reads **Open** in amber. The pill flips to **Merged** in green with a small pulse. This is the only green in the video.

**Text:** **Reviewed. Merged.**

**Sound:** rising tick, then a bright confirm tone on the flip.

**Transforms into shot 6 by:** the green pill stretching sideways into a long horizontal bar while the rest of the card folds away behind it.

---

### Shot 6 — Shielded reward · 0:13.5–0:16.5 · frames 405–495

**Frame:** The bar becomes a transaction row with four fields: sender, recipient, amount, transaction ID. Three solid redaction bars slam across sender, recipient and amount, one at a time. Only the transaction ID stays readable, in monospace: `d7d9b789…8e54`. A red shield outline draws around the whole row and closes.

A small `testnet` tag sits at the corner of the row.

**Text:** **Rewarded in shielded Zcash.**

**Sound:** three hard thuds for the redaction bars, then a lock click as the shield closes.

**Transforms into shot 7 by:** the row shrinking to nothing inside the shield, leaving the shield shape alone.

---

### Shot 7 — Ghost returns · 0:16.5–0:18 · frames 495–540

**Frame:** The shield outline fills solid red. Its pointed base splits into the three scallops of the hem and its top rounds into the dome. The two eyes pop back in. The ghost is back, centre, with the glow at its brightest.

**Text:** none.

**Sound:** reverse whoosh into two soft pops (the same pops as shot 1).

**Transforms into shot 8 by:** the dark logo tile growing out from behind the ghost, then the pair sliding left.

---

### Shot 8 — End card · 0:18–0:20 · frames 540–600

**Frame:** Logo tile on the left, wordmark typing on to its right. Tagline beneath. URL small at the bottom, as in the reference's "On the App Store now" line.

**Text:**

- **GhostCommits**
- Public code. Your own identity.
- `ghostcommits.netlify.app` · Zcash testnet MVP

**Sound:** final soft hit; music tail fades out.

**Hold** the last frame for at least one second.

---

## 4. Timing sheet

| # | Shot                    | Start  | End    | Frames  | On-screen line                 |
| - | ----------------------- | ------ | ------ | ------- | ------------------------------ |
| 1 | Ghost in the dark       | 0:00.0 | 0:02.5 | 0–75    | —                              |
| 2 | The promise             | 0:02.5 | 0:05.0 | 75–150  | Build in public. Stay private. |
| 3 | Submission card builds  | 0:05.0 | 0:08.0 | 150–240 | One file. No GitHub login.     |
| 4 | Wall of bounties        | 0:08.0 | 0:11.0 | 240–330 | Pick a bounty.                 |
| 5 | Merged                  | 0:11.0 | 0:13.5 | 330–405 | Reviewed. Merged.              |
| 6 | Shielded reward         | 0:13.5 | 0:16.5 | 405–495 | Rewarded in shielded Zcash.    |
| 7 | Ghost returns           | 0:16.5 | 0:18.0 | 495–540 | —                              |
| 8 | End card                | 0:18.0 | 0:20.0 | 540–600 | Public code. Your own identity. |

---

## 5. The transform chain

Read top to bottom; each arrow is one continuous morph with no cut.

```
red dot
  → red circle
  → ghost                      (hem drops, eyes pop)
  → red rounded square         (hem flattens, dome squares off)
  → file card                  (3D flip)
  → submission card            (builds line by line)
  → one tile in a bounty grid  (camera pulls back)
  → pull-request card          (tile pushes forward, contents swap)
  → green "Merged" pill        (status flips)
  → transaction row            (pill stretches)
  → redacted row in a shield   (bars slam, shield closes)
  → shield
  → ghost                      (base splits into hem, eyes pop)
  → logo tile + wordmark
```

---

## 6. Sound design

| Moment                    | Effect                         |
| ------------------------- | ------------------------------ |
| Dot blooms                | Low swell                      |
| Eyes appear (shots 1, 7)  | Two soft pops                  |
| Text lands                | Short soft whoosh              |
| Ghost to square, 3D flip  | Tech morph                     |
| Code lines typing         | Light ticks                    |
| Button                    | Interface click                |
| Pull back to grid         | Wide whoosh                    |
| Card pushes forward       | Screen slide                   |
| Merged                    | Bright confirm tone            |
| Redaction bars            | Three hard thuds               |
| Shield closes             | Lock click                     |
| End card                  | Soft hit, music tail           |

Music: one minimal electronic bed, around 100–110 BPM, with a clear downbeat to land shots 3, 5 and 6 on.

---

## 7. Ingredients folder

The reference workflow gives Claude a folder of real assets before any animation. For this video:

| File                                   | Status      | Used in         |
| -------------------------------------- | ----------- | --------------- |
| `public/ghost.svg`                     | In the repo | Shots 1, 2, 7, 8 |
| Screenshot: bounty view                | To capture  | Shot 4 card layout |
| Screenshot: "Meet your Ghost" / submit form | To capture | Shot 3 card layout |
| Screenshot: contribution lifecycle     | To capture  | Shot 5 status pill |
| `docs/assets/noir-wallet-transfer.png` | In the repo | Shot 6 reference for the transaction row |

Capture the three screenshots from the live app at `ghostcommits.netlify.app` so the cards match the real product. The two violet README illustrations are not used.

---

## 8. Claims to keep honest

- "No GitHub login" means no **personal** GitHub login for the contributor. Never say "anonymous".
- The `testnet` tag stays visible in shot 6 and on the end card. Testnet ZEC has no monetary value.
- Do not show "Paid" or "Confirmed". The video shows a shielded transfer and a transaction ID, nothing more.
- Bounty cards in shot 4 are generic examples. No user counts, star counts, leaderboards or testimonials.
- The transaction ID in shot 6 is the real one: `d7d9b789f4db2fbd33db1defd27e8efcab4b62aa7506464230a0969485898e54`, block 4,582,798, 0.01 ZEC (testnet).
