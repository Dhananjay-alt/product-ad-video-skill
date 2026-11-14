"""Shared reader for ad.json + the shot timing. Must match template/src/ad.ts."""
import json
import os

FPS, HOOK, SHOT, END = 30, 75, 85, 135
SIZES = {"landscape": (1920, 1080), "vertical": (1080, 1920), "square": (1080, 1080)}


def load(path):
    with open(path, encoding="utf-8") as f:
        ad = json.load(f)
    ad["_dir"] = os.path.dirname(os.path.abspath(path))
    n = len(ad["shots"])
    ad["_shot_starts"] = [HOOK + SHOT * i for i in range(n)]
    ad["_end_start"] = HOOK + SHOT * n
    ad["_end_hit"] = ad["_end_start"] + (70 if ad.get("style", "apple3d") == "apple3d" else 20)
    ad["_total"] = ad["_end_start"] + END
    ad["_size"] = SIZES[ad.get("aspect", "landscape")]
    return ad


def rel(ad, p):
    return p if os.path.isabs(p) else os.path.join(ad["_dir"], p)
