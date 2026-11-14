# product-ad-video

The engine behind the **Product Ad Video** plugin for Claude Code: make an 18-second product launch video in code.

- `init`: copies a Remotion project driven by one `ad.json` file (four styles: `apple3d`, `wrapped`, `terminal`, `minimal`; landscape, vertical or square)
- `frames`: turns your SVG logo into a glossy 3D object and renders it headless in Blender 4.2+
- `sound`: synthesizes sound effects and a music bed on the exact frames of each cut, with voiceover ducking
- `voice`: generates voiceover lines with Kokoro (optional)

```bash
npx product-ad-video@1.1.1 init ad --logo logo.svg
cd ad && npm install
npx product-ad-video@1.1.1 doctor
npx product-ad-video@1.1.1 frames ad.json anim      # apple3d style only
npx product-ad-video@1.1.1 sound ad.json
npx product-ad-video@1.1.1 render                # -> out/ad.mp4
```

## What it runs and sends

- Runs locally: Node (this CLI), Python 3 with numpy and scipy (sound, voice), and Blender (3D frames) in headless mode.
- `voice` sends only the voiceover lines to the public Kokoro demo on Hugging Face (hexgrad-kokoro-tts.hf.space). No other command contacts the network. Rendering with Remotion downloads fonts from Google Fonts.
- No telemetry.

Full docs, demos and the Claude Code plugin: https://github.com/Dhananjay-alt/product-ad-video-skill

MIT licensed.
