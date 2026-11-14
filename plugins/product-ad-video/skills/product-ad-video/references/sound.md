# Sound design (product-ad-video sound / score)

Everything is synthesized with numpy/scipy: no sample packs, no licensing questions.

| Sound | Use it for | Typical gain |
|-------|-----------|--------------|
| `swell(dur)` | opening fade-up | 0.35–0.45 |
| `cut_hit()` | every hard cut | 0.3–0.45 |
| `whoosh(dur, f0, f1, peak, p0, p1, width)` | object/camera fly-in; p0→p1 pans with the motion | 0.35–0.6 |
| `air()` | soft texture when text appears | 0.25–0.3 |
| `glint(dur, p0, p1)` | light streak across a glossy surface | 0.45–0.5 |
| `pop(freq)` / `tick(freq)` | UI elements appearing | 0.25–0.55 |
| `click()` / `lock()` | something landing / securing | 0.45–0.65 |
| `thud()` | heavy element landing | 0.85 |
| `morph(dur, f0, f1)` | shape transforming | 0.2–0.45 |
| `riser(dur)` | build-up into the end card | 0.5 |
| `impact()` | end-card hit | 0.9 |
| `chime()`, `hum()`, `suck()` | success, ambience, pull-in | 0.2–0.55 |

Music bed: A minor (Am–F–C–G), 96 BPM. Pad from 0 s, bass+kick from 2.5 s, hats+arp from 5 s,
drums drop at `break_frame` (start of the build-up), resolves with a final chord on `end_frame`.
Pads/bass are sidechained to the kick. Final mix: music ×0.3, sfx ×0.75, light reverb, soft
limiter to −0.3 dBFS.

Workflow
1. Grep the animation code for the frame numbers of every cut, entrance and landing.
2. Put one cue on each; offset whooshes 2–5 frames *before* the visual arrives, hits *on* it.
3. Run the script; read the per-second RMS. Healthy: −20 to −10 dBFS through the body, loudest at the end hit.
   A second near −30 means a dead spot; a jump of > 8 dB means something is too loud.
4. You can't hear it — tell the user so and invite them to say "louder music / fewer whooshes".
