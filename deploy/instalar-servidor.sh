#!/usr/bin/env bash
# =====================================================================
# Prepara uma VPS nova (Ubuntu 22.04/24.04) para o Toc Toc Who?. Rode UMA vez, como root:
#
#   sudo bash deploy/instalar-servidor.sh
#
# Faz: atualizações automáticas de segurança, Docker, firewall (só SSH, 80 e 443), swap de 2 GB
# (folga para produção + homolog na VPS de 2 GB), limite no tamanho dos logs do Docker e o backup
# diário do banco às 03:30. Pode rodar de novo sem estragar nada.
# =====================================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root: sudo bash deploy/instalar-servidor.sh" >&2
  exit 1
fi
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
USUARIO="${SUDO_USER:-root}"

echo "== Pacotes e atualizações automáticas de segurança =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw unattended-upgrades fail2ban rclone
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== Docker =="
if ! command -v docker >/dev/null; then
  # instalador oficial do Docker (repositório apt deles, com o plugin "docker compose")
  curl -fsSL https://get.docker.com | sh
fi
# logs dos containers com tamanho limitado (sem isso enchem o disco com o tempo)
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
  systemctl restart docker
fi
[ "$USUARIO" != "root" ] && usermod -aG docker "$USUARIO"

echo "== Firewall: só SSH, HTTP e HTTPS =="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "== Swap de 2 GB =="
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# usa o swap só em último caso (ele é bem mais lento que a memória)
echo 'vm.swappiness=10' > /etc/sysctl.d/99-toctocwho.conf
sysctl -q --system

echo "== Backup diário do banco de produção (03:30) =="
mkdir -p /opt/backups/toctocwho
[ -f /etc/toctocwho-backup.env ] || cat > /etc/toctocwho-backup.env <<'ENV'
# Destino do rclone para a cópia fora do servidor (ex.: gdrive:toctocwho-backups).
# Vazio = o backup fica só no servidor. Configure com: rclone config (ver deploy/README.md).
BACKUP_DESTINO=
ENV
cat > /etc/cron.d/toctocwho-backup <<CRON
30 3 * * * root bash $RAIZ/deploy/backup.sh >> /var/log/toctocwho-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/toctocwho-backup

echo
echo "Pronto. Próximos passos em deploy/README.md (arquivos .env, Caddy e subir os sites)."
[ "$USUARIO" != "root" ] && echo "Saia e entre de novo no SSH para o usuário $USUARIO poder usar o docker sem sudo."
