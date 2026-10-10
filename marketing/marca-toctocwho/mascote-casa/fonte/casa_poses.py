"""Poses do mascote 'casa nas costas' (casa.html): a concha por cima como uma casa e o caranguejo morando
na abertura de baixo, com o rosto emoldurado pela borda (o encaixe do jeito do Dwebble, com a nossa concha)."""
import json
BASE = {"conchaInclina": 1.5, "conchaRola": 3.4, "conchaEscala": 2.4, "crabEscala": 1.32, "saida": -0.32, "subir": -0.14, "garraGrande": 1.3}
def pose(**kw):
    cam = kw.pop("cam", {}); p = dict(BASE); p.update(kw)
    p["cam"] = {"azRel": 0, "el": 8, "dist": 12, **cam}
    return p
P = {
  "casa": pose(),
  "casa-tres-quartos": pose(cam={"azRel": 30}),
  "casa-outro-lado": pose(cam={"azRel": -35}),
  "casa-acenando": pose(garraD={"ergue": 1.0, "abre": 0.32}),
  "casa-comemorando": pose(subir=0.0, garraD={"ergue": 0.95, "abre": 0.32}, garraE={"ergue": 0.95, "abre": 0.32}),
  "casa-espiando": pose(saida=-0.75, subir=-0.2, garraD={"frente": -1.2}, garraE={"frente": -1.2}, cam={"azRel": 10, "el": 4}),
  "casa-piscando": pose(piscar=["e"], garraE={"ergue": 0.6, "abre": 0.32}),
  "casa-andando": pose(passo=0.25, cam={"azRel": 40}),
  "casa-dormindo": pose(saida=-0.55, piscar=["e", "d"], garraD={"frente": -0.8}, garraE={"frente": -0.8}, cam={"azRel": 15, "el": 10}),
}
open("casa_poses.json", "w").write(json.dumps(P, indent=1)); print(len(P))
