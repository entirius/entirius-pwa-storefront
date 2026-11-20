#!/usr/bin/env bash
# The theme flow before the @entirius packages and the images are public, in one command from this checkout:
#
#   docker/try-themes.sh
#
# 1. a local npm registry (Verdaccio, http://localhost:4873, docker/verdaccio/compose.yaml)
# 2. the core's images storefront-dev, storefront-builder and storefront-runtime, tagged with the packages' version
# 3. the four @entirius packages published to that registry (installs the workspace first; a version already there
#    is left as it is)
#
# Then it prints what to run in an empty folder. Needs Docker and pnpm; the backend is yours (a local zeno works).
set -euo pipefail
cd "$(dirname "$0")/.."

registry="http://localhost:4873"
version=$(node -p "require('./packages/sdk/package.json').version")
for tool in docker pnpm npm node curl; do
  command -v "$tool" > /dev/null || { echo "try-themes: $tool is needed" >&2; exit 1; }
done

echo "== 1/3 local npm registry on $registry"
docker compose -f docker/verdaccio/compose.yaml up -d
for _ in $(seq 1 30); do curl -sf "$registry/-/ping" > /dev/null && break; sleep 1; done
curl -sf "$registry/-/ping" > /dev/null || { echo "try-themes: the registry does not answer on $registry" >&2; exit 1; }

echo "== 2/3 images ghcr.io/entirius/storefront-dev, -builder and -runtime, $version"
docker build -f docker/storefront.Dockerfile --target dev -t "ghcr.io/entirius/storefront-dev:$version" .
docker build -f docker/storefront.Dockerfile --target builder -t "ghcr.io/entirius/storefront-builder:$version" .
docker build -f docker/storefront.Dockerfile --target runtime -t "ghcr.io/entirius/storefront-runtime:$version" .

echo "== 3/3 packages @entirius/* $version"
# Publishing turns the default theme's workspace:* peer into the SDK's version: it needs the workspace installed.
pnpm install --frozen-lockfile > /dev/null 2>&1 || pnpm install > /dev/null
for dir in sdk theme-default create-theme theme-cli; do
  name=$(node -p "require('./packages/$dir/package.json').name")
  if npm view "$name@$version" version --registry "$registry" > /dev/null 2>&1; then
    echo "$name@$version: in the registry already"
  else
    (cd "packages/$dir" && pnpm publish --registry "$registry" --tag next --no-git-checks)
  fi
  npm dist-tag add "$name@$version" latest --registry "$registry" > /dev/null 2>&1
done

cat << DONE

Ready: $version. In an empty folder outside this repository:

  printf '@entirius:registry=$registry/\n' > .npmrc
  pnpm create @entirius/theme@$version shop --example --registry $registry/
  cd shop && pnpm install
  pnpm dev      # asks for your backend (a local zeno: http://localhost:8100), channel and checkout key
  pnpm build    # a production image of the shop with this theme

Without --example the theme starts empty: the shop looks like the default theme until src/ overrides something
(pnpm overrides lists what can be, pnpm eject <path> copies one).
DONE
