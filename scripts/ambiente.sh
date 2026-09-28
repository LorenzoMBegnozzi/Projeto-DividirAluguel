#!/usr/bin/env bash
# =====================================================================
# Sobe, para e acompanha um ambiente do RachaAi (dev, homolog ou prod).
#
# Uso (na pasta do projeto):
#     bash scripts/ambiente.sh dev up       # constrói e sobe
#     bash scripts/ambiente.sh dev down     # para e remove os containers (os DADOS do banco ficam)
#     bash scripts/ambiente.sh dev logs     # acompanha os logs do backend
#     bash scripts/ambiente.sh dev ps       # mostra o que está rodando
#     bash scripts/ambiente.sh dev seed     # cria os dados de exemplo (só dev e homolog)
#     bash scripts/ambiente.sh dev <qualquer comando do docker compose>
#
# Cada ambiente lê o seu arquivo .env.<ambiente> (copie de .env.<ambiente>.example).
# =====================================================================
set -euo pipefail

# O ambiente vem do 1º argumento ou, se ele for omitido, da variável AMBIENTE
# (ex.: export AMBIENTE=homolog; bash scripts/ambiente.sh up).
case "${1:-}" in
  dev|homolog|prod) AMBIENTE="$1"; shift ;;
  *) AMBIENTE="${AMBIENTE:-}" ;;
esac
COMANDO="${1:-up}"
[ $# -gt 0 ] && shift

case "$AMBIENTE" in
  dev|homolog|prod) ;;
  *) echo "Ambiente inválido: '$AMBIENTE'. Use: bash scripts/ambiente.sh <dev|homolog|prod> [comando], ou defina AMBIENTE." >&2; exit 1 ;;
esac
echo "Ambiente: $AMBIENTE"

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$RAIZ/.env.$AMBIENTE"

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo .env.$AMBIENTE não encontrado. Crie a partir do modelo:" >&2
  echo "  cp .env.$AMBIENTE.example .env.$AMBIENTE   # e troque as senhas" >&2
  exit 1
fi

COMPOSE=(docker compose --project-directory "$RAIZ" --env-file "$ENV_FILE" -f "$RAIZ/docker-compose.yml")
if [ "$AMBIENTE" = "prod" ]; then
  COMPOSE+=(-f "$RAIZ/docker-compose.prod.yml")
fi

case "$COMANDO" in
  up)   "${COMPOSE[@]}" up --build -d "$@" ;;
  logs) "${COMPOSE[@]}" logs -f backend "$@" ;;
  seed)
    if [ "$AMBIENTE" = "prod" ]; then
      echo "Dados de exemplo não são criados em produção." >&2
      exit 1
    fi
    SITE_PORT="$(grep -E '^SITE_PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '\r')"
    BASE="http://localhost:$SITE_PORT/api" bash "$RAIZ/scripts/seed-demo.sh"
    ;;
  *) "${COMPOSE[@]}" "$COMANDO" "$@" ;;
esac
