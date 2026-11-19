# The storefront core in two images, built from this repository; neither carries a shop's configuration or data.
#
#   docker build -f docker/storefront.Dockerfile --target dev -t ghcr.io/entirius/storefront-dev:<version> .
#   docker build -f docker/storefront.Dockerfile --target builder -t ghcr.io/entirius/storefront-builder:<version> .
#
# builder: the source with its dependencies, the base of a shop's own image:
#            FROM ghcr.io/entirius/storefront-builder:<version>
#            COPY _CONFIG /app/_CONFIG
#            RUN storefront build @acme/theme@1.3.0
#            CMD ["start"]
# dev:     the same, running `next dev` on :3100 for theme work (theme at /app/theme, configuration at /app/_CONFIG).
# docker/storefront-entrypoint.sh is the `storefront` command of both.
#
# .dockerignore lists what goes in (allowlist): a new top-level source directory has to be added there.

FROM node:22-slim AS core
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN npm install --global pnpm@10
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/theme-default/package.json packages/theme-default/
COPY packages/create-theme/package.json packages/create-theme/
COPY packages/theme-cli/package.json packages/theme-cli/
RUN pnpm install --frozen-lockfile
COPY . .

FROM core AS builder
RUN apt-get update && apt-get install -y --no-install-recommends socat && rm -rf /var/lib/apt/lists/*
COPY docker/storefront-entrypoint.sh /usr/local/bin/storefront
EXPOSE 3000
ENTRYPOINT ["storefront"]
CMD ["start"]

FROM builder AS dev
EXPOSE 3100
CMD ["dev"]
