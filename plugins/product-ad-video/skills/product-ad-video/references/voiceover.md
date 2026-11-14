# Voiceover

Options, best first (from experience on the GhostCommits ad)

1. **ElevenLabs** — most natural. Free tier often says "generations are busy"; paid credits are reliable.
2. **Kokoro** (open-weight, 82 M params) — close to ElevenLabs for short ad lines, free.
   - Hosted: `npx product-ad-video@1.1.0 voice lines.txt vo am_michael` (uses the hexgrad/Kokoro-TTS demo).
   - Local: `pip install kokoro soundfile` (Python 3.10–3.12, ~330 MB model, CPU is fine).
   - Voices worth trying: `am_michael` (deep, ad-like — chosen for GhostCommits), `am_fenrir`, `af_heart`.
   - Pronunciation fix: `[Zcash](/zˈikæʃ/)` — markdown link with IPA.
   - Output is 24 kHz; the `sound` command resamples to 48 kHz automatically.
3. **Record it yourself** on a phone in a quiet room — often the most convincing for indie launches.
4. **OS voices** (Windows SAPI "David", macOS `say`) — instant but robotic; users disliked it. Avoid for anything public.
5. **No voice** — the AirPods-style 3D ad works fine with music + sfx only.

Writing lines
- ≤ 6 words per line, one per shot, echoing the on-screen text (don't read the caption verbatim).
- Last line = product name + tagline.
- Kokoro speaks ~3 words/s; measure each clip and make sure line N ends before line N+1 starts.
- Start each line ~0.1 s after its text appears.
