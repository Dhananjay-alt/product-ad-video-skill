/* Glossy 3D hero rendered by scripts/logo_ad.py into public/frames, text laid over it. */
import React from "react";
import { AbsoluteFill, Easing, Img, staticFile } from "remotion";
import { AD, END_HIT, SHOT, shotStart } from "../ad";
import { EndText, Stat, prog } from "../common";

export const Apple3D: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <AbsoluteFill style={{ opacity: prog(f, 0, 10, Easing.out(Easing.quad)) }}>
      <Img
        src={staticFile(`frames/f${String(f + 1).padStart(4, "0")}.jpg`)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
    {AD.shots.map((s, i) => (
      <Stat
        key={i}
        f={f}
        inAt={shotStart(i) + 24}
        outAt={shotStart(i) + SHOT - 16}
        big={s.big}
        caption={s.caption}
        scrim={i % 4 === 1 /* the macro move fills the frame */}
      />
    ))}
    <EndText f={f} at={END_HIT} top={0.56} />
  </AbsoluteFill>
);
