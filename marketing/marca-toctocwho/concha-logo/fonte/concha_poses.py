"""Ícones só com a concha (concha.html): 6 formatos de espiral, faixa clara alternando com o azul."""
import json
FX = [0.06, 0.22]
F = {
 "caracol":  {"voltas": 4, "crescimento": 2.0, "ponta": 0.55, "enrola": 0.5, "boca": 0.5, "faixa": FX},
 "turbante": {"voltas": 4.2, "crescimento": 2.05, "ponta": 1.55, "enrola": 0.4, "boca": 0.5, "faixa": FX},
 "torre":    {"voltas": 5.5, "crescimento": 1.7, "ponta": 2.4, "enrola": 0.3, "boca": 0.47, "faixa": FX},
 "amonite":  {"voltas": 4.5, "crescimento": 2.5, "ponta": 0.0, "enrola": 0.7, "boca": 0.3, "faixa": FX},
 "buzio":    {"voltas": 4, "crescimento": 3.2, "ponta": 0.9, "enrola": 0.35, "boca": 0.62, "achata": 1.25, "faixa": FX},
 "bolinha":  {"voltas": 3, "crescimento": 3.6, "ponta": 0.35, "enrola": 0.3, "boca": 0.55, "faixa": FX},
}
P = {
 "concha-caracol":          {"forma": F["caracol"],  "cam": {"az": 35, "el": 38}},
 "concha-caracol-de-cima":  {"forma": F["caracol"],  "cam": {"az": 20, "el": 72}},
 "concha-turbante":         {"forma": F["turbante"], "cam": {"az": 35, "el": 30}},
 "concha-torre":            {"forma": F["torre"],    "cam": {"az": 35, "el": 24}},
 "concha-amonite":          {"forma": F["amonite"],  "cam": {"az": 35, "el": 45}},
 "concha-amonite-de-frente":{"forma": F["amonite"],  "cam": {"az": 10, "el": 84}},
 "concha-buzio":            {"forma": F["buzio"],    "cam": {"az": 30, "el": 62}},
 "concha-bolinha":          {"forma": F["bolinha"],  "cam": {"az": 30, "el": 62}},
}
open("concha_poses.json", "w").write(json.dumps(P, indent=1)); print(len(P))
