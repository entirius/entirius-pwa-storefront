# The storefront core in two images, built from this repository; neither carries a shop's configuration or data.
#
#   docker build -f docker/storefront.Dockerfile --target dev -t ghcr.io/entirius/storefront-dev:<version> .
#   docker build -f docker/storefront.Dockerfile --target builder -t ghcr.io/entirius/storefront-builder:<version> .
#
# dev:     `next dev` on :3100 for theme work: the theme mounted at /app/theme, the configuration at /app/_CONFIG.
# builder: the source with its dependencies, the base of a shop's own image (FROM it, add _CONFIG and the theme,
#          `pnpm build`).
#
# .dockerignore lists what goes in (allowlist): a new top-level source directory has to be added there.

FROM node:22-slim AS core
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN npm install --global pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/theme-default/package.json packages/theme-default/
RUN pnpm install --frozen-lockfile
COPY . .

FROM core AS builder

FROM core AS dev
RUN apt-get update && apt-get install -y --no-install-recommends socat && rm -rf /var/lib/apt/lists/*
COPY docker/storefront-dev-entrypoint.sh /usr/local/bin/storefront-dev
EXPOSE 3100
ENTRYPOINT ["storefront-dev"]
