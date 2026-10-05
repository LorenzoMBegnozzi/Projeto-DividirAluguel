#!/bin/sh
# Monta antes | depois de cada tela (topo de 1600 px de cada captura) em comparativos/.
# Uso (de docs/capturas/design-system):
#   MSYS_NO_PATHCONV=1 docker run --rm -v "$PWD:/d" -w /d alpine sh -c "apk add -q imagemagick && sh montar-comparativos.sh"
set -e
mkdir -p comparativos
for f in depois/*-1440-claro.png; do
  s=$(basename "$f" -1440-claro.png)
  for v in 1440-claro 1440-escuro 390-claro 390-escuro; do
    [ -f "antes/$s-$v.png" ] || continue
    magick "antes/$s-$v.png" -crop x1600+0+0 +repage -gravity north -background '#888' -splice 0x44 -font DejaVu-Sans -pointsize 28 -fill white -annotate +0+6 "antes $v" /tmp/a.png
    magick "depois/$s-$v.png" -crop x1600+0+0 +repage -gravity north -background '#1e5f7a' -splice 0x44 -font DejaVu-Sans -pointsize 28 -fill white -annotate +0+6 "depois $v" /tmp/b.png
    magick /tmp/a.png /tmp/b.png -background '#ddd' -gravity north +smush 24 "/tmp/$v.png"
  done
  magick /tmp/1440-claro.png /tmp/1440-escuro.png -background '#ddd' -gravity west -smush 24 /tmp/big.png
  magick /tmp/390-claro.png /tmp/390-escuro.png -background '#ddd' -gravity north +smush 24 /tmp/small.png
  magick /tmp/big.png -resize 1600x /tmp/big.png
  magick /tmp/big.png /tmp/small.png -background '#ddd' -gravity west -smush 24 -resize 1800x "comparativos/$s.jpg"
  echo "ok $s"
done
