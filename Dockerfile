# One image = the whole site: static pages + media + admin portal + publishing.
# No database, no external CMS, no object storage required.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
# Deploy build skips tsc — CI already typechecks every PR.
RUN npm run build:deploy
# The server serves media from public/; the copies vite makes in dist/ are
# redundant here and would bloat the runtime image. (The Cloudflare Pages
# mirror workflow builds separately and keeps them.)
RUN rm -rf dist/images dist/audio dist/media

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Coolify's Docker healthcheck shells out to curl inside the container.
RUN apk add --no-cache curl

# Reuse the build stage's node_modules instead of downloading twice.
COPY --from=build /app/node_modules ./node_modules
COPY package.json package-lock.json ./
RUN npm prune --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-ssr ./dist-ssr
COPY server ./server
COPY scripts ./scripts
COPY content ./content
COPY public ./public

# content/ and public/ are written at runtime by the admin portal.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server/index.mjs"]
