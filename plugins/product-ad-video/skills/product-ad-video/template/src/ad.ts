/* Single source of truth: ad.json. Timing here must match scripts/adspec.py. */
import raw from "../ad.json";

export type Shot = { big: string; caption?: string };
export type Style = "apple3d" | "wrapped" | "terminal" | "minimal";
export type AdSpec = {
  name: string;
  tagline: string;
  url?: string;
  badge?: string;
  logo?: string;
  colors: { bg: string; text: string; secondary: string; accent: string; palette?: string[] };
  style: Style;
  aspect: "landscape" | "vertical" | "square";
  hook?: string;
  command?: string;
  shots: Shot[];
};

export const AD = raw as unknown as AdSpec;

export const FPS = 30;
export const HOOK = 75; // opening shot
export const SHOT = 85; // each stat shot
export const END = 135; // end card
export const shotStart = (i: number) => HOOK + SHOT * i;
export const END_START = shotStart(AD.shots.length);
/* frame the end-card text lands (and the music hits): later for 3D so the hero can settle */
export const END_HIT = END_START + (AD.style === "apple3d" ? 70 : 20);
export const TOTAL = END_START + END;

export const SIZE = {
  landscape: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
}[AD.aspect];
