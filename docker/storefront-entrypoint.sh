#!/bin/sh
# The storefront core's command in its images (docker/storefront.Dockerfile):
#
#   storefront dev              `next dev` on :3100 for theme work: the theme at /app/theme, the configuration at
#                               /app/_CONFIG, both mounted (without a configuration the template's _CONFIG.example)
#   storefront build [<theme>]  a shop's image: installs the theme package (npm spec, e.g. @acme/theme@1.3.0) at
#                               /app/theme, then `next build` with /app/_CONFIG; no package: the theme already
#                               copied to /app/theme, else the default one. The built shop is /app/out: Next's
#                               standalone server with its static files and the configuration, all it needs to run
#                               (the shop's Dockerfile copies it onto storefront-runtime)
#   storefront start            the shop on :3000: /app/server.js in storefront-runtime, else /app/out/server.js
#
# STOREFRONT_DIR (default /app) is the core's directory: a checkout of the core's v<version> tag outside the images
# builds and starts a shop the same way, on Node 24 with the core's pnpm (`pnpm install --frozen-lockfile --prod`).
#
# A backend on localhost (API_BASE_URL http://localhost:<port>) has to answer the browser and the server at one
# address: in dev and start that port is forwarded to the host, as in zeno's storefront container.
set -e
cd "${STOREFRONT_DIR:-/app}"

forward_local_api() {
  api=$(node -p "require('./_CONFIG/app.config.json').API_BASE_URL")
  case "$api" in
    http://localhost:* | http://127.0.0.1:*)
      port=${api##*:}
      port=${port%%/*}
      echo "storefront: forwarding localhost:$port to the host's port $port"
      socat "TCP-LISTEN:$port,fork,reuseaddr" "TCP:host.docker.internal:$port" &
      ;;
  esac
}

case "${1:-dev}" in
  dev)
    if [ ! -f _CONFIG/app.config.json ]; then
      if [ -d _CONFIG ]; then
        echo "storefront: /app/_CONFIG is mounted but has no app.config.json" >&2
        exit 1
      fi
      echo "storefront: no configuration mounted at /app/_CONFIG, using _CONFIG.example"
      cp -r _CONFIG.example _CONFIG
    fi
    [ -d theme ] || echo "storefront: no theme mounted at /app/theme, showing the default theme"
    forward_local_api
    exec pnpm exec next dev -H 0.0.0.0 -p 3100
    ;;
  build)
    [ -f _CONFIG/app.config.json ] || { echo "storefront: no _CONFIG/app.config.json to build with" >&2; exit 1; }
    if [ -n "$2" ]; then
      # The theme's package from its registry (the user's .npmrc); only its src/ and theme.json go into the core.
      tmp=$(mktemp -d)
      if ! (cd "$tmp" && npm pack --silent "$2" > /dev/null && tar -xzf ./*.tgz); then
        echo "storefront: cannot fetch $2. A theme in a private registry needs its .npmrc (registry and token) at /root/.npmrc during the build: a build secret." >&2
        exit 1
      fi
      rm -rf theme && mkdir -p theme
      cp -r "$tmp/package/src" theme/src
      [ -f "$tmp/package/theme.json" ] && cp "$tmp/package/theme.json" theme/
      rm -rf "$tmp"
      echo "storefront: theme $2"
    elif [ -d theme/src ]; then
      echo "storefront: the theme in $PWD/theme"
    else
      echo "storefront: the default theme"
    fi
    STOREFRONT_OUTPUT=standalone pnpm exec next build
    # The standalone server leaves the static files and public/ to the deployment; the configuration is read at run
    # time too (messages, brand files).
    # The standalone folder may hold some of these already (the brand files it traced): copy into, never nest.
    rm -rf out
    cp -r .next/standalone out
    for dir in .next/static public _CONFIG; do
      mkdir -p "out/$dir"
      cp -r "$dir/." "out/$dir/"
    done
    echo "storefront: the shop is in $PWD/out"
    ;;
  start)
    [ -f server.js ] || cd out
    forward_local_api
    export HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production
    exec node server.js
    ;;
  *)
    echo "storefront dev | build [<theme>] | start" >&2
    exit 1
    ;;
esac
