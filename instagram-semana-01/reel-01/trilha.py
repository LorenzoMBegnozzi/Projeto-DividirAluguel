"""Trilha lo-fi original do reel-01, sintetizada do zero (numpy): python trilha.py
100 BPM, 4/4 (batida = 0,6 s, compasso = 2,4 s). Toca de 0 a 15 s com fade de 14 a 15 s,
antes da assinatura. Sai em assets/music/trilha.wav já normalizada a -18 LUFS."""
import pathlib, subprocess, wave
import numpy as np

SR = 48000
BPM = 100
BEAT = 60 / BPM
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(100)
raiz = pathlib.Path(__file__).parent


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def place(buf, sig, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i:i + len(sig)] += sig * gain


def lowpass(sig, cutoff):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def highpass(sig, cutoff):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 - 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def kick():
    t = t_axis(0.4)
    freq = 50 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 8)


def snare():
    t = t_axis(0.28)
    noise = highpass(rng.standard_normal(len(t)), 1500) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25)
    return lowpass(noise * 0.45 + body * 0.5, 5000)


def hat():
    t = t_axis(0.06)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70)


def keys(freqs, sec):
    """Piano elétrico: senoides com 2º harmônico, ataque macio e tremolo lento."""
    t = t_axis(sec)
    sig = sum(np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) for f in freqs)
    env = np.minimum(1, t / 0.02) * np.exp(-t * 0.9)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    return lowpass(sig * env * trem / len(freqs), 2400)


def bass(f, sec):
    t = t_axis(sec)
    return lowpass(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 1.6), 400)


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# Fmaj7 / Em7 / Dm7 / Cmaj7, um compasso cada
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
roots = [41, 40, 38, 36]

mix = np.zeros(N)
bar = 4 * BEAT
nbars = int(np.ceil(DUR / bar))
swing = 0.06  # colcheia atrasada, cara de lo-fi
for b in range(nbars):
    t0 = b * bar
    c = chords[b % 4]
    place(mix, keys([note(m) for m in c], bar + 0.4), t0, 0.55)
    place(mix, keys([note(c[-1] + 12)], 0.6), t0 + 2.5 * BEAT, 0.18)
    place(mix, bass(note(roots[b % 4]), bar), t0, 0.5)
    for k in range(4):
        place(mix, kick() if k in (0, 2) else snare(), t0 + k * BEAT, 0.7 if k in (0, 2) else 0.35)
        place(mix, hat(), t0 + k * BEAT, 0.12)
        place(mix, hat(), t0 + k * BEAT + BEAT / 2 + swing, 0.08)
    place(mix, kick(), t0 + 2.5 * BEAT + swing, 0.4)

# chiado de vinil bem baixo
crackle = (rng.random(N) > 0.9993) * rng.standard_normal(N) * 0.3 + rng.standard_normal(N) * 0.004
mix += lowpass(crackle, 6000)
mix = lowpass(mix, 7000)

# fade de 14 a 15 s, antes da assinatura
t = np.arange(N) / SR
mix *= np.clip((15.0 - t) / 1.0, 0, 1) ** 1.5
mix *= np.minimum(1, t / 0.03)
mix /= np.abs(mix).max() * 1.05

saida = raiz / "assets" / "music"
saida.mkdir(parents=True, exist_ok=True)
bruto = saida / "trilha-bruta.wav"
with wave.open(str(bruto), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

# normaliza a -18 LUFS (loudnorm em dois passos, sem limitar o pico)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af",
                "loudnorm=I=-18:TP=-2:LRA=11:linear=true", "-ar", str(SR), "-ac", "2", str(saida / "trilha.wav")], check=True)
bruto.unlink()
print("ok", saida / "trilha.wav")
