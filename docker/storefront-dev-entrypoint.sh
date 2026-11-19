#!/bin/sh
# Starts the storefront core for theme work: `next dev` on :3100 with the theme at /app/theme and the configuration
# at /app/_CONFIG, both mounted. Without a mounted configuration the template's _CONFIG.example applies.
#
# A backend on the host's localhost (API_BASE_URL http://localhost:<port>) has to answer the browser and the server
# at one address: inside the container that port is forwarded to the host, as in zeno's storefront container.
set -e
cd /app

if [ ! -f _CONFIG/app.config.json ]; then
  if [ -d _CONFIG ]; then
    echo "storefront-dev: /app/_CONFIG is mounted but has no app.config.json" >&2
    exit 1
  fi
  echo "storefront-dev: no configuration mounted at /app/_CONFIG, using _CONFIG.example"
  cp -r _CONFIG.example _CONFIG
fi
[ -d theme ] || echo "storefront-dev: no theme mounted at /app/theme, showing the default theme"

api=$(node -p "require('./_CONFIG/app.config.json').API_BASE_URL")
case "$api" in
  http://localhost:* | http://127.0.0.1:*)
    port=${api##*:}
    port=${port%%/*}
    echo "storefront-dev: forwarding localhost:$port to the host's port $port"
    socat "TCP-LISTEN:$port,fork,reuseaddr" "TCP:host.docker.internal:$port" &
    ;;
esac

exec pnpm exec next dev -H 0.0.0.0 -p 3100
