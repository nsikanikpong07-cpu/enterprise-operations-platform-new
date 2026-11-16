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
ENV SUPPLIER_DOCUMENT_STORAGE_DIR=/var/lib/impressor/supplier-documents

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node src/vendor/ocr/verify_cac.py ./ocr/verify_cac.py
COPY --chown=node:node ocr/requirements.txt ./ocr/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir --timeout 300 --retries 10 -r ./ocr/requirements.txt
RUN mkdir -p /var/lib/impressor/supplier-documents \
    && chown -R node:node /var/lib/impressor

USER node
VOLUME ["/var/lib/impressor/supplier-documents"]
EXPOSE 3001

# Explicit .js extension works with this project's ESM configuration.
CMD ["node", "dist/main.js"]
