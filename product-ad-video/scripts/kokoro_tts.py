"""Generate voiceover lines with Kokoro (open-weight TTS) via the free hosted Hugging Face demo.

    python kokoro_tts.py lines.txt out_dir [voice ...]

lines.txt: one line per voiceover clip. Writes out_dir/<voice>/vo-1.wav, vo-2.wav, ...
Default voices: am_michael (deep US male), am_fenrir, af_heart (US female).
Pronunciation hint syntax: [Zcash](/zˈikæʃ/)   — stdlib only, no install needed.

The demo Space (hexgrad/Kokoro-TTS) does not list a public API, so this calls its Gradio
queue directly. If it breaks, generate by hand at https://hf.co/spaces/hexgrad/Kokoro-TTS
or run Kokoro locally: pip install kokoro soundfile.
"""
import json
import os
import random
import string
import sys
import urllib.request

SPACE = "https://hexgrad-kokoro-tts.hf.space"
FN_INDEX = 4  # Generate button: inputs (text, voice, speed, use_gpu)


def _api_prefix():
    cfg = json.load(urllib.request.urlopen(SPACE + "/config", timeout=60))
    return cfg.get("api_prefix", "")


def generate(text, voice, prefix, speed=1.0):
    sh = "".join(random.choices(string.ascii_lowercase + string.digits, k=11))
    body = json.dumps({"data": [text, voice, speed, False], "fn_index": FN_INDEX,
                       "trigger_id": 2, "session_hash": sh}).encode()
    req = urllib.request.Request(SPACE + prefix + "/queue/join", body, {"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=60).read()
    stream = urllib.request.urlopen(SPACE + prefix + "/queue/data?session_hash=" + sh, timeout=300)
    for raw in stream:
        line = raw.decode().strip()
        if not line.startswith("data:"):
            continue
        msg = json.loads(line[5:])
        if msg.get("msg") == "process_completed":
            if not msg.get("success"):
                raise RuntimeError(f"generation failed: {msg}")
            return urllib.request.urlopen(msg["output"]["data"][0]["url"], timeout=60).read()
    raise RuntimeError("stream ended without a result")


if __name__ == "__main__":
    lines_file, out_dir = sys.argv[1], sys.argv[2]
    voices = sys.argv[3:] or ["am_michael", "am_fenrir", "af_heart"]
    lines = [l.strip() for l in open(lines_file, encoding="utf-8") if l.strip()]
    prefix = _api_prefix()
    for v in voices:
        os.makedirs(os.path.join(out_dir, v), exist_ok=True)
        for i, text in enumerate(lines, 1):
            path = os.path.join(out_dir, v, f"vo-{i}.wav")
            open(path, "wb").write(generate(text, v, prefix))
            print(v, i, path)
