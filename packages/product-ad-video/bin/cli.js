#!/usr/bin/env node
/* product-ad-video: the code behind the Product Ad Video plugin for Claude Code.
   Copies the Remotion template, renders 3D logo frames in Blender, builds the soundtrack,
   and generates voiceover lines. Rendering the final MP4 is Remotion's own CLI. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PKG = require(path.join(ROOT, "package.json"));
const SCRIPTS = path.join(ROOT, "scripts");

const HELP = `product-ad-video ${PKG.version}

Usage: npx product-ad-video@${PKG.version} <command> [args]

  init [dir] [--logo file.svg]     copy the Remotion template into dir (default: ad)
  doctor                           check Node, Python (numpy, scipy) and Blender
  frames <ad.json> still [outdir]  render one still per shot with Blender (default: out/stills)
  frames <ad.json> anim [outdir]   render every 3D frame (default: public/frames)
  sound <ad.json> [out.wav]        build the soundtrack (default: public/audio/soundtrack.wav)
  score <cues.json>                build a soundtrack from a hand-written cue sheet
  voice <lines.txt> <outdir> [voice ...]
                                   generate voiceover lines with the hosted Kokoro demo
                                   (sends only those lines to hexgrad-kokoro-tts.hf.space)

  render [out.mp4]                 render the video with the project's Remotion (default: out/ad.mp4)
  still <frame> [out.png]          render one frame, to check a shot
  studio                           open the Remotion preview

Run render, still, studio, frames and sound from the ad folder, after \`npm install\`.

Environment: BLENDER=/path/to/blender, PYTHON=/path/to/python
Docs: ${PKG.homepage}`;

const die = (msg) => {
  console.error(`product-ad-video: ${msg}`);
  process.exit(1);
};

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.error) die(`could not start ${cmd}: ${r.error.message}`);
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const works = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  return !r.error && r.status === 0 ? (r.stdout || r.stderr || "").trim() : null;
};

/* ---------------------------------------------------------------- python */
function findPython() {
  const tries = [];
  if (process.env.PYTHON) tries.push([process.env.PYTHON, []]);
  tries.push(["python3", []], ["python", []]);
  if (process.platform === "win32") tries.push(["py", ["-3"]]);
  /* prefer the first Python 3 that already has numpy + scipy; else the first Python 3 */
  let first = null;
  for (const [cmd, pre] of tries) {
    const v = works(cmd, [...pre, "--version"]);
    if (!v || !/Python 3\./.test(v)) continue;
    const found = { cmd, pre, version: v };
    if (works(cmd, [...pre, "-c", "import numpy, scipy"]) !== null) return found;
    first = first || found;
  }
  return first;
}

function python(script, args) {
  const py = findPython();
  if (!py) die("Python 3 not found. Install it (with numpy and scipy) or set PYTHON=/path/to/python.");
  run(py.cmd, [...py.pre, path.join(SCRIPTS, script), ...args]);
}

/* ---------------------------------------------------------------- blender */
function steamLibraries() {
  const roots = [];
  const vdfs = [
    "C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf",
    "C:\\Program Files\\Steam\\steamapps\\libraryfolders.vdf",
    path.join(os.homedir(), ".steam", "steam", "steamapps", "libraryfolders.vdf"),
    path.join(os.homedir(), "Library", "Application Support", "Steam", "steamapps", "libraryfolders.vdf"),
  ];
  for (const f of vdfs) {
    try {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/"path"\s+"([^"]+)"/g)) roots.push(m[1].replace(/\\\\/g, "\\"));
    } catch {
      /* no Steam here */
    }
  }
  return roots;
}

function findBlender() {
  const candidates = [];
  if (process.env.BLENDER) candidates.push(process.env.BLENDER);
  candidates.push("blender");
  if (process.platform === "win32") {
    for (const base of ["C:\\Program Files\\Blender Foundation", "C:\\Program Files (x86)\\Blender Foundation"]) {
      try {
        for (const d of fs.readdirSync(base).sort().reverse()) candidates.push(path.join(base, d, "blender.exe"));
      } catch {
        /* not installed here */
      }
    }
    for (const lib of [...steamLibraries(), "C:\\SteamLibrary", "D:\\SteamLibrary", "E:\\SteamLibrary"])
      candidates.push(path.join(lib, "steamapps", "common", "Blender", "blender.exe"));
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Blender.app/Contents/MacOS/Blender");
    for (const lib of steamLibraries()) candidates.push(path.join(lib, "steamapps", "common", "Blender", "Blender.app", "Contents", "MacOS", "Blender"));
  } else {
    candidates.push("/usr/bin/blender", "/snap/bin/blender", "/var/lib/flatpak/exports/bin/org.blender.Blender");
    for (const lib of steamLibraries()) candidates.push(path.join(lib, "steamapps", "common", "Blender", "blender"));
  }
  for (const c of candidates) {
    if (c !== "blender" && !fs.existsSync(c)) continue;
    const v = works(c, ["--version"]);
    if (v) return { cmd: c, version: v.split("\n")[0] };
  }
  return null;
}

/* ---------------------------------------------------------------- commands */
function init(args) {
  let dir = "ad";
  let logo = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--logo") logo = args[++i];
    else dir = args[i];
  }
  const dest = path.resolve(dir);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length) die(`${dest} already exists and isn't empty. Pick another folder.`);
  fs.cpSync(path.join(ROOT, "template"), dest, { recursive: true });
  fs.renameSync(path.join(dest, "gitignore"), path.join(dest, ".gitignore"));
  if (logo) {
    if (!/\.svg$/i.test(logo)) die("--logo must be an .svg file");
    fs.copyFileSync(path.resolve(logo), path.join(dest, "public", "logo.svg"));
  }
  console.log(`Created ${dest}
Next:
  1. edit ${path.join(dir, "ad.json")}${logo ? "" : " and put your logo at " + path.join(dir, "public", "logo.svg")}
  2. cd ${dir} && npm install
  3. npx product-ad-video@${PKG.version} sound ad.json     (and frames, for the apple3d style)
  4. npx product-ad-video@${PKG.version} render`);
}

function doctor() {
  let ok = true;
  const line = (good, label, detail) => {
    if (!good) ok = false;
    console.log(`${good ? "ok  " : "MISS"}  ${label}${detail ? ": " + detail : ""}`);
  };
  const major = Number(process.versions.node.split(".")[0]);
  line(major >= 18, "Node.js 18+", process.version);
  const py = findPython();
  line(!!py, "Python 3", py ? `${py.cmd} (${py.version})` : "not found");
  if (py) {
    const libs = works(py.cmd, [...py.pre, "-c", "import numpy, scipy; print(numpy.__version__, scipy.__version__)"]);
    line(!!libs, "numpy + scipy", libs || "missing: pip install numpy scipy");
  }
  const bl = findBlender();
  console.log(`${bl ? "ok  " : "--  "}  Blender (apple3d style only): ${bl ? `${bl.cmd} (${bl.version})` : "not found; set BLENDER=/path/to/blender, or use a 2D style"}`);
  process.exit(ok ? 0 : 1);
}

function frames(args) {
  const [spec, mode = "still", out] = args;
  if (!spec || !["still", "anim"].includes(mode)) die("usage: frames <ad.json> still|anim [outdir]");
  const bl = findBlender();
  if (!bl) die("Blender 4.2+ not found. Set BLENDER=/path/to/blender, or use a 2D style (wrapped, terminal, minimal).");
  const outdir = path.resolve(out || (mode === "still" ? "out/stills" : "public/frames"));
  console.log(`Using ${bl.cmd} (${bl.version})`);
  run(bl.cmd, ["-b", "--factory-startup", "-P", path.join(SCRIPTS, "logo_ad.py"), "--", path.resolve(spec), mode, outdir]);
}

/* Remotion's CLI comes from the ad project's own node_modules (installed by `npm install`). */
function remotion(args) {
  const bin = path.resolve("node_modules", ".bin", process.platform === "win32" ? "remotion.cmd" : "remotion");
  if (!fs.existsSync(bin)) die("Remotion isn't installed here. Run this from the ad folder after `npm install`.");
  run(bin, args, { shell: process.platform === "win32" });
}

const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case "render": remotion(["render", "Ad", rest[0] || "out/ad.mp4", ...rest.slice(1)]); break;
  case "still": remotion(["still", "Ad", rest[1] || `out/still-${rest[0] || 0}.png`, `--frame=${rest[0] || 0}`, ...rest.slice(2)]); break;
  case "studio": remotion(["studio", ...rest]); break;
  case "init": init(rest); break;
  case "doctor": doctor(); break;
  case "frames": frames(rest); break;
  case "sound": python("auto_cues.py", rest.map((a, i) => (i < 2 ? path.resolve(a) : a))); break;
  case "score": python("score.py", rest.map((a) => path.resolve(a))); break;
  case "voice": python("kokoro_tts.py", rest.map((a, i) => (i < 2 ? path.resolve(a) : a))); break;
  case "-v": case "--version": console.log(PKG.version); break;
  default: console.log(HELP); process.exit(cmd && !["-h", "--help", "help"].includes(cmd) ? 1 : 0);
}
