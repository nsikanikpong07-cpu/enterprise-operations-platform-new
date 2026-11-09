# Build dependencies and native Argon2 binaries inside Linux.
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Native build tools cover packages that cannot use a prebuilt binary.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Use the lockfile so the image installs the project's recorded dependencies.
COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build
RUN npm prune --omit=dev

# The running image contains compiled code and production dependencies.
FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 3001

# Explicit .js extension works with this project's ESM configuration.
CMD ["node", "dist/main.js"]
