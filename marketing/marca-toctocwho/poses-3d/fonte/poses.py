"""As poses novas do mascote (caranguejo-eremita com a concha), sobre o caranguejo.glb da landing.
Cada pose parte de um quadro da animação 'cena' (t) e sobrescreve nós: p = posição, dp = soma na
posição, r = rotação XYZ (rad), s = escala. A concha é um nó solto: quando o caranguejo se mexe,
ela precisa se mexer junto."""
import json, math
X0 = -0.6                      # onde o caranguejo laranja está aos 3,0 s, com a concha nas costas
SHELL = [X0, 0.86, -0.42]      # concha nas costas
H = ["praia", "pequeno"]
OLHOS = ["laranja-olho", "laranja-olho_1"]

def cam(az=0, el=10, dist=6.6, target=(X0, 0.8, 0), fov=28):
    return {"az": az, "el": el, "dist": dist, "target": list(target), "fov": fov}

def junto(dy=0.0, dx=0.0):
    """caranguejo e concha deslocados juntos"""
    return {"laranja": {"p": [X0 + dx, dy, 0]}, "concha": {"p": [SHELL[0] + dx, SHELL[1] + dy, SHELL[2]], "r": [0, 0, 0]}}

def dentro(escala, fundo=0.0, ry=1.4):
    """caranguejo encolhido dentro da boca da concha, com a boca virada para a câmera"""
    boca = [0.0, 0.62, 0.0]
    f = [math.sin(ry), 0, math.cos(ry)]
    pos = [boca[0] - f[0] * fundo, boca[1] - 0.55 * escala, boca[2] - f[2] * fundo]
    return {"concha": {"p": boca, "r": [-1.5708, ry, 0]},
            "laranja": {"p": pos, "r": [0, ry, 0], "s": [escala] * 3}}

P = {}
P["acenando"] = {"t": 3.0, "hide": H, "set": {**junto(), "laranja-garra-d": {"r": [0, 0, 1.15]}}, "cam": cam(az=18, el=8)}
P["comemorando"] = {"t": 3.0, "hide": H, "set": {**junto(dy=0.35), "laranja-garra-d": {"r": [0, 0, 1.05]}, "laranja-garra-e": {"r": [0, 0, -1.05]}}, "cam": cam(az=-14, el=6, target=(X0, 1.0, 0))}
P["piscando"] = {"t": 3.0, "hide": H, "blink": ["d"], "set": {**junto(), "laranja-garra-d": {"r": [0, 0, 0.7]}}, "cam": cam(az=-10, el=3, dist=5.6, target=(X0, 0.9, 0))}
P["andando"] = {"t": 1.02, "hide": H, "set": junto(dy=0.03), "cam": cam(az=55, el=9)}
P["de-perfil"] = {"t": 3.0, "hide": H, "set": junto(), "cam": cam(az=88, el=6, dist=7)}
P["visto-de-cima"] = {"t": 3.0, "hide": H, "set": junto(), "cam": cam(az=0, el=38, dist=6.8, target=(X0, 0.7, -0.1))}
P["jogando-a-concha"] = {"t": 3.0, "hide": H, "set": {"laranja": {"p": [X0, 0, 0]}, "concha": {"p": [X0 + 0.05, 1.7, -0.15], "r": [0.15, 0.3, 0.12]},
    "laranja-garra-d": {"r": [0, 0, 1.35]}, "laranja-garra-e": {"r": [0, 0, -1.35]}}, "cam": cam(az=12, el=4, dist=7.0, target=(X0, 1.15, 0))}
P["casa-nova"] = {"t": 5.0, "hide": H, "cam": cam(az=8, el=10, dist=7.0, target=(0.0, 0.6, 0))}
P["espiando"] = {"t": 3.0, "hide": H, "set": dentro(0.7, fundo=-0.35), "cam": cam(az=80, el=12, dist=5.6, target=(0.05, 0.75, 0))}
P["cochilando"] = {"t": 3.0, "hide": H, "blink": ["e", "d"], "set": {**dentro(0.66, fundo=-0.35),
    "laranja-garra-d": {"r": [0, 0.6, 0]}, "laranja-garra-e": {"r": [0, -0.6, 0]}}, "cam": cam(az=80, el=18, dist=5.6, target=(0.05, 0.75, 0))}
open("poses.json", "w").write(json.dumps(P, indent=1))
print(len(P), "poses")
