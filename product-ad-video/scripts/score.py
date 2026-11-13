"""Score a motion-graphics video in code: synthesized sound effects + a music bed + optional voiceover.

    python score.py cues.json

cues.json (frames are video frames, so cues stay locked to the animation):
{
  "out": "public/audio/soundtrack.wav",
  "fps": 30, "duration": 18.0,
  "end_frame": 494,          # frame of the end-card hit (music resolves here)
  "break_frame": 406,        # drums drop out here for the build-up
  "cues": [ {"frame": 0, "sound": "swell", "args": [1.3], "gain": 0.35},
            {"frame": 76, "sound": "whoosh", "kwargs": {"dur": 1.1}, "gain": 0.5} ],
  "voiceover": [ {"file": "public/audio/vo/vo-1.wav", "start": 0.6} ]
}
Sounds: whoosh air suck swell riser pop tick click thud impact cut_hit chime lock glint morph hum
Needs: numpy, scipy.
"""
import json
import os
import sys

import numpy as np
import scipy.signal as ss
from scipy.io import wavfile

SR = 48000
FPS = 30
BPM = 96
BEAT = 60 / BPM          # 0.625 s
BAR = 4 * BEAT           # 2.5 s = 75 frames, a typical shot length
RNG = np.random.default_rng(11)

# ------------------------------------------------------------------ basics
def n_of(sec):
    return int(round(sec * SR))


def tvec(dur):
    return np.arange(n_of(dur)) / SR


def norm(x):
    m = np.max(np.abs(x))
    return x / m if m > 0 else x


def lp(x, fc, order=2):
    return ss.sosfilt(ss.butter(order, fc, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return ss.sosfilt(ss.butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return ss.sosfilt(ss.butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def noise(n):
    return RNG.standard_normal(n)


def pan(mono, p=0.0):
    """Equal-power pan; p is a number or a per-sample array in -1..1. Centre = unity per channel."""
    p = np.broadcast_to(np.asarray(p, dtype=float), mono.shape)
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1) * np.sqrt(2)


def osc(freq, n):
    """Sine whose frequency may vary per sample."""
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def saw(freq, n, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((freq * t + phase) % 1.0) - 1


def shaped_noise(dur, fc, width_oct=1.2):
    """White noise through a band-pass whose centre follows fc(u), u = 0..1 over the sound."""
    n = n_of(dur)
    x = noise(n + 2048)
    f, t, Z = ss.stft(x, SR, nperseg=1024, noverlap=768)
    u = np.clip(t / dur, 0, 1)
    centre = np.log2(np.maximum(fc(u), 20.0))
    logf = np.log2(np.maximum(f, 1.0))[:, None]
    mask = np.exp(-0.5 * ((logf - centre[None, :]) / (width_oct / 2)) ** 2)
    _, y = ss.istft(Z * mask, SR, nperseg=1024, noverlap=768)
    return norm(y[:n])


def fade_edges(x, a=0.002, r=0.01):
    na, nr = n_of(a), n_of(r)
    if na:
        x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    if nr:
        x[-nr:] *= np.linspace(1, 0, nr)[:, None] if x.ndim == 2 else np.linspace(1, 0, nr)
    return x


# ------------------------------------------------------------------ sound effects (each peaks at 1.0)
def whoosh(dur=0.7, f0=250, f1=2400, peak=0.55, p0=-0.6, p1=0.6, width=1.3, body=True):
    def fc(u):
        s = np.where(u < peak, u / peak, 1 - 0.6 * (u - peak) / max(1e-6, 1 - peak))
        return f0 * (f1 / f0) ** np.clip(s, 0, 1)

    y = shaped_noise(dur, fc, width)
    n = len(y)
    u = np.linspace(0, 1, n, endpoint=False)
    env = np.where(u < peak, (u / peak) ** 2.0, ((1 - u) / max(1e-6, 1 - peak)) ** 1.6)
    y = y * env
    if body:
        f = 70 + 90 * np.where(u < peak, u / peak, 1 - (u - peak) / max(1e-6, 1 - peak))
        y = y + 0.35 * osc(f, n) * env
    return fade_edges(pan(norm(y), p0 + (p1 - p0) * u))


def air(dur=0.42):
    """Light breath for text landing."""
    return whoosh(dur, 1600, 5600, 0.35, -0.15, 0.15, width=1.0, body=False)


def suck(dur=0.6, p0=0.3, p1=0.0):
    """Reverse whoosh: bright to dark, swelling into a hard stop."""
    return whoosh(dur, 2600, 450, 0.93, p0, p1, width=1.2)


def swell(dur=1.5):
    y = shaped_noise(dur, lambda u: 140 * (3800 / 140) ** (u ** 1.5), 1.8)
    n = len(y)
    u = np.linspace(0, 1, n)
    y = y * u ** 2.4 + 0.45 * osc(55 * 2 ** u, n) * u ** 2
    width = 0.35 * np.sin(2 * np.pi * u * 1.5)
    return fade_edges(pan(norm(y), width), 0.01, 0.03)


def riser(dur=2.9):
    y = shaped_noise(dur, lambda u: 180 * (7000 / 180) ** (u ** 1.3), 1.4)
    n = len(y)
    u = np.linspace(0, 1, n)
    f = 110 * 2 ** (2 * u ** 1.5)
    tone = osc(f, n) + 0.5 * osc(f * 1.5, n)
    y = y * u ** 2.2 + 0.3 * tone * u ** 2.6
    return fade_edges(pan(norm(y), 0.5 * u * np.sin(2 * np.pi * u * 3)), 0.01, 0.012)


def pop(freq=650, p=0.0):
    t = tvec(0.22)
    f = freq * (1 + 1.2 * np.exp(-t / 0.012))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.045) * (1 - np.exp(-t / 0.0015))
    y += 0.3 * np.sin(2 * ph) * np.exp(-t / 0.02)
    return fade_edges(pan(norm(y), p), 0.0, 0.01)


def tick(freq=3600, p=0.0):
    t = tvec(0.04)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.006)
    y += 0.4 * norm(hp(noise(len(t)), 5000)) * np.exp(-t / 0.0015)
    return fade_edges(pan(norm(y), p), 0.0, 0.005)


def click(p=0.0):
    t = tvec(0.1)
    y = 0.7 * norm(hp(noise(len(t)), 3500)) * np.exp(-t / 0.002)
    y += 0.6 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.01)
    y += 0.8 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.018)
    return fade_edges(pan(norm(y), p), 0.0, 0.01)


def thud(p=0.0):
    t = tvec(0.6)
    f = 45 + 110 * np.exp(-t / 0.035)
    y = osc(f, len(t)) * np.exp(-t / 0.22)
    y = np.tanh(2.2 * (y + 0.6 * norm(lp(noise(len(t)), 500)) * np.exp(-t / 0.03)))
    y += 0.25 * norm(hp(noise(len(t)), 2500)) * np.exp(-t / 0.008)
    return fade_edges(pan(norm(y), p), 0.001, 0.02)


def impact(dur=2.4):
    t = tvec(dur)
    n = len(t)
    f = 38 + 70 * np.exp(-t / 0.06)
    sub = osc(f, n) * np.exp(-t / 0.7)
    body = norm(lp(noise(n), 900)) * np.exp(-t / 0.12)
    y = np.tanh(1.6 * (sub + 0.5 * body))
    y += 0.15 * norm(hp(noise(n), 3000)) * np.exp(-t / 0.35)
    return fade_edges(pan(norm(y)), 0.002, 0.05)


def cut_hit():
    """Short low punch for a hard camera cut."""
    t = tvec(0.7)
    n = len(t)
    y = osc(42 + 60 * np.exp(-t / 0.04), n) * np.exp(-t / 0.2)
    y += 0.4 * norm(lp(noise(n), 700)) * np.exp(-t / 0.05)
    y += 0.12 * norm(hp(noise(n), 4000)) * np.exp(-t / 0.06)
    return fade_edges(pan(norm(np.tanh(1.4 * y))), 0.001, 0.03)


def chime(notes=(659.25, 987.77), gap=0.075, p=0.15):
    t = tvec(1.2)
    y = np.zeros_like(t)
    for i, f in enumerate(notes):
        tt = t - i * gap
        m = tt >= 0
        tt = np.where(m, tt, 0)
        tone = np.sin(2 * np.pi * f * tt)
        tone += 0.25 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.15)
        tone += 0.12 * np.sin(2 * np.pi * 2.76 * f * tt) * np.exp(-tt / 0.08)
        y += m * tone * (1 - np.exp(-tt / 0.003)) * np.exp(-tt / 0.32)
    return fade_edges(pan(norm(y), p), 0.0, 0.05)


def lock(p=0.0):
    t = tvec(0.4)
    y = np.zeros_like(t)
    for off, g in ((0.0, 0.6), (0.05, 1.0)):
        tt = t - off
        m = tt >= 0
        tt = np.where(m, tt, 0)
        burst = norm(bp(noise(len(t)), 2500, 6000)) * np.exp(-tt / 0.003)
        ping = 0.5 * np.sin(2 * np.pi * 1450 * tt) * np.exp(-tt / 0.045)
        ping += 0.25 * np.sin(2 * np.pi * 2960 * tt) * np.exp(-tt / 0.02)
        thunk = 0.8 * np.sin(2 * np.pi * 130 * tt) * np.exp(-tt / 0.035)
        y += m * g * (burst + ping + thunk)
    return fade_edges(pan(norm(y), p), 0.0, 0.02)


def glint(dur=1.0, p0=-0.5, p1=0.5):
    t = tvec(dur)
    n = len(t)
    u = t / dur
    y = np.zeros(n)
    for f, a in ((3100, 1.0), (4650, 0.7), (6200, 0.5), (8900, 0.3), (12100, 0.15)):
        y += a * np.sin(2 * np.pi * np.cumsum(f * (1 + 0.05 * u)) / SR + RNG.uniform(0, 2 * np.pi))
    env = (1 - np.exp(-t / 0.02)) * np.exp(-t / 0.22)
    y = y * (1 + 0.25 * np.sin(2 * np.pi * 23 * t)) * env
    y += 0.3 * norm(hp(noise(n), 6000)) * env
    return fade_edges(pan(norm(y), p0 + (p1 - p0) * u), 0.0, 0.05)


def morph(dur=0.5, f0=260, f1=820, index=3.5, p=0.0):
    """FM glide for a shape turning into another shape."""
    t = tvec(dur)
    n = len(t)
    u = t / dur
    fc = f0 * (f1 / f0) ** u
    mod = np.sin(2 * np.pi * np.cumsum(fc * 1.5) / SR)
    y = np.sin(2 * np.pi * np.cumsum(fc) / SR + (index * (1 - u) + 0.4) * mod)
    env = np.sin(np.pi * u) ** 1.2
    y = y * env + 0.4 * shaped_noise(dur, lambda v: 2 * f0 * (f1 / f0) ** v, 1.0) * env
    return fade_edges(pan(norm(y), p))


def hum(dur=2.6):
    t = tvec(dur)
    n = len(t)
    y = osc(55, n) + 0.5 * osc(110.3, n) + 0.25 * osc(165.5, n)
    y *= 1 + 0.3 * np.sin(2 * np.pi * 0.7 * t)
    env = np.minimum(1, np.minimum(t / 0.5, (dur - t) / 0.6))
    return pan(norm(lp(y * env, 400)))


# ------------------------------------------------------------------ mixing
class Bus:
    def __init__(self, dur):
        self.x = np.zeros((n_of(dur) + 3 * SR, 2))

    def add(self, snd, at, gain=1.0):
        i = n_of(at)
        j = min(len(self.x), i + len(snd))
        if j > i:
            self.x[i:j] += snd[: j - i] * gain


def make_ir(dur=1.8, tau=0.42, seed=3):
    r = np.random.default_rng(seed)
    n = n_of(dur)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], axis=1) * np.exp(-t / tau)[:, None]
    ir = lp(ir, 6500)
    ir[: n_of(0.015)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = make_ir()


def reverb(x):
    return np.stack([ss.fftconvolve(x[:, c], IR[:, c])[: len(x)] for c in range(2)], axis=1)


# ------------------------------------------------------------------ music bed (A minor, 96 BPM)
A2, C3, E3, F2, G2 = 110.0, 130.81, 164.81, 87.31, 98.0
PROG = [  # one chord per bar: Am F C G
    {"bass": A2, "pad": (220.0, 261.63, 329.63)},
    {"bass": F2, "pad": (174.61, 220.0, 261.63)},
    {"bass": C3, "pad": (196.0, 261.63, 329.63)},
    {"bass": G2, "pad": (196.0, 246.94, 293.66)},
]


def pad_chord(notes, dur, attack, release):
    n = n_of(dur + release)
    t = np.arange(n) / SR
    y = np.zeros((n, 2))
    for f in notes:
        for k, cents in enumerate((-8, 0, 8)):
            v = saw(f * 2 ** (cents / 1200), n, RNG.random())
            y += pan(v, (-0.6, 0.0, 0.6)[k])
    y = lp(lp(y, 1300), 2600)
    env = np.minimum(1, t / attack)
    env = np.where(t > dur, np.maximum(0, 1 - (t - dur) / release), env)
    return y * env[:, None]


def bass_note(f, dur=0.29):
    t = tvec(dur)
    n = len(t)
    y = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * lp(saw(f, n), 400)
    env = (1 - np.exp(-t / 0.004)) * (0.5 + 0.5 * np.exp(-t / 0.08))
    return fade_edges(pan(y * env), 0.0, 0.03)


def kick():
    t = tvec(0.35)
    y = osc(50 + 110 * np.exp(-t / 0.03), len(t)) * np.exp(-t / 0.18)
    y += 0.3 * norm(hp(noise(len(t)), 3000)) * np.exp(-t / 0.002)
    return fade_edges(pan(norm(y)), 0.0, 0.02)


def hat(open_=False):
    t = tvec(0.15 if open_ else 0.05)
    y = norm(hp(noise(len(t)), 7000)) * np.exp(-t / (0.11 if open_ else 0.025))
    return fade_edges(pan(y, 0.25), 0.0, 0.005)


def pluck(f):
    t = tvec(0.25)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.04)
    return fade_edges(norm(y * np.exp(-t / 0.09)), 0.002, 0.02)


def music(total, end_hit, break_at):
    """Pad from 0, bass+kick from 2.5 s, hats+arp from 5 s, drums drop at break_at, final chord on end_hit."""
    pads, bass, arp, drums = Bus(total), Bus(total), Bus(total), Bus(total)
    b = 0
    while b * BAR < end_hit:
        bt = b * BAR
        ch = PROG[b % 4]
        seg_end = min(bt + BAR, end_hit)
        pads.add(pad_chord(ch["pad"], seg_end - bt, 2.2 if b == 0 else 0.25, 0.45 if seg_end < end_hit else 0.1), bt)
        b += 1

    t = 2 * BEAT * 2  # 2.5 s
    eighth = BEAT / 2
    k = 0
    while t < end_hit - 1e-6:
        ch = PROG[int(t // BAR) % 4]
        if t < break_at:
            bass.add(bass_note(ch["bass"]), t, 0.8)
            if k % 2 == 0:
                drums.add(kick(), t, 0.9)
            elif t >= 5.0:
                drums.add(hat(open_=(k % 8 == 7)), t, 0.22 if k % 8 != 7 else 0.16)
        t += eighth
        k += 1

    sixteenth = BEAT / 4
    t, k = 5.0, 0
    while t < end_hit - 1e-6:
        ch = PROG[int(t // BAR) % 4]
        note = ch["pad"][(0, 1, 2, 1)[k % 4]] * 2
        arp.add(pan(pluck(note), -0.35 if k % 2 == 0 else 0.35), t, 0.18 if t < break_at else 0.24)
        t += sixteenth
        k += 1

    # sidechain: pads, bass and arp dip on every kick
    duck = np.ones(len(pads.x))
    kt = 2.5
    while kt < min(break_at, end_hit):
        i = n_of(kt)
        m = min(len(duck), i + n_of(0.5))
        duck[i:m] *= 1 - 0.5 * np.exp(-np.arange(m - i) / SR / 0.11)
        kt += BEAT
    duck = duck[:, None]

    # final chord on the end-card hit
    tail = total - end_hit + 0.5
    fin = pad_chord(PROG[0]["pad"], tail, 0.01, 0.01)
    tt = np.arange(len(fin)) / SR
    fin *= np.exp(-tt / 1.5)[:, None]
    pads.add(fin, end_hit, 1.2)
    sub_t = tvec(tail)
    bass.add(pan(np.sin(2 * np.pi * 55 * sub_t) * np.exp(-sub_t / 1.0)), end_hit, 0.9)

    melodic = pads.x * 0.55 + bass.x * 0.6 + arp.x
    melodic = melodic * duck
    mix = melodic + drums.x + 0.3 * reverb(pads.x * 0.55 + arp.x)
    return norm(mix)



# ------------------------------------------------------------------ voiceover + final mix
def load_vo(path):
    """Read a voiceover WAV (any rate, mono/stereo), resample to 48 kHz, trim silence."""
    sr, x = wavfile.read(path)
    x = x.astype(float)
    if np.abs(x).max() > 1.5:
        x /= 32768
    if x.ndim == 2:
        x = x.mean(axis=1)
    if sr != SR:
        x = ss.resample_poly(x, SR, sr)
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(0, idx[0] - n_of(0.02)): idx[-1] + n_of(0.08)]
    return fade_edges(pan(norm(x)), 0.005, 0.04)


SOUNDS = {f.__name__: f for f in (whoosh, air, suck, swell, riser, pop, tick, click, thud,
                                  impact, cut_hit, chime, lock, glint, morph, hum)}


def build(out, total, end_frame, break_frame, cues, vo=(), fps=FPS):
    sfx = Bus(total)
    for frame, snd, gain in cues:
        sfx.add(snd, frame / fps, gain)
    mus = music(total, end_frame / fps, break_frame / fps)
    bed = mus * 0.3 + sfx.x * 0.75 + 0.18 * reverb(sfx.x)
    if vo:
        voice = Bus(total)
        speaking = np.zeros(len(bed))
        for path, start in vo:
            line = load_vo(path)
            voice.add(line, start)
            speaking[n_of(start): n_of(start) + len(line)] = 1
            print(f"  vo {os.path.basename(path)}: {start:.2f}s -> {start + len(line) / SR:.2f}s")
        k = np.hanning(n_of(0.24))  # duck music + sfx by half under the voice, 120 ms ramps
        duck = 1 - 0.5 * np.clip(np.convolve(speaking, k / k.sum(), mode="same"), 0, 1)
        bed = bed * duck[:, None] + voice.x * 0.62 + 0.06 * reverb(voice.x)
    mix = bed[: n_of(total)]
    fo = n_of(0.5)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    mix *= 0.8 / np.percentile(np.abs(mix), 99.9)   # soft limiter
    mix = np.tanh(mix)
    mix *= 0.97 / np.max(np.abs(mix))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    per = [mix[n_of(s): n_of(s + 1)] for s in range(int(total))]
    rms = [20 * np.log10(np.sqrt(np.mean(p ** 2)) + 1e-9) for p in per]
    print(f"{out}: {len(cues)} cues, {total:.1f}s, peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS")
    print("  RMS dBFS per second:", " ".join(f"{r:.0f}" for r in rms))
    return out


if __name__ == "__main__":
    spec_path = sys.argv[1]
    spec = json.load(open(spec_path))
    base = os.path.dirname(os.path.abspath(spec_path))
    rel = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
    fps = spec.get("fps", FPS)
    cues = [(c["frame"], SOUNDS[c["sound"]](*c.get("args", []), **c.get("kwargs", {})), c.get("gain", 0.5))
            for c in spec["cues"]]
    vo = [(rel(v["file"]), v["start"]) for v in spec.get("voiceover", []) if os.path.exists(rel(v["file"]))]
    build(rel(spec["out"]), spec["duration"], spec["end_frame"], spec["break_frame"], cues, vo, fps)
