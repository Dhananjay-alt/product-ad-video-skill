import React from "react";
import { AbsoluteFill, Composition, Html5Audio, getStaticFiles, staticFile, useCurrentFrame } from "remotion";
import { AD, FPS, SIZE, TOTAL } from "./ad";
import { Apple3D } from "./styles/Apple3D";
import { Minimal } from "./styles/Minimal";
import { Terminal } from "./styles/Terminal";
import { Wrapped } from "./styles/Wrapped";

const STYLES = { apple3d: Apple3D, wrapped: Wrapped, terminal: Terminal, minimal: Minimal };

const Ad: React.FC = () => {
  const f = useCurrentFrame();
  const Style = STYLES[AD.style] ?? Minimal;
  const hasAudio = getStaticFiles().some((s) => s.name === "audio/soundtrack.wav");
  return (
    <AbsoluteFill>
      {hasAudio ? <Html5Audio src={staticFile("audio/soundtrack.wav")} /> : null}
      <Style f={f} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="Ad" component={Ad} durationInFrames={TOTAL} fps={FPS} width={SIZE.width} height={SIZE.height} />
);
