FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache openjdk17-jdk

COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --filter @dsa-lab/backend... --frozen-lockfile=false

COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared
WORKDIR /app/apps/backend
RUN pnpm build

EXPOSE 4000
CMD ["pnpm", "start"]
