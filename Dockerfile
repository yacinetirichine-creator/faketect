# FakeTect API - Simplified Docker image for Render
FROM node:20-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
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

# Copy only API package files first (for better caching)
COPY packages/api/package*.json ./
RUN npm install --production

# Copy shared module (if API depends on it)
COPY packages/shared ./node_modules/@shared

# Copy API source code
COPY packages/api .

# Expose Render's default port
EXPOSE 10000

# Start server
CMD ["node", "server.js"]
