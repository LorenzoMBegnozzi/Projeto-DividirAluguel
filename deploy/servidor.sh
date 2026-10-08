#!/usr/bin/env bash
# =====================================================================
# Liga, desliga e atualiza o Toc Toc Who? NO SERVIDOR (VPS). Rode na pasta do projeto.
#
#   bash deploy/servidor.sh caddy subir           # porta de entrada com HTTPS (uma vez; fica ligada)
#   bash deploy/servidor.sh prod subir            # baixa a versão do IMAGE_TAG do .env.prod e sobe
#   bash deploy/servidor.sh prod subir sha-1a2b3c4  # muda a versão (grava no .env.prod) e sobe
#   bash deploy/servidor.sh homolog subir         # liga o homolog com a versão mais nova (main)
#   bash deploy/servidor.sh homolog parar         # desliga o homolog (os dados ficam)
#   bash deploy/servidor.sh prod logs             # acompanha o log da API
#   bash deploy/servidor.sh prod ps               # o que está rodando
#   bash deploy/servidor.sh memoria               # quanto cada container está usando
#   bash deploy/servidor.sh homolog seed          # dados de exemplo (só homolog)
#   bash deploy/servidor.sh prod <comando do docker compose>
#
# Cada ambiente lê o seu .env.<ambiente> (copie de .env.<ambiente>.example). Ver deploy/README.md.
# =====================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
REDE=toctocwho-web

garantir_rede() {
  docker network inspect "$REDE" >/dev/null 2>&1 || docker network create "$REDE" >/dev/null
}

ALVO="${1:-}"
COMANDO="${2:-}"
[ $# -gt 0 ] && shift
[ $# -gt 0 ] && shift

case "$ALVO" in
  memoria)
    docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}'
    echo
    free -h
    exit 0
    ;;
  caddy)
    [ -f "$RAIZ/deploy/caddy/.env" ] || { echo "Falta deploy/caddy/.env (copie de deploy/caddy/.env.caddy.example)." >&2; exit 1; }
    garantir_rede
    CADDY=(docker compose -f "$RAIZ/deploy/caddy/docker-compose.yml")
    case "$COMANDO" in
      subir|"")   "${CADDY[@]}" up -d ;;
      recarregar) "${CADDY[@]}" exec caddy caddy reload --config /etc/caddy/Caddyfile ;;
      logs)       "${CADDY[@]}" logs -f --tail 100 ;;
      *)          "${CADDY[@]}" "$COMANDO" "$@" ;;
    esac
    exit 0
    ;;
  prod|homolog) ;;
  *)
    echo "Uso: bash deploy/servidor.sh <prod|homolog|caddy|memoria> [comando]" >&2
    exit 1
    ;;
esac

ENV_FILE="$RAIZ/.env.$ALVO"
if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo .env.$ALVO não encontrado. Crie a partir do modelo:" >&2
  echo "  cp .env.$ALVO.example .env.$ALVO   # e preencha (senhas novas!)" >&2
  exit 1
fi

COMPOSE=(docker compose --project-directory "$RAIZ" --env-file "$ENV_FILE"
  -f "$RAIZ/docker-compose.yml" -f "$RAIZ/docker-compose.prod.yml" -f "$RAIZ/deploy/docker-compose.servidor.yml")

case "$COMANDO" in
  subir|"")
    # Versão nova pedida: grava no .env do ambiente, para o próximo "subir" (e um reinício) usar a mesma.
    if [ -n "${1:-}" ]; then
      if grep -q '^IMAGE_TAG=' "$ENV_FILE"; then
        sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$1/" "$ENV_FILE"
      else
        printf '\nIMAGE_TAG=%s\n' "$1" >> "$ENV_FILE"
      fi
      echo "$ALVO vai usar a versão $1"
    fi
    garantir_rede
    "${COMPOSE[@]}" pull backend frontend
    "${COMPOSE[@]}" up -d --no-build --remove-orphans
    # imagens antigas ocupam disco (cada versão tem ~300 MB)
    docker image prune -f >/dev/null
    "${COMPOSE[@]}" ps
    ;;
  parar)
    "${COMPOSE[@]}" down
    echo "$ALVO desligado (os dados do banco continuam guardados)."
    ;;
  logs)
    "${COMPOSE[@]}" logs -f --tail 200 backend "$@"
    ;;
  seed)
    if [ "$ALVO" = "prod" ]; then
      echo "Dados de exemplo não são criados em produção." >&2
      exit 1
    fi
    BACKEND="$("${COMPOSE[@]}" ps -q backend)"
    [ -n "$BACKEND" ] || { echo "Ligue o homolog antes (bash deploy/servidor.sh homolog subir)." >&2; exit 1; }
    # chama a API por dentro da rede do Docker (o site não tem porta aberta no servidor)
    IP="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' "$BACKEND" | awk '{print $1}')"
    BASE="http://$IP:8080/api" bash "$RAIZ/scripts/seed-demo.sh"
    ;;
  *)
    "${COMPOSE[@]}" "$COMANDO" "$@"
    ;;
esac
