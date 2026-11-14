import React from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  interpolate,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: SANS } = loadInter("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadMono("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

/* ---------- tokens (from the app's stylesheet and logo) ---------- */
const C = {
  bg: "#09090b",
  surface: "#111114",
  border: "#29292f",
  borderStrong: "#46464f",
  text: "#f5f5f7",
  secondary: "#b0b0ba",
  muted: "#92929e",
  red: "#ef233c",
  accent: "#fa5268",
  green: "#6edbb0",
  amber: "#efc078",
};

/* ---------- helpers ---------- */
const ease = Easing.bezier(0.23, 1, 0.32, 1);
const prog = (f: number, a: number, b: number, e: (n: number) => number = ease) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: string, b: string, t: number) =>
  `color-mix(in srgb, ${b} ${Math.round(t * 100)}%, ${a})`;

const At: React.FC<{
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  transform?: string;
  children?: React.ReactNode;
}> = ({ x = 0, y = 0, style, transform = "", children }) => (
  <div
    style={{
      position: "absolute",
      left: 960 + x,
      top: 540 + y,
      transform: `translate(-50%, -50%) ${transform}`,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ---------- radial shape morphing ---------- */
type Pt = [number, number];
const N = 240;
const ANGLES = Array.from({ length: N }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / N);

const radial = (poly: Pt[]) =>
  ANGLES.map((a) => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let best = 0;
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i];
      const Q = poly[(i + 1) % poly.length];
      const ex = Q[0] - P[0];
      const ey = Q[1] - P[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = (P[0] * ey - P[1] * ex) / den;
      const u = (P[0] * dy - P[1] * dx) / den;
      if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) best = Math.max(best, t);
    }
    return best;
  });

const K = 17; // px per logo unit
const ghostPoly: Pt[] = [
  ...Array.from({ length: 49 }, (_, i): Pt => {
    const a = Math.PI + (i / 48) * Math.PI;
    return [(9 * Math.cos(a)) * K, (18 + 9 * Math.sin(a) - 19.5) * K];
  }),
  [9 * K, 9.5 * K],
  [4.5 * K, 7 * K],
  [0, 9.5 * K],
  [-4.5 * K, 7 * K],
  [-9 * K, 9.5 * K],
];
const shieldHalf: Pt[] = [
  [0, -10],
  [8.6, -7.4],
  [8.6, 0],
  [7.4, 4.4],
  [4.2, 7.8],
  [0, 10],
];
const shieldPoly: Pt[] = [
  ...shieldHalf.map(([x, y]): Pt => [x * K, y * K]),
  ...shieldHalf
    .slice(1, -1)
    .reverse()
    .map(([x, y]): Pt => [-x * K, y * K]),
];

const R = {
  circle: ANGLES.map(() => 150),
  ghost: radial(ghostPoly),
  shield: radial(shieldPoly),
  square: ANGLES.map((a) => {
    const n = 5;
    return 150 / Math.pow(Math.pow(Math.abs(Math.cos(a)), n) + Math.pow(Math.abs(Math.sin(a)), n), 1 / n);
  }),
};

const morphPath = (a: number[], b: number[], t: number) =>
  ANGLES.map((ang, i) => {
    const r = lerp(a[i], b[i], t);
    return `${i === 0 ? "M" : "L"}${(r * Math.cos(ang)).toFixed(2)} ${(r * Math.sin(ang)).toFixed(2)}`;
  }).join(" ") + " Z";

const GHOST_PATH = morphPath(R.ghost, R.ghost, 0);
const SHIELD_PATH = morphPath(R.shield, R.shield, 0);

/* ---------- small pieces ---------- */
const MiniGhost: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      background: "linear-gradient(135deg, #1f0609, #0a0203)",
      border: `1.5px solid rgba(239,35,60,0.6)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="-190 -190 380 380">
      <path d={GHOST_PATH} fill={C.red} />
      <circle cx={-59.5} cy={-17} r={27} fill="#000" />
      <circle cx={59.5} cy={-17} r={27} fill="#000" />
    </svg>
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({
  children,
  color = C.secondary,
  size = 18,
}) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: size,
      color,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 999,
      padding: `${size * 0.25}px ${size * 0.7}px`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const Lines: React.FC<{
  f: number;
  lines: string[];
  inAt: number;
  outAt: number;
  x?: number;
  y: number;
  size?: number;
  align?: "center" | "left";
}> = ({ f, lines, inAt, outAt, x = 0, y, size = 120, align = "center" }) => {
  if (f < inAt || f > outAt + 10) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : 960 + x,
        right: align === "center" ? 0 : undefined,
        top: 540 + y,
        textAlign: align,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: "-0.035em",
        color: C.text,
      }}
    >
      {lines.map((l, i) => {
        const a = prog(f, inAt + i * 5, inAt + i * 5 + 12);
        const out = prog(f, outAt, outAt + 9, Easing.in(Easing.quad));
        return (
          <div
            key={l}
            style={{
              opacity: a * (1 - out),
              transform: `translateY(${lerp(28, 0, a) - out * 14}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- stage ---------- */
const BUMPS = [44, 160, 182, 250, 344, 378, 440, 448, 456, 512, 548];
const Stage: React.FC<{ f: number }> = ({ f }) => {
  const base = prog(f, 2, 44, Easing.out(Easing.quad)) * 0.3;
  const bump = BUMPS.reduce((s, c) => s + 0.09 * Math.exp(-Math.pow((f - c) / 9, 2)), 0);
  const end = prog(f, 495, 530) * 0.1;
  const o = base + bump + end;
  const gx = 50 + 4 * Math.sin(f / 95);
  const gy = 50 + 3 * Math.cos(f / 130);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 46% 56% at ${gx}% ${gy}%, rgba(239,35,60,${o}) 0%, rgba(239,35,60,${o * 0.35}) 42%, rgba(239,35,60,0) 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 34% 40% at ${gx + 24}% ${gy + 18}%, rgba(250,82,104,${o * 0.3}) 0%, rgba(250,82,104,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- hero shape: dot → circle → ghost → square, and shield → ghost → logo ---------- */
const HeroShape: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const pop = (at: number) => spring({ frame: f - at, fps, config: { damping: 11, stiffness: 190 } });

  if (f < 178) {
    const grow = spring({ frame: f - 4, fps, config: { damping: 15, stiffness: 110 } });
    const toGhost = prog(f, 30, 54);
    const toSquare = prog(f, 150, 169);
    const d = toSquare > 0 ? morphPath(R.ghost, R.square, toSquare) : morphPath(R.circle, R.ghost, toGhost);
    const y = lerp(0, -190, prog(f, 75, 98)) + lerp(0, 190, prog(f, 150, 169));
    const x = lerp(0, -400, prog(f, 150, 169));
    const flip = prog(f, 169, 177, Easing.in(Easing.cubic));
    const eyes = 1 - prog(f, 150, 158);
    return (
      <At x={x} y={y} transform={`perspective(1400px) rotateY(${flip * 90}deg) scale(${grow})`}>
        <svg
          width={800}
          height={800}
          viewBox="-400 -400 800 800"
          style={{ overflow: "visible", filter: "drop-shadow(0 0 44px rgba(239,35,60,0.55))", display: "block" }}
        >
          <path d={d} fill={C.red} />
          <circle cx={-59.5} cy={-17} r={27 * pop(54) * eyes} fill="#000" />
          <circle cx={59.5} cy={-17} r={27 * pop(60) * eyes} fill="#000" />
        </svg>
      </At>
    );
  }

  if (f >= 466) {
    const draw = prog(f, 466, 492, Easing.inOut(Easing.cubic));
    const fill = prog(f, 494, 503);
    const toGhost = prog(f, 503, 523);
    const d = morphPath(R.shield, R.ghost, toGhost);
    const tile = spring({ frame: f - 540, fps, config: { damping: 16, stiffness: 120 } });
    const settle = prog(f, 540, 566);
    const scale = lerp(1, 0.5, settle);
    const x = lerp(0, -580, settle);
    const y = lerp(0, -50, settle);
    return (
      <At x={x} y={y} transform={`scale(${scale})`}>
        <svg
          width={800}
          height={800}
          viewBox="-400 -400 800 800"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <linearGradient id="tileBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1f0609" />
              <stop offset="100%" stopColor="#0a0203" />
            </linearGradient>
          </defs>
          {f >= 540 ? (
            <rect
              x={-340 * tile}
              y={-340 * tile + 8.5}
              width={680 * tile}
              height={680 * tile}
              rx={204 * tile}
              fill="url(#tileBg)"
              stroke="rgba(239,35,60,0.6)"
              strokeWidth={14}
            />
          ) : null}
          <g style={{ filter: "drop-shadow(0 0 44px rgba(239,35,60,0.6))" }}>
            <path d={d} fill={C.red} fillOpacity={fill} />
            {fill < 1 ? (
              <path
                d={SHIELD_PATH}
                fill="none"
                stroke={C.red}
                strokeWidth={10}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
              />
            ) : null}
          </g>
          <circle cx={-59.5} cy={-17} r={27 * pop(523)} fill="#000" />
          <circle cx={59.5} cy={-17} r={27 * pop(528)} fill="#000" />
        </svg>
      </At>
    );
  }
  return null;
};

/* ---------- bounty tile (380 x 250) ---------- */
const TILE_W = 380;
const TILE_H = 250;
const TileContent: React.FC<{ title: string; repo: string }> = ({ title, repo }) => (
  <div
    style={{
      width: TILE_W,
      height: TILE_H,
      padding: 26,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: SANS,
    }}
  >
    <div>
      <div style={{ fontFamily: MONO, fontSize: 16, color: C.muted }}>{repo}</div>
      <div
        style={{
          marginTop: 12,
          fontSize: 31,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: "-0.03em",
          color: C.text,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ color: C.text, fontWeight: 800, fontSize: 32, letterSpacing: "-0.03em" }}>
        0.01 <span style={{ fontSize: 18, fontWeight: 600, color: C.secondary }}>ZEC</span>
      </div>
      <Tag size={14}>testnet</Tag>
    </div>
  </div>
);

const HERO_TILE = { title: "Fix README example", repo: "public-repo / cli" };
const OTHER_TITLES = [
  "Clarify install step",
  "Repair one function",
  "Update usage docs",
  "Fix broken link",
  "Add a quick-start",
  "Correct a typo",
  "Document a flag",
];
const OTHER_REPOS = ["public-repo / docs", "public-repo / web", "public-repo / api", "public-repo / sdk"];

/* ---------- shot 3: submission card (also carries the hand-off into the grid) ---------- */
const CODE = [
  { t: "## Usage", c: C.text },
  { t: "$ npm install", c: C.secondary },
  { t: "- $ todo ls", c: C.muted, strike: true },
  { t: "+ $ todo list", c: C.text, hot: true },
];

const SubmitCard: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < 176 || f >= 240) return null;
  const flip = prog(f, 176, 187, Easing.out(Easing.cubic));
  const grow = prog(f, 180, 200);
  const hand = prog(f, 229, 240, Easing.inOut(Easing.cubic));
  const w = lerp(lerp(300, 620, grow), TILE_W * 2, hand);
  const h = lerp(lerp(300, 640, grow), TILE_H * 2, hand);
  const x = lerp(-400, 0, hand);
  const radius = lerp(60, 28, grow);
  const content = prog(f, 188, 195) * (1 - prog(f, 228, 234));
  const tile = prog(f, 232, 240);
  const btn = spring({ frame: f - 205, fps, config: { damping: 13, stiffness: 170 } });
  const press = 1 - 0.05 * Math.exp(-Math.pow((f - 218) / 2.2, 2));
  return (
    <At x={x} transform={`perspective(1400px) rotateY(${(1 - flip) * -90}deg)`}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          background: C.surface,
          border: `2px solid ${mix(C.borderStrong, C.red, tile)}`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 ${60 * tile}px rgba(239,35,60,${0.35 * tile})`,
          position: "relative",
          overflow: "hidden",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 620,
            height: 640,
            padding: 36,
            boxSizing: "border-box",
            opacity: content,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: C.accent }} />
            <div style={{ fontFamily: MONO, fontSize: 26, color: C.secondary }}>README.md</div>
            <div style={{ flex: 1 }} />
            <Tag size={17}>1 file</Tag>
          </div>
          <div
            style={{
              marginTop: 26,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "24px 0",
              fontFamily: MONO,
              fontSize: 26,
            }}
          >
            {CODE.map((l, i) => {
              const r = prog(f, 191 + i * 4, 199 + i * 4, Easing.out(Easing.quad));
              return (
                <div
                  key={l.t}
                  style={{
                    padding: "7px 26px",
                    color: l.c,
                    background: l.hot ? "rgba(250,82,104,0.16)" : "transparent",
                    borderLeft: `4px solid ${l.hot ? C.accent : "transparent"}`,
                    textDecoration: l.strike ? "line-through" : "none",
                    clipPath: `inset(0 ${(1 - r) * 100}% 0 0)`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.t}
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: prog(f, 200, 207) }}>
            <MiniGhost size={54} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
                Ghost #a1b2
              </div>
              <div style={{ fontSize: 20, color: C.muted }}>Local signing key</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              height: 78,
              borderRadius: 16,
              background: C.text,
              color: C.bg,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, btn * 1.4),
              transform: `scale(${lerp(0.9, 1, btn) * press})`,
            }}
          >
            Create GitHub PR
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: tile,
            transform: "scale(2)",
            transformOrigin: "0 0",
          }}
        >
          <TileContent {...HERO_TILE} />
        </div>
      </div>
    </At>
  );
};

/* ---------- shot 4: wall of bounties ---------- */
const COLS = 9;
const ROWS = 7;
const GAP = 30;
const Grid: React.FC<{ f: number }> = ({ f }) => {
  if (f < 240 || f >= 350) return null;
  const tIn = prog(f, 240, 274, Easing.inOut(Easing.cubic));
  const tOut = prog(f, 328, 350, Easing.inOut(Easing.cubic));
  const tilt = tIn * (1 - tOut);
  const s = lerp(lerp(2, 1.02, tIn), 2.1, tOut);
  const drift = (f - 240) * tilt;
  const others = prog(f, 243, 264) * (1 - prog(f, 328, 345));
  const cx = (COLS - 1) / 2;
  const cy = (ROWS - 1) / 2;
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 540,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `rotateX(${34 * tilt}deg) rotateZ(${-12 * tilt}deg) scale(${s}) translate(${-0.45 * drift}px, ${-0.22 * drift}px)`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const hero = col === cx && row === cy;
          const dist = Math.hypot(col - cx, row - cy);
          const o = hero ? 1 : others * interpolate(dist, [1, 5], [0.95, 0.5], { extrapolateRight: "clamp" });
          if (o <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (col - cx) * (TILE_W + GAP) - TILE_W / 2,
                top: (row - cy) * (TILE_H + GAP) - TILE_H / 2,
                width: TILE_W,
                height: TILE_H,
                borderRadius: 14,
                background: C.surface,
                border: hero ? `1px solid ${C.red}` : `1px solid ${C.border}`,
                boxShadow: hero ? "0 0 30px rgba(239,35,60,0.35)" : "none",
                opacity: o,
              }}
            >
              {hero ? (
                <TileContent {...HERO_TILE} />
              ) : (
                <TileContent
                  title={OTHER_TITLES[(col * 5 + row * 3) % OTHER_TITLES.length]}
                  repo={OTHER_REPOS[(col * 3 + row) % OTHER_REPOS.length]}
                />
              )}
            </div>
          );
        })}
      </div>
      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(9,9,11,0.94) 0%, rgba(9,9,11,0.7) 22%, rgba(9,9,11,0) 46%)",
          opacity: tilt,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- shot 5: pull-request card ---------- */
const PR_W = 900;
const PR_H = 470;
const PR_Y = -80;
const PrCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < 350 || f > 410) return null;
  const t = prog(f, 350, 366);
  const w = lerp(TILE_W * 2.1, PR_W, t);
  const h = lerp(TILE_H * 2.1, PR_H, t);
  const y = lerp(0, PR_Y, t);
  const tile = 1 - prog(f, 346, 357);
  const pr = prog(f, 355, 367);
  const away = prog(f, 398, 409, Easing.in(Easing.quad));
  return (
    <At y={y} transform={`scale(${lerp(1, 0.94, away)})`} style={{ opacity: 1 - away }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 28,
          background: C.surface,
          border: `2px solid ${mix(C.red, C.borderStrong, t)}`,
          boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
          position: "relative",
          overflow: "hidden",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: tile,
            transform: "scale(2.1)",
            transformOrigin: "0 0",
          }}
        >
          <TileContent {...HERO_TILE} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PR_W,
            height: PR_H,
            padding: 48,
            boxSizing: "border-box",
            opacity: pr,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={C.secondary} strokeWidth={2}>
              <circle cx={6} cy={5} r={2.5} />
              <circle cx={6} cy={19} r={2.5} />
              <circle cx={18} cy={19} r={2.5} />
              <path d="M6 7.5v9M18 16.5V11a4 4 0 0 0-4-4h-3" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 28, color: C.secondary }}>Pull request</div>
            <div style={{ flex: 1 }} />
            <Tag size={20}>bot-authored</Tag>
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              color: C.text,
            }}
          >
            Fix README example
          </div>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 14 }}>
            <MiniGhost size={46} />
            <div style={{ fontSize: 28, color: C.secondary }}>Ghost #a1b2 · 1 file changed</div>
          </div>
        </div>
      </div>
    </At>
  );
};

/* ---------- shots 5–6: status pill that stretches into the transaction row ---------- */
const ROW_W = 1280;
const ROW_H = 160;
const FIELDS = [
  { label: "SENDER", w: 300 },
  { label: "RECIPIENT", w: 300 },
  { label: "AMOUNT", w: 250 },
];
const PillRow: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  if (f < 357 || f > 492) return null;
  const appear = prog(f, 357, 367);
  const merged = prog(f, 376, 381);
  const pulse = spring({ frame: f - 376, fps, config: { damping: 9, stiffness: 200 } });
  const st = prog(f, 404, 426, Easing.inOut(Easing.cubic));
  const pillW = lerp(150, 214, merged);
  const w = lerp(pillW, ROW_W, st);
  const h = lerp(62, ROW_H, st);
  const startX = -PR_W / 2 + 48 + pillW / 2;
  const startY = PR_Y + PR_H / 2 - 48 - 31;
  const x = lerp(startX, 0, st);
  const y = lerp(startY, -40, st);
  const col = mix(C.amber, C.green, merged);
  const leave = prog(f, 470, 489, Easing.in(Easing.cubic));
  const scale = (f >= 376 && st === 0 ? lerp(0.86, 1, pulse) : 1) * lerp(1, 0.12, leave);
  const rowIn = prog(f, 420, 431);
  return (
    <At x={x} y={lerp(y, 0, leave)} transform={`scale(${scale})`} style={{ opacity: appear * (1 - prog(f, 478, 490)) }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: lerp(31, 26, st),
          background: mix(mix("rgba(239,192,120,0.14)", "rgba(110,219,176,0.16)", merged), C.surface, st),
          border: `2px solid ${mix(col, C.borderStrong, st)}`,
          boxShadow: st > 0 ? "0 40px 90px rgba(0,0,0,0.5)" : "none",
          position: "relative",
          overflow: "hidden",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: col,
            fontSize: 28,
            fontWeight: 700,
            opacity: 1 - prog(f, 404, 411),
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, background: col }} />
          <span style={{ opacity: 1 - merged, position: "absolute", marginLeft: 22 }}>Open</span>
          <span style={{ opacity: merged, marginLeft: 0 }}>{merged > 0.5 ? "Merged" : ""}</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: ROW_W,
            height: ROW_H,
            transform: "translate(-50%, -50%)",
            padding: "0 48px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            opacity: rowIn,
          }}
        >
          {FIELDS.map((fd, i) => {
            const bar = prog(f, 438 + i * 8, 442 + i * 8, Easing.out(Easing.cubic));
            return (
              <div key={fd.label} style={{ width: fd.w }}>
                <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: "0.08em" }}>
                  {fd.label}
                </div>
                <div style={{ marginTop: 14, height: 44, width: fd.w - 70, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 9,
                      height: 26,
                      width: "82%",
                      borderRadius: 6,
                      background: C.borderStrong,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 6,
                      background: C.red,
                      transform: `scaleX(${bar})`,
                      transformOrigin: "0 50%",
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted, letterSpacing: "0.08em" }}>TX ID</div>
              <Tag size={15}>testnet</Tag>
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: MONO,
                fontSize: 36,
                color: C.text,
                whiteSpace: "nowrap",
                opacity: prog(f, 426, 436),
              }}
            >
              d7d9b789…8e54
            </div>
          </div>
        </div>
      </div>
    </At>
  );
};

/* ---------- shot 8: end card ---------- */
const EndCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < 550) return null;
  const word = prog(f, 552, 574, Easing.out(Easing.cubic));
  const tag = prog(f, 566, 580);
  const url = prog(f, 574, 588);
  return (
    <AbsoluteFill style={{ fontFamily: SANS }}>
      <div
        style={{
          position: "absolute",
          left: 960 - 370,
          top: 540 - 50 - 150,
          fontSize: 164,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 1,
          color: C.text,
          clipPath: `inset(-20% ${(1 - word) * 100}% -20% 0)`,
          whiteSpace: "nowrap",
        }}
      >
        GhostCommits<span style={{ color: C.accent }}>.</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 - 362,
          top: 540 + 50,
          fontSize: 60,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: C.secondary,
          opacity: tag,
          transform: `translateY(${lerp(20, 0, tag)}px)`,
          whiteSpace: "nowrap",
        }}
      >
        Public code. Your own identity.
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 540 + 330,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          fontFamily: MONO,
          fontSize: 38,
          color: C.text,
          opacity: url,
        }}
      >
        ghostcommits.netlify.app
        <Tag size={24}>Zcash testnet MVP</Tag>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- composition ---------- */
export const GhostAd: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {/* Soundtrack generated by audio/make_sound.py */}
      <Html5Audio src={staticFile("audio/v1.wav")} />
      <Stage f={f} />
      <Grid f={f} />
      <SubmitCard f={f} fps={fps} />
      <PrCard f={f} />
      <PillRow f={f} fps={fps} />
      <HeroShape f={f} fps={fps} />
      <Lines f={f} lines={["Build in public.", "Stay private."]} inAt={92} outAt={140} y={40} />
      <Lines
        f={f}
        lines={["One file.", "No GitHub login."]}
        inAt={194}
        outAt={220}
        x={-10}
        y={-112}
        size={100}
        align="left"
      />
      <Lines f={f} lines={["Pick a bounty."]} inAt={274} outAt={318} y={300} />
      <Lines f={f} lines={["Reviewed. Merged."]} inAt={379} outAt={396} y={250} />
      <Lines f={f} lines={["Rewarded in shielded Zcash."]} inAt={430} outAt={464} y={150} size={104} />
      <EndCard f={f} />
    </AbsoluteFill>
  );
};
