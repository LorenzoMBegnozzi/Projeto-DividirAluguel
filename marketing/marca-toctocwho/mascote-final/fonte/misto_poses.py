"""Poses do mascote final, versão brinquedo de vinil: a concha 'casa nas costas', o corpo e os olhos do
caranguejo antigo (olhos maiores, sorriso em linha), garras gordas e acabamento fosco com textura leve."""
import json
BASE = {"conchaInclina": 1.5, "conchaRola": 3.4, "conchaEscala": 2.4, "crabEscala": 2.05, "saida": 0.5, "subir": -0.66,
        "brinquedo": True, "garraD": {"ergue": 0.25}, "garraE": {"ergue": 0.25}}
def pose(**kw):
    cam = kw.pop("cam", {}); p = dict(BASE); p.update(kw)
    p["cam"] = {"azRel": -8, "el": 12, "dist": 15, **cam}
    return p
P = {
  "mascote": pose(),
  "mascote-tres-quartos": pose(cam={"azRel": 30, "dist": 17}),
  "mascote-outro-lado": pose(cam={"azRel": -38, "dist": 17.5}),
  "mascote-acenando": pose(garraD={"ergue": 0.95, "abre": 0.3}),
  "mascote-comemorando": pose(subir=-0.55, garraD={"ergue": 0.85, "abre": 0.3}, garraE={"ergue": 0.85, "abre": 0.3}, cam={"dist": 17}),
  "mascote-espiando": pose(saida=0.15, subir=-0.75, garraD={"ergue": 0.0}, garraE={"ergue": 0.0}, cam={"el": 6}),
  "mascote-piscando": pose(piscar=["d"], garraE={"ergue": 0.6, "abre": 0.25}, cam={"dist": 16.5}),
  "mascote-dormindo": pose(saida=0.3, piscar=["e", "d"], garraD={"ergue": 0.0, "abre": 0.0}, garraE={"ergue": 0.0, "abre": 0.0}, cam={"azRel": 6, "el": 14}),
}
open("misto_poses.json", "w").write(json.dumps(P, indent=1)); print(len(P))
