# Product Ad Video

Make a short launch video for your product, entirely in code. Claude reads your project, writes honest copy, and renders an 18-second MP4 with motion graphics, sound effects, music and an optional voiceover. You don't need a video editor, stock footage or sample packs.

> **Requires Claude Code on your own computer.** Rendering runs locally with Node.js, Python and, for the 3D style, Blender. In claude.ai chat or Cowork the plugin can plan an ad and write its script, but it can't render the video.

## What you get

- **Your logo in 3D:** give it an SVG logo and it becomes a glossy 3D object with macro close-ups, light streaks and depth of field, rendered headless in Blender.
- **Four styles:** `apple3d`, `wrapped` (bold colour blocks), `terminal` (types your command, each feature prints as a ✓) and `minimal` (huge type).
- **Any shape:** landscape 16:9, vertical 9:16 for Reels, TikTok and Shorts, or square 1:1.
- **Sound included:** every sound effect and the music bed are synthesized in code and placed on the exact frames of each cut. There are no sample files and no licensing questions.
- **Optional voiceover:** short lines read by Kokoro, an open-weight text-to-speech model.
- **Honest copy:** Claude lists the claims it is avoiding (unproven numbers, beta caveats, user counts) and keeps caveats such as "beta" visible on the end card.

## How to use

```text
/product-ad-video:ad
/product-ad-video:ad terminal vertical voice
```

Options, in any order: a style (`apple3d`, `wrapped`, `terminal`, `minimal`), a shape (`landscape`, `vertical`, `square`), and `voice`. You can also ask in plain words, such as "make a launch video for this repo".

The finished video is saved as `ad/out/ad.mp4` in your project, with every input, `ad.json` included, next to it so you can tweak and re-render.

## Requirements

- Node.js 18 or later
- Python 3 with `numpy` and `scipy`
- Blender 4.2 or later, for the `apple3d` style only
- An internet connection for the installs, fonts and optional voiceover listed below

## What it runs, sends and fetches

Everything runs on your machine, in a new `ad/` folder inside your project. The plugin has no servers of its own and collects nothing.

- **Local programs:** `npm install` (Remotion 4.0.543 and React, from the public npm registry), `npx remotion@4.0.543` to render, `python` for the bundled sound scripts, and `blender` in headless mode for the 3D style. Claude Code asks your permission before each command, as usual.
- **Fonts:** at render time Remotion downloads the Inter and JetBrains Mono fonts from Google Fonts (fonts.googleapis.com and fonts.gstatic.com).
- **Voiceover (optional, only when you ask for `voice`):** `scripts/kokoro_tts.py` sends the voiceover lines, about 6 short sentences of ad copy, to the public Kokoro demo on Hugging Face (hexgrad-kokoro-tts.hf.space) and downloads the generated audio. No other project content is sent. To keep everything local, skip `voice` or run Kokoro yourself (`pip install kokoro soundfile`).
- **Nothing else:** no analytics, no telemetry, and no credentials are read or sent.

## What's inside

- `skills/ad`: the `/product-ad-video:ad` command
- `skills/product-ad-video`: the workflow Claude follows, plus:
  - `template/`: the Remotion project, driven by one `ad.json`
  - `scripts/`: the logo-to-3D Blender script, the soundtrack generator and the voice helper
  - `references/`: style guides
  - `examples/`: the real files behind the GhostCommits launch ads

Source, demos and issues: https://github.com/Dhananjay-alt/product-ad-video-skill

## License

MIT. Remotion has its own [license terms](https://www.remotion.dev/license) for companies. Kokoro is Apache-2.0.
