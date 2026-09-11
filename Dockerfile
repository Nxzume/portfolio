# One image = the whole site: static pages + media + admin portal + publishing.
# No database, no external CMS, no object storage required.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Coolify's Docker healthcheck shells out to curl inside the container.
RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-ssr ./dist-ssr
COPY server ./server
COPY scripts ./scripts
COPY content ./content
COPY public ./public

# content/ and public/media/ are written at runtime by the admin portal.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "server/index.mjs"]
