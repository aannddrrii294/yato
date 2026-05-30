# Build stage
FROM node:20-slim AS builder

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-slim

# Install OpenSSL, timezone data, and clean apt cache
RUN apt-get update && apt-get install -y openssl tzdata && rm -rf /var/lib/apt/lists/*

ENV TZ="UTC"

WORKDIR /app

RUN mkdir -p /app/logs && chown -R node:node /app

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
