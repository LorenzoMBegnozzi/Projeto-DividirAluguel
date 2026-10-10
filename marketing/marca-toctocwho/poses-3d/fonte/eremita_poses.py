"""Poses do eremita novo (eremita.html): o caranguejo saindo de dentro da concha deitada."""
import json
BASE = {"conchaInclina": 1.05, "conchaGira": 0.5}
def pose(**kw):
    p = dict(BASE); cam = kw.pop("cam", {}); p.update(kw)
    p["cam"] = {"az": 25, "el": 12, "dist": 9.2, **cam}
    return p
P = {
  "eremita": pose(),
  "eremita-espelhado": pose(espelhar=True, conchaGira=-0.5, cam={"az": -25, "el": 12}),
  "eremita-acenando": pose(garras={"d": [0, 0, 1.05]}),
  "eremita-andando": pose(passo=0.25, cam={"azRel": -62, "el": 8}),
  "eremita-espiando": pose(saida=0.08, garraGrande=1.5, garras={"d": [0, -0.7, 0.25], "e": [0, 0.7, -0.25]}, cam={"az": 22, "el": 6}),
  "eremita-timido": pose(garras={"d": [0, -1.0, 0.5], "e": [0, 1.0, -0.4]}, cam={"az": 18, "el": 8}),
  "eremita-piscando": pose(piscar=["d"], garras={"e": [0, 0, -0.8]}, cam={"az": 30, "el": 6}),
  "eremita-visto-de-cima": pose(cam={"az": 30, "el": 42, "dist": 9.6}),
}
open("eremita_poses.json", "w").write(json.dumps(P, indent=1))
print(len(P))
