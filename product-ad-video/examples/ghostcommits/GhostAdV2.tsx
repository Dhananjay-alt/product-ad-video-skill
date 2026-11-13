import React from "react";
import { AbsoluteFill, Easing, Html5Audio, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: SANS } = loadInter("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
const { fontFamily: MONO } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

const C = { text: "#f5f5f7", secondary: "#b0b0ba", accent: "#fa5268", borderStrong: "#46464f" };

const ease = Easing.bezier(0.23, 1, 0.32, 1);
const prog = (f: number, a: number, b: number, e: (n: number) => number = ease) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Blender renders frames 1..540 into public/v2 as f0001.jpg … f0540.jpg */
const Plate: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Img
      src={staticFile(`v2/f${String(f + 1).padStart(4, "0")}.jpg`)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

/* Big stat plus a short caption, lower left — the product-ad convention */
const Stat: React.FC<{
  f: number;
  inAt: number;
  outAt: number;
  big: string[];
  caption: string[];
  bigSize?: number;
  scrim?: boolean;
}> = ({ f, inAt, outAt, big, caption, bigSize = 190, scrim = false }) => {
  if (f < inAt - 12 || f > outAt + 12) return null;
  const out = prog(f, outAt, outAt + 9, Easing.in(Easing.quad));
  const row = (i: number) => {
    const a = prog(f, inAt + i * 5, inAt + i * 5 + 14);
    return { opacity: a * (1 - out), transform: `translateY(${lerp(30, 0, a)}px)` };
  };
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: C.text }}>
      {scrim ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.72) 30%, rgba(0,0,0,0) 58%)",
            opacity: prog(f, inAt - 12, inAt + 4) * (1 - out),
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: 140, bottom: 170 }}>
        {big.map((l, i) => (
          <div
            key={l}
            style={{
              fontSize: bigSize,
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
              whiteSpace: "nowrap",
              ...row(i),
            }}
          >
            {l}
          </div>
        ))}
        <div style={{ marginTop: 26 }}>
          {caption.map((l, i) => (
            <div
              key={l}
              style={{
                fontSize: 48,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                lineHeight: 1.22,
                color: C.text,
                whiteSpace: "nowrap",
                ...row(big.length + i),
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Same layout as the 2D version: the 3D ghost settles exactly where the logo tile sits */
const EndCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < 492) return null;
  const word = prog(f, 494, 516, Easing.out(Easing.cubic));
  const tag = prog(f, 506, 520);
  const url = prog(f, 514, 528);
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
        <span
          style={{
            fontSize: 24,
            color: C.secondary,
            border: `1px solid ${C.borderStrong}`,
            borderRadius: 999,
            padding: "6px 17px",
          }}
        >
          Zcash testnet MVP
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const GhostAdV2: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = prog(f, 0, 10, Easing.out(Easing.quad));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Soundtrack generated by audio/make_sound.py */}
      <Html5Audio src={staticFile("audio/v2.wav")} />
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <Plate f={f} />
      </AbsoluteFill>
      <Stat
        f={f}
        inAt={100}
        outAt={136}
        big={["Meet your", "Ghost."]}
        caption={["A signing key made", "in your browser."]}
        bigSize={150}
      />
      <Stat
        f={f}
        inAt={162}
        outAt={220}
        big={["0"]}
        caption={["personal GitHub", "logins needed."]}
        bigSize={260}
        scrim
      />
      <Stat
        f={f}
        inAt={262}
        outAt={306}
        big={["1 file"]}
        caption={["per contribution, opened", "as a bot-authored PR."]}
      />
      <Stat
        f={f}
        inAt={350}
        outAt={391}
        big={["Shielded"]}
        caption={["Zcash testnet rewards. Sender,", "recipient and amount stay hidden."]}
        bigSize={170}
      />
      <EndCard f={f} />
    </AbsoluteFill>
  );
};
