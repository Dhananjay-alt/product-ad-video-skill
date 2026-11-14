# 2D style in Remotion

Setup: `npx create-video@4.0.543 --yes --blank --no-tailwind video && cd video && npm i`.
Register compositions in `src/Root.tsx` (1920×1080, 30 fps, durationInFrames = 540–600).

Patterns that look good
- `const prog = (f,a,b,e=ease) => interpolate(f,[a,b],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:e})`
  with `Easing.bezier(0.23,1,0.32,1)` — snappy ease-out for everything entering.
- Text rows stagger 5 frames apart, rise 30 px while fading in, exit in 9 frames with ease-in.
- Wipes via `clipPath: inset(...)` animate a word revealing left→right.
- Fonts: `@remotion/google-fonts` (Inter 500–800, JetBrains Mono for URLs/code).
- Colour tokens in one `C` object; accent used sparingly (a dot, one bar, the logo).
- Big type: 150–260 px for the stat, 48 px caption, letter-spacing −0.045em.
- Logo: inline the SVG as a component so parts can animate separately.
- No CSS transitions/animations — Remotion renders frame by frame; everything derives from `useCurrentFrame()`.

Preview: `npx remotion@4.0.543 studio`. Single frame check: `npx remotion@4.0.543 still <Id> out/f.png --frame=120`.
Render: `npx remotion@4.0.543 render <Id> out/ad.mp4`.
Full example: `../examples/ghostcommits/GhostAdV2.tsx` (text overlay + end card).
