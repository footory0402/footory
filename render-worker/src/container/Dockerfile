FROM node:20-slim AS builder

WORKDIR /build

COPY package.json ./
COPY tsconfig.json ./
RUN npm install

COPY . .
RUN npx tsc

# ── Runtime ──
FROM node:20-slim

# FFmpeg + 한글 폰트
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# 빌드 결과물 복사
COPY --from=builder /build/dist ./dist

# 에셋 디렉토리
RUN mkdir -p /app/assets

EXPOSE 8080
CMD ["node", "dist/server.js"]
