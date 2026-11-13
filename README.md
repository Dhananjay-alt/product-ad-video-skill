# product-ad-video — a Claude Code skill

Ask Claude for "a launch video for my project" and get an MP4 made entirely in code:
2D motion graphics (Remotion) or a 3D Apple-style product ad (Blender, headless),
synthesized sound effects + music, and an AI voiceover (Kokoro). No video editor, no sample packs.

Built while making the GhostCommits ads; the real files are in `product-ad-video/examples/ghostcommits/`.

## Install

Copy the `product-ad-video/` folder into your skills directory:

- Personal (all projects): `~/.claude/skills/product-ad-video/`
- One project: `<repo>/.claude/skills/product-ad-video/`

Then just ask: *"Make an 18-second product ad for this repo, 3D style, with a voiceover."*

## Requirements

- Node 18+ (Remotion is installed per project by the skill)
- Python 3 with `numpy` and `scipy` (sound)
- Blender 4.2+ for the 3D style (optional)
- Internet for the hosted Kokoro voice (optional)

## What's inside

| Path | What |
|------|------|
| `product-ad-video/SKILL.md` | The workflow Claude follows: brief → storyboard → visuals → sound → voice → render |
| `product-ad-video/scripts/score.py` | JSON cue sheet → full soundtrack WAV (16 synthesized sfx, music bed, voice ducking) |
| `product-ad-video/scripts/kokoro_tts.py` | Text lines → Kokoro voice clips via the free hosted demo (stdlib only) |
| `product-ad-video/references/` | Storyboard template, 2D/3D style guides, sound and voiceover notes |
| `product-ad-video/examples/ghostcommits/` | Real storyboard, Blender scene script, Remotion overlay, cue sheet, VO lines |

## Try the scripts alone

```bash
python product-ad-video/scripts/kokoro_tts.py product-ad-video/examples/ghostcommits/vo-lines.txt vo-out am_michael
python product-ad-video/scripts/score.py product-ad-video/examples/ghostcommits/cues-v2.json
```

(For the second command, put the generated clips at `examples/ghostcommits/vo/vo-1.wav …`, or it
renders music + sfx only.)

## Notes

- The Kokoro demo Space is third-party and may change; the script falls back to instructions for running Kokoro locally.
- Borrow styles, not brands: the skill tells Claude not to recreate another company's actual ad.
- License: MIT. Kokoro model is Apache-2.0.
