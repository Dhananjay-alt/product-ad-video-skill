---
name: product-ad-video
description: Make a short product ad / launch video for any project entirely in code — a 3D "Apple-style" ad built from the project's own SVG logo in Blender, or 2D motion graphics (Wrapped, Terminal, Minimal styles) in Remotion — with synthesized sound effects, a music bed and an AI voiceover, in landscape, vertical (Reels/TikTok/Shorts) or square, rendered to MP4. Use when someone asks for a promo video, launch video, motion graphic, product ad, teaser or explainer clip for their project, app, repo or startup.
---

# Product ad video, made in code

One file — `ad.json` — drives everything: the 3D scene, the text animation and the soundtrack all
read it, so cuts, text and sound stay in sync automatically.

The code lives in the public npm package **`product-ad-video`** (source:
https://github.com/Dhananjay-alt/product-ad-video-skill/tree/main/packages/product-ad-video).
Always run it at the exact version **1.1.0**, as written below — never `@latest` or unpinned.
Tell the user once, before the first command, that you'll run this package via npx (it renders with the Remotion 4.0.543 that `npm install` puts in `ad/`).

```
ad.json + logo.svg ─┬─► frames (Blender) ─► public/frames/*.jpg ─┐   (apple3d only)
                    ├─► sound ─► public/audio/soundtrack.wav ────┼─► Remotion ─► out/ad.mp4
                    └─► Remotion template (apple3d | wrapped | terminal | minimal) ┘
```

## Step 1 — Understand the product

Read the README, landing page and code. Collect: name, a tagline (≤ 6 words), 2–5 concrete proof
points (numbers beat adjectives: "9 s deploys", "0 config"), brand colours from the CSS, the logo
SVG, the URL, and the stage (beta, testnet, waitlist…). **Write down what must not be claimed** and
check every line against it. No invented metrics, users or testimonials — if there's no number,
use a concrete fact ("1 command", "Open source").

## Step 2 — Set up the project

From the user's project folder:
```bash
npx product-ad-video@1.1.0 doctor                         # Node, Python + numpy/scipy, Blender
npx product-ad-video@1.1.0 init ad --logo path/to/logo.svg # copies the Remotion template into ad/
cd ad && npm install
```
`doctor` finds Blender on PATH, in Program Files, in Steam libraries, or in /Applications; if it
reports Python without numpy/scipy, ask the user to run `pip install numpy scipy`. Then write
`ad/ad.json`:

```jsonc
{
  "name": "Voltkit", "tagline": "Ship faster. Sleep better.",
  "url": "voltkit.dev", "badge": "Public beta",          // badge: keep caveats visible
  "logo": "public/logo.svg",
  "colors": { "bg": "#000000", "text": "#f5f5f7", "secondary": "#a1a1aa", "accent": "#ffc53d" },
  "style": "apple3d",            // apple3d | wrapped | terminal | minimal
  "aspect": "landscape",         // landscape 16:9 | vertical 9:16 | square 1:1
  "hook": "Deploys, rethought.", // opening line (2D styles; terminal prints it)
  "command": "voltkit deploy",   // terminal style only
  "shots": [ { "big": "9 s", "caption": "median deploy on the demo app." }, ... ],  // 2–5 shots
  "voiceover": []                // optional, see Step 5
}
```
Timing is automatic: 2.5 s hook + 2.83 s per shot + 4.5 s end card (4 shots ≈ 18 s).
Pick the style with the user if they haven't said; suggest `apple3d` for products with a
strong logo, `terminal` for dev tools, `wrapped` for consumer/fun, `minimal` for serious B2B.
Optional: `colors.palette` (array of hex) sets the Wrapped block colours; `"logo_colors": "accent"`
paints every logo layer above the base in the accent colour in 3D.

## Step 3 — Visuals

- **2D styles:** nothing to do — the template renders from ad.json.
- **apple3d:** render the 3D frames with Blender 4.2+, from the `ad/` folder:
  ```bash
  npx product-ad-video@1.1.0 frames ad.json still     # one still per shot -> out/stills (seconds)
  npx product-ad-video@1.1.0 frames ad.json anim      # every frame -> public/frames (minutes)
  ```
  Look at the stills before the full render. Run `anim` in the background and wait for it.
  Re-run `anim` after any change to the `shots` count or `aspect` — the frames must match ad.json.
  If Blender isn't found, tell the user (they can set `BLENDER=/path/to/blender`) and offer a 2D style.

Preview anytime: `npx product-ad-video@1.1.0 studio`. Single frame: `npx product-ad-video@1.1.0 still 120 out/f.png`.
Look at stills of every shot in the chosen aspect before rendering.

### Logo
- Must be an SVG of **filled shapes**. Convert strokes and text to paths first (Figma: Outline
  stroke / Flatten; Inkscape: Object to Path, Stroke to Path).
- Gradients/filters are ignored in 3D (first colour is used); they still show in 2D styles.
- Each shape becomes a layer; later shapes in the file sit slightly in front. A dark rounded
  square behind a coloured mark (app-icon style) looks best in 3D.
- No SVG? Ask for one. A wordmark-only logo works; a one-letter monogram is often better.

## Step 4 — Sound

```bash
npx product-ad-video@1.1.0 sound ad.json
```
Writes `public/audio/soundtrack.wav` (Remotion picks it up automatically) and `cues.json`
(hand-tune it, then `npx product-ad-video@1.1.0 score cues.json`). Everything is synthesized:
style-specific cues (cuts, whooshes, glints, pops, keystrokes) on exact frames plus a 96 BPM music
bed that drops before the end card and resolves on it. It prints loudness per second; body
around −22…−14 dBFS with the end hit loudest is healthy. Details: `references/sound.md`.

## Step 5 — Voiceover (optional)

Only when the user asks for a voice. This step sends the voiceover lines — and nothing else — to
the public Kokoro demo on Hugging Face; say so before running it. Write N+2 short lines
(≤ 6 words) to `lines.txt`: one for the hook, one per shot, one for the end card (name + tagline). Then:
```bash
npx product-ad-video@1.1.0 voice lines.txt vo am_michael
```
Set `"voiceover": ["vo/am_michael/vo-1.wav", ...]` in ad.json and re-run `sound`; it places each
line on its shot and ducks the music. It prints each line's span — make sure no line runs past
the next one (shorten the line if it does). Options: `references/voiceover.md`.

## Step 6 — Render and deliver

```bash
npx product-ad-video@1.1.0 render          # -> out/ad.mp4
```
Send the MP4 to the user. Say plainly you cannot hear audio: timing and levels were checked
numerically. Offer the other aspect (vertical for social) — change `aspect`, re-render frames if
3D, re-run `sound`, render again.

## Rules

- Honest copy only; keep caveats (beta, testnet, waitlist) in the badge or a caption.
- Borrow styles, never brands: don't recreate another company's ad, logo, music or characters.
- Text stays ≥ 1.2 s on screen; keep stats to a few words.
- Keep `public/frames`, `public/audio` and `out/` out of git; commit ad.json, logo and cues.json.

## Custom work

The template in `ad/` is plain React: edit `src/styles/*.tsx` for bespoke scenes. For a fully custom
Blender scene (hand-built mascot, props, six-shot choreography), see the GhostCommits example at
https://github.com/Dhananjay-alt/product-ad-video-skill/tree/main/examples/ghostcommits.
Guides: `references/remotion-2d.md`, `references/blender-3d.md`, `references/storyboard.md`.
