# Privacy policy: Product Ad Video plugin

_Last updated: 14 November 2026_

The Product Ad Video plugin runs on your own computer inside Claude Code. The plugin author operates no servers and collects, receives and stores no data from you.

## What the plugin reads

To write the ad's copy, Claude reads your project's files, such as the README, `package.json` and logo, the same way it reads them for any other task in Claude Code. Your use of Claude itself is covered by Anthropic's privacy policy.

## What it writes

Everything the plugin makes goes into an `ad/` folder inside your project: the `ad.json` settings, rendered frames, audio and the final MP4. Nothing is kept anywhere else, and you can delete the folder at any time.

## What leaves your computer

Only the following, and only as each step runs:

| When | What is sent | To |
|---|---|---|
| Installing the template | Package requests (no project data) | The public npm registry (registry.npmjs.org) |
| Rendering | Font requests (no project data) | Google Fonts (fonts.googleapis.com, fonts.gstatic.com) |
| Voiceover, only if you ask for `voice` | The voiceover lines, about six short sentences of ad copy | The public Kokoro demo on Hugging Face (hexgrad-kokoro-tts.hf.space) |

No other project content is sent anywhere. The plugin has no analytics or telemetry, and it never reads or sends credentials. Each of those services handles requests under its own privacy policy.

To keep everything local, don't use the `voice` option, or run the Kokoro model on your own machine (`pip install kokoro soundfile`).

## Children

The plugin isn't directed at people under 18.

## Contact

Questions or concerns: open an issue at https://github.com/Dhananjay-alt/product-ad-video-skill/issues
