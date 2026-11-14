"""Build the whole soundtrack straight from ad.json: sound cues per style, music bed, voiceover.

    python auto_cues.py ad.json [out.wav]          (default out: public/audio/soundtrack.wav)

Writes cues.json next to ad.json too, so you can hand-tune it and re-run score.py on it.
Voiceover (optional) in ad.json:  "voiceover": ["vo/vo-1.wav", "vo/vo-2.wav", ...]
  line 1 -> the hook, lines 2..N+1 -> one per stat shot, line N+2 -> the end card.
Needs numpy + scipy.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import adspec  # noqa: E402
import score  # noqa: E402


def cue(frame, sound, gain, *args, **kwargs):
    c = {"frame": int(frame), "sound": sound, "gain": gain}
    if args:
        c["args"] = list(args)
    if kwargs:
        c["kwargs"] = kwargs
    return c


def cues_for(ad):
    style = ad.get("style", "apple3d")
    starts, end, hit = ad["_shot_starts"], ad["_end_start"], ad["_end_hit"]
    shots = ad["shots"]
    c = [cue(0, "swell", 0.4, 1.3)]
    if style == "apple3d":
        c += [cue(24, "glint", 0.5, 1.2, -0.6, 0.6)]
        for i, s in enumerate(starts):
            side = 1 if i % 2 == 0 else -1
            c += [cue(s - 1, "cut_hit", 0.42), cue(s, "whoosh", 0.5, 1.0, 220, 2200, 0.5, -0.8 * side, 0.6 * side),
                  cue(s + 23, "air", 0.28)]
            kind = i % 4
            if kind == 1:
                c.append(cue(s + 30, "glint", 0.5, 1.1, 0.6, -0.6))
            elif kind == 3:
                c += [cue(s + 33, "lock", 0.5, 0.2), cue(s + 45, "glint", 0.45, 1.0, -0.6, 0.6)]
            else:
                c.append(cue(s + 26, "click", 0.4, 0.3))
        c += [cue(end - 1, "cut_hit", 0.45), cue(end, "riser", 0.5, (hit - end) / adspec.FPS),
              cue(end + 26, "whoosh", 0.3, 0.7, 400, 2200, 0.5, 0.6, -0.6)]
    elif style == "wrapped":
        c += [cue(4, "pop", 0.55, 620), cue(22, "morph", 0.35, 0.5, 260, 820)]
        for i, s in enumerate(starts):
            c += [cue(s - 2, "whoosh", 0.45, 0.55, 300, 2600, 0.5, -0.7 if i % 2 else 0.7, 0.0),
                  cue(s + 8, "pop", 0.6, 520 + 90 * (i % 4)), cue(s + 10, "thud", 0.5),
                  cue(s + 20, "tick", 0.3, 3600, 0.3)]
        c += [cue(end - 2, "whoosh", 0.5, 0.8, 200, 2000, 0.55, -0.6, 0.6), cue(end + 6, "suck", 0.35, 0.5)]
    elif style == "terminal":
        cmd = ad.get("command") or f"npx {ad['name'].lower()}"
        for k in range(0, int(len(cmd) / 0.9), 2):  # keystrokes while the command types
            c.append(cue(8 + k, "tick", 0.16, 3000 + 400 * (k % 3), -0.2 + 0.1 * (k % 4)))
        c.append(cue(8 + int(len(cmd) / 0.9) + 3, "click", 0.45))
        for i, s in enumerate(starts):
            c += [cue(s + 4, "chime", 0.32), cue(s + 4, "air", 0.2)]
        c += [cue(end, "morph", 0.35, 0.5, 300, 900), cue(end + 4, "whoosh", 0.35, 0.7, 250, 1800, 0.5, 0.0, 0.0)]
    else:  # minimal
        c.append(cue(4, "air", 0.3))
        for i, s in enumerate(starts):
            c += [cue(s - 1, "cut_hit", 0.35), cue(s + 2, "whoosh", 0.3, 0.45, 500, 2600, 0.45, -0.3, 0.3),
                  cue(s + 16, "tick", 0.3, 3400)]
        c += [cue(end - 1, "cut_hit", 0.4), cue(end + 4, "morph", 0.3, 0.6, 250, 700)]
    c += [cue(hit, "impact", 0.9), cue(hit + 2, "air", 0.3), cue(hit + 18, "glint", 0.2, 0.9, 0.2, 0.6)]
    return sorted(c, key=lambda x: x["frame"])


def vo_for(ad):
    files = ad.get("voiceover") or []
    slots = [12] + [s + 20 for s in ad["_shot_starts"]] + [ad["_end_hit"] + 4]
    out = []
    for f, frame in zip(files, slots):
        out.append({"file": f, "start": round(frame / adspec.FPS, 2)})
    if len(files) > len(slots):
        print(f"warning: {len(files) - len(slots)} voiceover line(s) have no slot and were skipped")
    return out


if __name__ == "__main__":
    ad = adspec.load(sys.argv[1])
    out = sys.argv[2] if len(sys.argv) > 2 else adspec.rel(ad, "public/audio/soundtrack.wav")
    spec = {"out": os.path.relpath(out, ad["_dir"]), "fps": adspec.FPS, "duration": ad["_total"] / adspec.FPS,
            "end_frame": ad["_end_hit"], "break_frame": ad["_end_start"], "cues": cues_for(ad), "voiceover": vo_for(ad)}
    with open(os.path.join(ad["_dir"], "cues.json"), "w") as fh:
        json.dump(spec, fh, indent=1)
    cues = [(c["frame"], score.SOUNDS[c["sound"]](*c.get("args", []), **c.get("kwargs", {})), c["gain"]) for c in spec["cues"]]
    vo = [(adspec.rel(ad, v["file"]), v["start"]) for v in spec["voiceover"] if os.path.exists(adspec.rel(ad, v["file"]))]
    score.build(out, spec["duration"], spec["end_frame"], spec["break_frame"], cues, vo, adspec.FPS)
