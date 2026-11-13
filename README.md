<div align="center">

# 🎬 product-ad-video

**A Claude Code skill that makes product launch videos entirely in code.**

3D product shots scripted in Blender · motion graphics in Remotion · synthesized sound design · AI voiceover
— no video editor, no stock footage, no sample packs.

<img src="assets/preview.gif" alt="18-second 3D product ad made with this skill" width="720">

<sub>An 18-second ad for <a href="https://ghostcommits.netlify.app">GhostCommits</a>, made with this skill. Every frame, sound and voice line came from scripts.</sub>

</div>

---

## What it does

Ask Claude Code for a promo video:

> *"Make an 18-second product ad for this repo, 3D style, with a voiceover."*

Claude reads your project, then runs the same steps a motion designer would:

| Step | What happens | Tool |
|---|---|---|
| **1. Brief** | Reads your README/site, pulls the pitch, proof points, brand colours and logo, and writes down what must **not** be claimed | Claude |
| **2. Storyboard** | 5–6 shots of ~2.5 s, each with camera move, on-screen text and sound, saved as a `.md` you can edit | Claude |
| **3. Visuals** | **2D:** kinetic type and shapes in React. **3D:** a glossy hero object in a black void with macro shots, light streaks and depth of field | Remotion / Blender (headless) |
| **4. Sound** | Every effect and the music bed synthesized from code, cued to exact video frames | `scripts/score.py` |
| **5. Voice** | Short punchy lines in a natural-sounding open-weight voice | `scripts/kokoro_tts.py` |
| **6. Render** | Text overlaid on the frames, audio muxed in, exported as MP4 | Remotion |

<img src="assets/shots.jpg" alt="Six shots from the example ad" width="100%">

## Why code instead of an editor

- **Reproducible:** change one line in the storyboard or a colour token and re-render.
- **Reviewable:** the whole ad is text, so it diffs, versions and goes through PRs.
- **License-free audio:** all 16 sound effects and the music are generated, not sampled.
- **Honest by default:** the skill makes Claude list claims to avoid (beta, testnet, "anonymous", user counts) and checks every line against that list.

## Install

```bash
git clone https://github.com/Dhananjay-alt/product-ad-video-skill.git
```

Copy the `product-ad-video/` folder into a skills directory:

| Scope | Location |
|---|---|
| All your projects | `~/.claude/skills/product-ad-video/` |
| One project | `<repo>/.claude/skills/product-ad-video/` |

On macOS/Linux:
```bash
mkdir -p ~/.claude/skills && cp -r product-ad-video-skill/product-ad-video ~/.claude/skills/
```

On Windows (PowerShell):
```powershell
Copy-Item -Recurse product-ad-video-skill\product-ad-video $HOME\.claude\skills\
```

Start Claude Code in your project and ask for a video. The skill loads automatically.

### Requirements

| | Needed for |
|---|---|
| Node.js 18+ | Remotion, installed per project by the skill |
| Python 3 with `numpy` and `scipy` | Sound design |
| [Blender](https://www.blender.org/download/) 4.2+ | 3D style only |
| Internet connection | Hosted Kokoro voice only (optional) |

## Use the scripts on their own

Both scripts work without Claude.

**Generate voiceover lines** (one line per row in a text file; Python standard library only):

```bash
python product-ad-video/scripts/kokoro_tts.py lines.txt vo/ am_michael af_heart
```

**Score a video from a cue sheet:**

```bash
python product-ad-video/scripts/score.py cues.json
```

```jsonc
{
  "out": "soundtrack.wav",
  "fps": 30, "duration": 18.0,
  "end_frame": 494,    // the end-card hit; the music resolves here
  "break_frame": 406,  // drums drop out for the build-up
  "cues": [
    { "frame": 0,   "sound": "swell",  "args": [1.3], "gain": 0.35 },
    { "frame": 76,  "sound": "whoosh", "kwargs": { "dur": 1.1 }, "gain": 0.5 },
    { "frame": 494, "sound": "impact", "gain": 0.9 }
  ],
  "voiceover": [ { "file": "vo/vo-1.wav", "start": 0.6 } ]
}
```

Available sounds: `whoosh` `air` `suck` `swell` `riser` `pop` `tick` `click` `thud` `impact` `cut_hit` `chime` `lock` `glint` `morph` `hum`.
It prints loudness per second, so you can sanity-check the mix without listening.

## What's inside

```
product-ad-video/
├── SKILL.md                  the workflow Claude follows
├── scripts/
│   ├── score.py              cue sheet → soundtrack (sfx + music + voice ducking)
│   └── kokoro_tts.py         text → voice clips via hosted Kokoro
├── references/
│   ├── storyboard.md         shot-list template
│   ├── remotion-2d.md        2D motion patterns: easing, staggering, type sizes
│   ├── blender-3d.md         the "Apple ad" look: lights, materials, camera, gotchas
│   ├── sound.md              what each sound is for, gains, loudness targets
│   └── voiceover.md          voice options compared, line-writing tips
└── examples/ghostcommits/    the real files behind the ad above
    ├── storyboard-v2.md
    ├── ghost_scene.py        Blender scene: modelling, lighting, camera, render
    ├── GhostAdV2.tsx         Remotion text overlay and end card
    ├── cues-v2.json          the sound cue sheet
    └── vo-lines.txt          the voiceover script
```

## Voice options

Tried while making the example, best first:

1. **ElevenLabs:** most natural; the free tier is often busy.
2. **Kokoro** *(default)*: open-weight, free, close to ElevenLabs for short lines. The example uses `am_michael`.
3. **Your own voice:** a phone in a quiet room often wins for indie launches.
4. **OS voices** (Windows SAPI, macOS `say`): instant but robotic. Not recommended.
5. **No voice:** the 3D style works with music and effects alone.

## Notes

- The Kokoro script uses the public [hexgrad/Kokoro-TTS](https://huggingface.co/spaces/hexgrad/Kokoro-TTS) demo, which may change. To run it locally instead: `pip install kokoro soundfile`.
- Borrow styles, not brands: the skill won't recreate another company's actual ad, logo or music.
- Claude can't hear audio. Timing and levels are checked numerically, so give the result a listen.

## Credits

Built while making the launch ads for [GhostCommits](https://ghostcommits.netlify.app), with [Claude Code](https://claude.com/claude-code).
Uses [Remotion](https://www.remotion.dev), [Blender](https://www.blender.org) and [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0).

## License

[MIT](LICENSE). Note that Remotion has its own [license terms](https://www.remotion.dev/license) for companies.
