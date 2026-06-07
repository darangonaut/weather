#!/usr/bin/env bash
# Nasadenie weather.markuska.cz na markuska VM.
# Weather je STATIC export + PHP endpointy — NIKDY nebuilduj na serveri (1GB RAM).
# Build beží lokálne, na server sa rsyncne len `out/` (statika) a `php/` (API endpointy).
# Jednorazový setup (fpm pool weather, nginx vhost, certbot) je už hotový; node weather.service je disabled.
# Použitie: ./deploy.sh
set -euo pipefail

KEY="${KEY:-$HOME/.ssh/oracle-renovo.key}"
HOST="${HOST:-ubuntu@129.159.241.184}"
BASE="/var/www/weather"

cd "$(dirname "$0")"

echo "→ static build lokálne (next build → out/)"
npm run build

if [ ! -f out/index.html ]; then
  echo "✗ out/index.html chýba — build zlyhal alebo output:'export' nie je v next.config" >&2
  exit 1
fi

echo "→ rsync out/ + php/ na server (/tmp)"
rsync -az --delete -e "ssh -i ${KEY}" out/ "${HOST}:/tmp/weather-out/"
rsync -az --delete -e "ssh -i ${KEY}" php/ "${HOST}:/tmp/weather-api/"

echo "→ nasadenie na ${BASE} (sudo move + ownership + perms)"
ssh -i "${KEY}" "${HOST}" "
  set -e
  sudo rsync -a --delete /tmp/weather-out/ ${BASE}/out/
  sudo rsync -a --delete /tmp/weather-api/ ${BASE}/api/
  sudo chown -R weather:weather ${BASE}/out ${BASE}/api
  sudo find ${BASE}/out -type d -exec chmod 755 {} \;
  sudo find ${BASE}/out -type f -exec chmod 644 {} \;
  sudo chmod 755 ${BASE}/api && sudo chmod 644 ${BASE}/api/*.php
  rm -rf /tmp/weather-out /tmp/weather-api
"
echo "✓ Hotovo: https://weather.markuska.cz"
