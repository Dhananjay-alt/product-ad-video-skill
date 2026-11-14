---
name: ad
description: Make a launch video for the current project in one command, e.g. /product-ad-video:ad 3d vertical voice
argument-hint: "[apple3d|wrapped|terminal|minimal] [landscape|vertical|square] [voice]"
disable-model-invocation: true
---

Make a short product ad for the project in the current directory, following the
`product-ad-video` skill in this plugin (read `${CLAUDE_PLUGIN_ROOT}/skills/product-ad-video/SKILL.md`
first and follow every step; its scripts and template live next to it).

Options the user gave: `$ARGUMENTS`

How to read them (any order, all optional):
- Style: `apple3d` (also "3d"), `wrapped` (also "2d", "fun"), `terminal` (also "cli", "dev"), `minimal`.
  If none is given, pick from the project: a CLI/dev tool → terminal, a strong logo → apple3d,
  consumer app → wrapped, B2B/infra → minimal, and say which you chose and why in one line.
- Aspect: `landscape` (default), `vertical` (also "9:16", "reels", "tiktok", "shorts"), `square` (also "1:1").
- `voice` / `vo`: add a voiceover with Kokoro. Without it, music and sound effects only.
- Anything else is a note from the user about content or tone; follow it.

Work in a new `ad/` folder in the project (or `ad-2/`, … if it exists). Before writing ad.json,
show the user the tagline and the shot list you plan to use (one line each) together with the
claims you are avoiding, then continue without waiting unless something is genuinely unclear
(for example, no logo SVG can be found — then ask for one, or offer a 2D style that works without it).
Finish by rendering `ad/out/ad.mp4` and sending it to the user.
