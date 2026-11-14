/* Developer-tool look: a terminal types the command, each stat prints as a passing check. */
import React from "react";
import { AbsoluteFill } from "remotion";
import { AD, END_HIT, END_START, shotStart } from "../ad";
import { C, EndText, MONO, prog, useLayout } from "../common";

type Line = { at: number; text: string; color: string; size?: number; bold?: boolean; speed?: number };

const typed = (f: number, l: Line) => {
  const n = Math.floor(Math.max(0, f - l.at) * (l.speed ?? 1.4));
  return l.text.slice(0, n);
};

export const Terminal: React.FC<{ f: number }> = ({ f }) => {
  const L = useLayout();
  const cmd = AD.command ?? `npx ${AD.name.toLowerCase()}`;
  const lines: Line[] = [{ at: 8, text: `$ ${cmd}`, color: C.text, bold: true, speed: 0.9 }];
  if (AD.hook) lines.push({ at: 50, text: `  ${AD.hook}`, color: C.secondary, speed: 3 });
  AD.shots.forEach((s, i) => {
    const a = shotStart(i);
    lines.push({ at: a + 4, text: `✓ ${s.big}`, color: C.accent, bold: true, size: 1.5, speed: 1.2 });
    if (s.caption) lines.push({ at: a + 22, text: `  ${s.caption}`, color: C.secondary, speed: 3 });
  });
  lines.push({ at: END_START - 20, text: "$ _", color: C.text, speed: 9 });

  const shown = lines.filter((l) => f >= l.at);
  const keep = L.landscape ? 8 : 11;
  const visible = shown.slice(-keep);
  const base = (L.landscape ? 52 : 50) * L.u;
  const fade = prog(f, END_START, END_START + 12);
  const blink = Math.floor(f / 15) % 2 === 0;
  const last = shown[shown.length - 1];
  const W = L.landscape ? 1640 * L.u : L.width - 70 * L.u;
  const Hh = L.landscape ? 880 * L.u : 1240 * L.u;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: MONO }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${C.accent}22 0%, transparent 55%)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - fade, transform: `scale(${1 - fade * 0.06})` }}>
        <div
          style={{
            width: W,
            height: Hh,
            background: "#0d0f14",
            border: "1px solid #2a2d36",
            borderRadius: 22 * L.u,
            boxShadow: `0 ${40 * L.u}px ${120 * L.u}px rgba(0,0,0,0.6)`,
            overflow: "hidden",
            transform: `translateY(${(1 - prog(f, 0, 14)) * 40 * L.u}px)`,
            opacity: prog(f, 0, 10),
          }}
        >
          <div style={{ height: 56 * L.u, display: "flex", alignItems: "center", gap: 12 * L.u, padding: `0 ${22 * L.u}px`, borderBottom: "1px solid #22252d" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div key={c} style={{ width: 18 * L.u, height: 18 * L.u, borderRadius: 99, background: c }} />
            ))}
            <div style={{ flex: 1, textAlign: "center", color: "#6b7080", fontSize: 22 * L.u, marginRight: 80 * L.u }}>{AD.name.toLowerCase()} — zsh</div>
          </div>
          <div style={{ padding: `${36 * L.u}px ${44 * L.u}px`, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: Hh - 56 * L.u, boxSizing: "border-box" }}>
            {visible.map((l) => (
              <div
                key={l.at + l.text}
                style={{
                  color: l.color,
                  fontSize: base * (l.size ?? 1),
                  fontWeight: l.bold ? 700 : 400,
                  lineHeight: 1.35,
                  whiteSpace: "pre-wrap",
                  marginTop: l.size ? 18 * L.u : 0,
                }}
              >
                {typed(f, l)}
                {l === last && blink ? <span style={{ background: C.text, color: C.text }}>&nbsp;</span> : null}              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      <EndText f={f} at={END_HIT} top={0.5} withLogo />    </AbsoluteFill>
  );
};
