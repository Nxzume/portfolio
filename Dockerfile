# Build-time env (set in Coolify, marked "Available at Buildtime"):
#   DIRECTUS_URL   e.g. https://portfolio-cms.vancouverly.ca

FROM node:20-alpine AS build
WORKDIR /app

ARG DIRECTUS_URL
ENV DIRECTUS_URL=$DIRECTUS_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
