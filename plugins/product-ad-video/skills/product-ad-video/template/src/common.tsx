import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useVideoConfig } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { AD } from "./ad";

export const SANS = loadInter("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] }).fontFamily;
export const C = AD.colors;

export const ease = Easing.bezier(0.23, 1, 0.32, 1);
export const prog = (f: number, a: number, b: number, e: (n: number) => number = ease) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Layout that adapts to landscape / vertical / square. `u` = 1 at 1080 px on the short side. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const landscape = width > height;
  const square = width === height;
  return { width, height, vertical, landscape, square, u: Math.min(width, height) / 1080 };
};

/* The logo file sits in public/; ad.json may say "public/logo.svg" or "logo.svg". */
export const logoSrc = () => staticFile((AD.logo ?? "public/logo.svg").replace(/^public\//, ""));

export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={logoSrc()} style={{ width: size, height: size, objectFit: "contain", ...style }} />
);

/* Fit long words: shrink the font so `text` fits `maxWidth` (approximate, ~0.55 em per char for bold sans). */
export const fitSize = (text: string, base: number, maxWidth: number, perChar = 0.56) =>
  Math.min(base, maxWidth / Math.max(1, text.length * perChar));
/* Same, but text may wrap: only the longest word has to fit on one line. */
export const fitWords = (text: string, base: number, maxWidth: number, perChar = 0.6) =>
  fitSize(text.split(" ").reduce((a, w) => (w.length > a.length ? w : a), ""), base, maxWidth, perChar);

/* Big stat + caption. Landscape: lower left. Vertical/square: bottom, full width. */
export const Stat: React.FC<{
  f: number;
  inAt: number;
  outAt: number;
  big: string;
  caption?: string;
  scrim?: boolean;
  color?: string;
  captionColor?: string;
}> = ({ f, inAt, outAt, big, caption, scrim, color = C.text, captionColor = C.text }) => {
  const L = useLayout();
  if (f < inAt - 12 || f > outAt + 12) return null;
  const out = prog(f, outAt, outAt + 9, Easing.in(Easing.quad));
  const row = (i: number) => {
    const a = prog(f, inAt + i * 5, inAt + i * 5 + 14);
    return { opacity: a * (1 - out), transform: `translateY(${lerp(30, 0, a) * L.u}px)` };
  };
  const pad = (L.landscape ? 140 : 80) * L.u;
  const maxW = L.landscape ? L.width * 0.55 : L.width - 2 * pad;
  const bigSize = fitSize(big, (L.landscape ? 200 : 190) * L.u, maxW);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color }}>
      {scrim ? (
        <AbsoluteFill
          style={{
            background: L.landscape
              ? "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 32%, rgba(0,0,0,0) 60%)"
              : "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0) 60%)",
            opacity: prog(f, inAt - 12, inAt + 4) * (1 - out),
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: pad, right: L.landscape ? undefined : pad, bottom: (L.landscape ? 170 : 260) * L.u }}>
        <div style={{ fontSize: bigSize, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.98, whiteSpace: "nowrap", ...row(0) }}>
          {big}
        </div>
        {caption ? (
          <div
            style={{
              marginTop: 26 * L.u,
              fontSize: (L.landscape ? 48 : 54) * L.u,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.22,
              maxWidth: L.landscape ? 760 * L.u : undefined,
              color: captionColor,
              ...row(1),
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* Name, tagline, URL + badge. `top` = where the name sits (fraction of height). */
export const EndText: React.FC<{ f: number; at: number; top: number; withLogo?: boolean; color?: string; sub?: string }> = ({
  f,
  at,
  top,
  withLogo,
  color = C.text,
  sub = C.secondary,
}) => {
  const L = useLayout();
  if (f < at - 2) return null;
  const word = prog(f, at, at + 22, Easing.out(Easing.cubic));
  const tag = prog(f, at + 12, at + 26);
  const url = prog(f, at + 20, at + 34);
  const logo = prog(f, at - 10, at + 10);
  const nameSize = fitSize(AD.name + ".", (L.landscape ? 164 : 150) * L.u, L.width * 0.86, 0.6);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, alignItems: "center" }}>
      {withLogo ? (
        <div style={{ position: "absolute", top: L.height * top - 330 * L.u, opacity: logo, transform: `scale(${lerp(0.7, 1, logo)})` }}>
          <Logo size={260 * L.u} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: L.height * top,
          fontSize: nameSize,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 1,
          color,
          clipPath: `inset(-20% ${(1 - word) * 100}% -20% 0)`,
          whiteSpace: "nowrap",
        }}
      >
        {AD.name}
        <span style={{ color: C.accent }}>.</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: L.height * top + nameSize * 1.12,
          fontSize: (L.landscape ? 58 : 56) * L.u,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: sub,
          opacity: tag,
          transform: `translateY(${lerp(20, 0, tag) * L.u}px)`,
          textAlign: "center",
          padding: `0 ${60 * L.u}px`,
        }}
      >
        {AD.tagline}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: (L.landscape ? 110 : 220) * L.u,
          display: "flex",
          alignItems: "center",
          gap: 28 * L.u,
          fontFamily: MONO,
          fontSize: 38 * L.u,
          color,
          opacity: url,
        }}
      >
        {AD.url}
        {AD.badge ? (
          <span style={{ fontSize: 24 * L.u, color: sub, border: `1px solid ${sub}66`, borderRadius: 999, padding: `${6 * L.u}px ${17 * L.u}px` }}>
            {AD.badge}
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
