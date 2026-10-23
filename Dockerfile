FROM node:24.16.0-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @app/web build

FROM base AS runtime
ENV NODE_ENV=production
ENV WEB_DIST_PATH=/app/apps/web/dist
COPY --from=build /app /app
EXPOSE 3001
USER node
CMD ["pnpm", "--filter", "@app/api", "start"]
