FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

# --- Dependencies ---
FROM base AS deps
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/

RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd apps/api && npx prisma@5 generate && npx nest build

# --- Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/packages ./packages

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -q --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/main.js"]