FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --filter @dsa-lab/web... --frozen-lockfile=false

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
WORKDIR /app/apps/web
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
