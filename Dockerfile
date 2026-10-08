# Build stage: install all dependencies and compile TypeScript
FROM node:22-bookworm-slim AS build
WORKDIR /boombot

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src src
RUN npm run build && npm prune --omit=dev

# Runtime stage: compiled output and production dependencies only
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /boombot

# yt-dlp streams the audio. It runs on Python, and the latest release is fetched on every
# build because older releases stop working as YouTube changes; rebuild to update it.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ADD --chmod=755 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp /usr/local/bin/yt-dlp

COPY --from=build /boombot/node_modules node_modules
COPY --from=build /boombot/dist dist
COPY package.json icon.jpg ./

# Mount settings.json, cookies.json (optional) and the data directory, e.g. with docker compose:
# volumes:
#   - ./settings.json:/boombot/settings.json
#   - ./cookies.json:/boombot/cookies.json
#   - ./data:/boombot/data
CMD ["node", "dist/index.js"]
