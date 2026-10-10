"""Poses do eremita caprichado (eremita2.html): concha com a ponta para a direita."""
import json
def pose(**kw):
    cam = kw.pop("cam", {}); p = dict(kw)
    p["cam"] = {"azRel": 12, "el": 10, "dist": 10.5, **cam}
    return p
P = {
  "caprichado": pose(),
  "caprichado-de-frente": pose(cam={"azRel": 0, "el": 5, "dist": 10.5}),
  "caprichado-de-lado": pose(cam={"azRel": 70, "el": 8}),
  "caprichado-acenando": pose(garraD={"ergue": 0.95, "abre": 0.55, "abreBraco": 0.15}),
  "caprichado-comemorando": pose(subir=0.1, garraD={"ergue": 0.85, "abre": 0.55}, garraE={"ergue": 0.85, "abre": 0.55}),
  "caprichado-mostrando-as-garras": pose(saida=0.22, garraD={"ergue": 0.5, "inclina": 1.25, "abre": 0.05}, garraE={"ergue": 0.5, "inclina": 1.25, "abre": 0.05}, cam={"azRel": 6, "el": 4}),
  "caprichado-andando": pose(passo=0.25, cam={"azRel": 50, "el": 8}),
  "caprichado-piscando": pose(piscar=["d"], garraE={"ergue": 0.5, "abre": 0.5}),
  "caprichado-olhando-pra-cima": pose(olhar=-0.32, cam={"azRel": 10, "el": -2}),
}
open("caprichado_poses.json", "w").write(json.dumps(P, indent=1)); print(len(P))
