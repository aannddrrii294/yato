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

# Install OpenSSL and timezone data
RUN apt-get update && apt-get install -y openssl tzdata

ENV TZ="UTC"

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
