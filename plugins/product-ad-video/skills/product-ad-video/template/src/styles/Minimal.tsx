/* Bold minimal: huge type on a flat background, words rise into place, one accent bar. */
import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { AD, END_HIT, END_START, SHOT, shotStart } from "../ad";
import { C, EndText, SANS, fitWords, lerp, prog, useLayout } from "../common";

const Words: React.FC<{ f: number; at: number; text: string; size: number }> = ({ f, at, text, size }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.25}px` }}>
    {text.split(" ").map((w, i) => {
      const a = prog(f, at + i * 4, at + i * 4 + 16);
      return (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.08 }}>
          <span style={{ display: "inline-block", transform: `translateY(${lerp(110, 0, a)}%)` }}>{w}</span>
        </span>
      );
    })}
  </div>
);

const Card: React.FC<{ f: number; at: number; until: number; big: string; caption?: string }> = ({ f, at, until, big, caption }) => {
  const L = useLayout();
  if (f < at || f >= until) return null;
  const out = prog(f, until - 10, until, Easing.in(Easing.quad));
  const pad = (L.landscape ? 150 : 90) * L.u;
  const size = fitWords(big, (L.landscape ? 210 : 200) * L.u, L.width - 2 * pad, 0.62);
  const bar = prog(f, at + 14, at + 34);
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: `0 ${pad}px`, fontFamily: SANS, color: C.text, opacity: 1 - out, transform: `translateY(${-out * 30 * L.u}px)` }}>
      <div style={{ fontSize: size, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1 }}>
        <Words f={f} at={at + 2} text={big} size={size} />
      </div>
      <div style={{ height: 14 * L.u, width: lerp(0, (L.landscape ? 260 : 220) * L.u, bar), background: C.accent, margin: `${44 * L.u}px 0 ${36 * L.u}px`, borderRadius: 99 }} />
      {caption ? (
        <div style={{ fontSize: (L.landscape ? 54 : 56) * L.u, fontWeight: 500, color: C.secondary, letterSpacing: "-0.02em", maxWidth: 1200 * L.u, opacity: prog(f, at + 20, at + 34) }}>
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Minimal: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <Card f={f} at={4} until={shotStart(0)} big={AD.hook ?? AD.name} />
    {AD.shots.map((s, i) => (
      <Card key={i} f={f} at={shotStart(i)} until={shotStart(i) + SHOT} big={s.big} caption={s.caption} />
    ))}
    {f >= END_START ? <EndText f={f} at={END_HIT} top={0.5} withLogo /> : null}
  </AbsoluteFill>
);
