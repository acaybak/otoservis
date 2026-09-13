# === Build Stage ===
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy all package.json files
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY packages/validation/package.json packages/validation/
COPY packages/database/package.json packages/database/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ packages/
COPY apps/api/ apps/api/

# Build packages and API
RUN pnpm --filter @otoservis/types build && \
    pnpm --filter @otoservis/shared build && \
    pnpm --filter @otoservis/validation build && \
    pnpm --filter @otoservis/database build && \
    pnpm --filter @otoservis/api build

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# === Production Stage ===
FROM node:20-alpine AS production

RUN npm install -g pnpm@10

WORKDIR /app

# Copy production dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY packages/validation/package.json packages/validation/
COPY packages/database/package.json packages/database/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/packages/types/dist packages/types/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/validation/dist packages/validation/dist
COPY --from=builder /app/packages/database/dist packages/database/dist
COPY --from=builder /app/packages/database/node_modules/.prisma packages/database/node_modules/.prisma
COPY --from=builder /app/apps/api/dist apps/api/dist

# Copy Prisma schema and migrations
COPY packages/database/prisma packages/database/prisma

# Copy env template
COPY apps/api/.env.example apps/api/.env.example

ENV NODE_ENV=production
ENV API_PORT=3000
ENV API_HOST=0.0.0.0

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "cd packages/database && npx prisma migrate deploy && cd ../../apps/api && node dist/src/main.js"]
