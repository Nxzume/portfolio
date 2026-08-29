# Portfolio site — Vite SPA fetching content from Vancouverly CMS at runtime
FROM node:22-bookworm-slim AS cms-sdk

WORKDIR /cms

ARG CMS_GIT_REPO=https://github.com/Nxzume/client-site-cms.git
ARG CMS_GIT_REF=master

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && git clone --depth 1 --branch "${CMS_GIT_REF}" "${CMS_GIT_REPO}" . \
  && npm ci \
  && npm run build -w @cms/shared \
  && npm run build -w @cms/sdk

FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/prepare-cms-sdk.mjs scripts/prepare-cms-sdk.mjs

COPY --from=cms-sdk /cms/packages/sdk ./.vendor/cms-sdk
COPY --from=cms-sdk /cms/packages/shared ./.vendor/cms-shared

RUN node -e "\
  const fs=require('fs'); \
  const p=JSON.parse(fs.readFileSync('.vendor/cms-sdk/package.json')); \
  p.dependencies['@cms/shared']='file:../cms-shared'; \
  fs.writeFileSync('.vendor/cms-sdk/package.json', JSON.stringify(p)); \
"

ENV VITE_CMS_SDK_PATH=1
RUN npm ci

COPY . .

ARG VITE_CMS_API_URL
ARG VITE_CMS_PUBLIC_KEY
ARG VITE_ADMIN_URL

ENV VITE_CMS_API_URL=$VITE_CMS_API_URL \
    VITE_CMS_PUBLIC_KEY=$VITE_CMS_PUBLIC_KEY \
    VITE_ADMIN_URL=$VITE_ADMIN_URL

RUN npm run build

FROM nginx:alpine AS runner

RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ >/dev/null || exit 1
