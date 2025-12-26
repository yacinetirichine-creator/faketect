# FakeTect API - Docker image with ffmpeg + canvas deps
# Force rebuild: 2025-12-25 13:50

FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# System deps:
# - ffmpeg for video frame extraction
# - libs for node-canvas (cairo/pango/jpeg/gif/rsvg)
# - build tools to compile native modules (canvas)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies using workspace lockfile for reproducibility
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/web/package.json ./packages/web/package.json
COPY packages/extension/package.json ./packages/extension/package.json

RUN npm ci --omit=dev --workspace=packages/api

# Copy shared code (needed by API)
COPY packages/shared ./packages/shared

# Copy API source
COPY packages/api ./packages/api

WORKDIR /app/packages/api

CMD ["node", "server.js"]
