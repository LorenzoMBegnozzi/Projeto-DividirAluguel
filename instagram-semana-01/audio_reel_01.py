"""Trilha original do reel-01, sintetizada do zero (numpy): python audio_reel_01.py
Gera saida/reel-01-trilha.wav e saida/reel-01-com-som.mp4 (vídeo de saida/reel-01.mp4 + trilha, AAC, -14 LUFS).
Os tempos seguem src/reel-01.html: mude lá, mude aqui."""
import pathlib, subprocess, wave
import numpy as np

SR = 44100
DUR = 15.0
BPM = 90
BEAT = 60 / BPM            # 0,667 s; 8,0 s = início do 4º compasso
N = int(SR * DUR)
rng = np.random.default_rng(7)
raiz = pathlib.Path(__file__).parent


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i:i + len(sig)] += sig * gain


def lowpass(sig, cutoff):
    """Passa-baixa suave via FFT (sem fase)."""
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def highpass(sig, cutoff):
    spec = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    spec *= 1 - 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(sig))


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


# ---------- instrumentos ----------
def kick():
    t = t_axis(0.45)
    freq = 48 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7.5)


def snare():
    t = t_axis(0.3)
    noise = highpass(rng.standard_normal(len(t)), 1200) * np.exp(-t * 16)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22)
    return lowpass(noise * 0.5 + body * 0.6, 6000)


def hat(open_=False):
    t = t_axis(0.18 if open_ else 0.06)
    return highpass(rng.standard_normal(len(t)), 7000) * np.exp(-t * (18 if open_ else 70)) * 0.35


def note_hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def keys(midis, sec):
    """Piano elétrico: senoides com harmônicos, ataque macio e um leve tremolo."""
    t = t_axis(sec)
    out = np.zeros(len(t))
    for m in midis:
        f = note_hz(m) * (1 + rng.uniform(-0.0015, 0.0015))
        out += (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3)
                + 0.08 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6))
    out *= env(len(t), 0.012, 1.6) * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))
    return out / len(midis)


def bass(midi, sec):
    t = t_axis(sec)
    f = note_hz(midi)
    return np.tanh(1.6 * np.sin(2 * np.pi * f * t)) * env(len(t), 0.01, 0.9) * np.minimum(1, (sec - t) / 0.05)


def blip(freq, sec=0.09, decay=40):
    t = t_axis(sec)
    f = freq * (1 + 0.35 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 1 / decay)


def bell(midis, sec=2.2):
    t = t_axis(sec)
    out = sum(np.sin(2 * np.pi * note_hz(m) * t) + 0.3 * np.sin(2 * np.pi * note_hz(m) * 2.76 * t) * np.exp(-t * 4)
              for m in midis)
    return out * env(len(t), 0.004, 0.9) / len(midis)


# Fmaj7, Em7, Dm7, Cmaj7: um acorde por compasso
CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
ROOTS = [41, 40, 38, 36]
BAR = 4 * BEAT

intro = np.zeros(N)   # 0 a 7,7 s, abafada
full = np.zeros(N)    # 8,0 a 15 s, cheia
sfx = np.zeros(N)

# ---------- 0 a 7,7 s: batida abafada ----------
for b in range(int(7.7 / BEAT)):
    at = b * BEAT
    if b % 4 in (0, 2) or b % 8 == 7:
        place(intro, kick(), at, 0.9)
    if b % 4 == 0:
        bar = b // 4
        place(intro, keys(CHORDS[bar % 4], BAR), at, 0.55)
    if b % 4 in (1, 3) and at > 2.4:
        place(intro, snare(), at, 0.35)
intro = lowpass(intro, 650)
intro[int(7.7 * SR):] *= np.exp(-np.arange(N - int(7.7 * SR)) / SR * 40)   # a batida para em 7,7 s

# vinil de fundo o vídeo inteiro
crackle = np.zeros(N)
for at in rng.uniform(0, DUR, 260):
    place(crackle, highpass(rng.standard_normal(80), 3000) * np.hanning(80), at, rng.uniform(0.05, 0.18))
sfx += lowpass(rng.standard_normal(N), 2500) * 0.012 + crackle

# ---------- 8,0 a 15 s: batida cheia ----------
start = 8.0
for b in range(int((DUR - start) / BEAT) + 1):
    at = start + b * BEAT
    if at >= DUR:
        break
    beat_in_bar = b % 4
    if beat_in_bar in (0, 2) or (beat_in_bar == 3 and b % 8 == 7):
        place(full, kick(), at, 1.0)
    if beat_in_bar in (1, 3):
        place(full, snare(), at, 0.6)
    place(full, hat(), at, 0.5)
    place(full, hat(open_=b % 4 == 3), at + BEAT / 2 + 0.02, 0.42)   # um pouco de swing
    if beat_in_bar == 0:
        bar = (3 + b // 4) % 4
        last = at + BAR > DUR - 0.01
        place(full, keys(CHORDS[bar], min(BAR, DUR - at)), at, 0.6)
        place(full, bass(ROOTS[bar], 1.5 * BEAT), at, 0.35)
        place(full, bass(ROOTS[bar] + 7, 0.9 * BEAT), at + 2.5 * BEAT, 0.28)
full = lowpass(full, 9000)
# acorde final no último tempo e fade nos últimos 0,6 s
place(full, keys([48, 52, 55, 59, 64], 1.2), 14.0, 0.5)
fade = np.ones(N)
fade[int(14.4 * SR):] = np.linspace(1, 0, N - int(14.4 * SR))

# ---------- efeitos sincronizados com a animação ----------
# balões: mesma fórmula de src/reel-01.html (20 mensagens entre 2,6 e 5,2 s)
for i in range(20):
    u = i / 19
    at = 2.6 + 2.6 * (1 - (1 - u) ** 1.8)
    place(sfx, blip(rng.uniform(900, 1500)), at, 0.22)
# tremida 5,5 a 6,0 s: ronco grave
t = t_axis(0.55)
place(sfx, lowpass(rng.standard_normal(len(t)), 160) * np.sin(np.pi * t / 0.55) * 2.2, 5.5, 0.9)
# queda 6,0 a 7,3 s: assobio descendente
t = t_axis(1.3)
sweep = np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-t * 2.2) + 120) / SR)
place(sfx, sweep * np.exp(-t * 1.6) * np.minimum(1, t / 0.05), 6.0, 0.12)
# contagem 0 a 92% (8,35 a 9,0 s): tiques que sobem
for k in range(14):
    x = k / 13
    at = 8.35 + 0.65 * (1 - (1 - x) ** (1 / 3)) if x < 1 else 9.0
    place(sfx, blip(700 + 900 * x, 0.05, 70), at, 0.16)
place(sfx, bell([84, 88]), 9.0, 0.22)            # chegou nos 92%
for k, at in enumerate((9.3, 9.8, 10.3)):        # chips
    place(sfx, blip(1100 + 160 * k, 0.12, 25), at, 0.2)
place(sfx, bell([72, 76, 79, 84], 2.8), 12.1, 0.3)   # logo

mix = intro * 0.8 + full * fade * 0.85 + sfx
mix = np.tanh(mix * 1.1) * 0.9
stereo = np.stack([mix, np.roll(mix, int(0.008 * SR)) * 0.97 + mix * 0.03], axis=1)
wav = raiz / 'saida' / 'reel-01-trilha.wav'
with wave.open(str(wav), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(stereo, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', wav.name)

mp4 = raiz / 'saida' / 'reel-01-com-som.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raiz / 'saida' / 'reel-01.mp4'), '-i', str(wav),
                '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', str(mp4)], check=True)
print('ok', mp4.name)
