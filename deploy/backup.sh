#!/usr/bin/env bash
# =====================================================================
# Backup do banco de PRODUÇÃO. Roda todo dia pelo cron (instalado por deploy/instalar-servidor.sh).
#
#   bash deploy/backup.sh            # faz um backup agora
#
# Guarda em /opt/backups/toctocwho os últimos 14 dias. Se BACKUP_DESTINO estiver definido em
# /etc/toctocwho-backup.env (um destino do rclone, ex.: "gdrive:toctocwho-backups"), também manda
# a cópia para fora do servidor — sem isso, se a VPS se perder, o backup vai junto.
# Inclui as fotos (ficam dentro do banco). Restaurar: deploy/README.md, "Restaurar um backup".
# =====================================================================
set -euo pipefail

PASTA=/opt/backups/toctocwho
DIAS=14
[ -f /etc/toctocwho-backup.env ] && . /etc/toctocwho-backup.env

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
BANCO="$(grep -E '^DB_USER=' "$RAIZ/.env.prod" | cut -d= -f2 | tr -d '\r')"
BANCO="${BANCO:-rachaai}"

DB="$(docker ps -q -f label=com.docker.compose.project=rachaai-prod -f label=com.docker.compose.service=db)"
if [ -z "$DB" ]; then
  echo "$(date -Is) ERRO: banco de produção não está rodando" >&2
  exit 1
fi

mkdir -p "$PASTA"
ARQUIVO="$PASTA/prod-$(date +%Y%m%d-%H%M).dump"
# formato "custom" do pg_dump: já comprimido e restaura com pg_restore
docker exec "$DB" pg_dump -U postgres -Fc "$BANCO" > "$ARQUIVO.parcial"
mv "$ARQUIVO.parcial" "$ARQUIVO"
echo "$(date -Is) backup ok: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

find "$PASTA" -name 'prod-*.dump' -mtime +"$DIAS" -delete

if [ -n "${BACKUP_DESTINO:-}" ]; then
  rclone copy "$ARQUIVO" "$BACKUP_DESTINO" && echo "$(date -Is) cópia enviada para $BACKUP_DESTINO"
  # lá fora guarda 30 dias
  rclone delete "$BACKUP_DESTINO" --min-age 30d --include 'prod-*.dump' || true
fi
