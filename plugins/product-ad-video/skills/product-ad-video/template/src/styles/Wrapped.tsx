/* Loud 2D kinetic type on saturated colour blocks, Spotify-Wrapped energy. */
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { AD, END_HIT, END_START, SHOT, shotStart } from "../ad";
import { C, EndText, Logo, SANS, fitWords, lerp, prog, useLayout } from "../common";

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ink = (bg: string) => (lum(bg) > 0.5 ? "#0b0b0f" : "#ffffff");
const PALETTE = C.palette?.length ? C.palette : [C.accent, "#1e1b4b", "#f5f5f7", "#ff4d6d"];

/* Floating decorative shapes, all derived from the frame number. */
const Shapes: React.FC<{ f: number; color: string; seed: number }> = ({ f, color, seed }) => {
  const L = useLayout();
  const items = [0, 1, 2, 3].map((k) => {
    const a = seed * 1.7 + k * 1.9;
    /* keep shapes in the outer band so they never sit on the headline */
    const band = (v: number) => (v < 0.5 ? 0.04 + v * 0.36 : 0.78 + (v - 0.5) * 0.36);
    const vx = (Math.sin(a * 3.1) + 1) / 2;
    const vy = (Math.cos(a * 2.3) + 1) / 2;
    const x = (k % 2 ? band(vx) : 0.1 + 0.8 * vx) * L.width;
    const y = (k % 2 ? 0.1 + 0.8 * vy : band(vy)) * L.height;
    const s = (90 + 140 * ((k * 37 + seed * 11) % 5) / 5) * L.u;
    return { x: x + Math.sin(f / 30 + k) * 30 * L.u, y: y + Math.cos(f / 26 + k) * 30 * L.u, s, k };
  });
  return (
    <AbsoluteFill style={{ opacity: 0.9 }}>
      {items.map(({ x, y, s, k }) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: x - s / 2,
            top: y - s / 2,
            width: s,
            height: s,
            borderRadius: k % 2 ? "50%" : s * 0.22,
            border: k % 3 === 0 ? `${10 * L.u}px solid ${color}` : undefined,
            background: k % 3 === 0 ? undefined : color,
            opacity: k % 3 === 0 ? 0.9 : 0.35,
            transform: `rotate(${f * (k % 2 ? 0.8 : -0.6) + k * 30}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* Circle wipe from a corner into the shot's colour. */
const Wipe: React.FC<{ f: number; at: number; color: string; corner: number }> = ({ f, at, color, corner }) => {
  const L = useLayout();
  const p = prog(f, at, at + 14);
  const cx = corner % 2 ? L.width : 0;
  const cy = corner > 1 ? L.height : 0;
  const r = Math.hypot(L.width, L.height) * p;
  return <AbsoluteFill style={{ background: color, clipPath: `circle(${r}px at ${cx}px ${cy}px)` }} />;
};

export const Wrapped: React.FC<{ f: number }> = ({ f }) => {
  const { fps } = useVideoConfig();
  const L = useLayout();
  const segs = [0, ...AD.shots.map((_, i) => shotStart(i)), END_START];
  const idx = segs.filter((s) => f >= s).length - 1;
  const bgOf = (i: number) => (i === segs.length - 1 ? C.bg : PALETTE[i % PALETTE.length]);
  const bg = bgOf(idx);
  const fg = ink(bg);
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 11, stiffness: 140 } });

  let body: React.ReactNode = null;
  if (idx === 0) {
    const p = pop(4);
    const words = (AD.hook ?? AD.tagline).split(" ");
    body = (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 * L.u, fontFamily: SANS, color: fg }}>
        <div style={{ transform: `scale(${p}) rotate(${lerp(-25, 0, p)}deg)` }}>
          <Logo size={300 * L.u} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${26 * L.u}px`, padding: `0 ${80 * L.u}px` }}>
          {words.map((w, i) => {
            const a = pop(22 + i * 5);
            return (
              <span key={i} style={{ fontSize: 110 * L.u, fontWeight: 900, letterSpacing: "-0.04em", transform: `translateY(${lerp(80, 0, a) * L.u}px)`, opacity: Math.min(1, a * 1.5) }}>
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    );
  } else if (idx < segs.length - 1) {
    const i = idx - 1;
    const s = AD.shots[i];
    const at = shotStart(i) + 8;
    const p = pop(at);
    const out = prog(f, shotStart(i) + SHOT - 8, shotStart(i) + SHOT);
    const big = fitWords(s.big, (L.landscape ? 300 : 260) * L.u, L.width * 0.84, 0.7);
    body = (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, color: fg, textAlign: "center", padding: `0 ${70 * L.u}px` }}>
        <div style={{ fontSize: big, fontWeight: 900, letterSpacing: "-0.055em", lineHeight: 0.95, transform: `scale(${lerp(0.4, 1, p) * (1 - out * 0.3)}) rotate(${lerp(-8, 0, p)}deg)`, opacity: 1 - out }}>
          {s.big}
        </div>
        {s.caption ? (
          <div style={{ marginTop: 40 * L.u, fontSize: 58 * L.u, fontWeight: 700, letterSpacing: "-0.02em", maxWidth: 1100 * L.u, opacity: prog(f, at + 10, at + 22) * (1 - out), transform: `translateY(${lerp(40, 0, prog(f, at + 10, at + 22)) * L.u}px)` }}>
            {s.caption}
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: idx > 0 ? bgOf(idx - 1) : bg }}>
      <Wipe f={f} at={segs[idx]} color={bg} corner={idx % 4} />
      {idx < segs.length - 1 ? <Shapes f={f} color={ink(bg) === "#ffffff" ? "#ffffff" : "#0b0b0f"} seed={idx} /> : null}
      <AbsoluteFill style={{ transform: `scale(${interpolate(f - segs[idx], [0, 90], [1.04, 1], { extrapolateRight: "clamp" })})` }}>{body}</AbsoluteFill>
      {idx === segs.length - 1 ? <EndText f={f} at={END_HIT} top={0.5} withLogo color={ink(C.bg)} sub={C.secondary} /> : null}    </AbsoluteFill>
  );
};
