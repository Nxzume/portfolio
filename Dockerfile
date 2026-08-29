# Build-time env (set in Coolify, marked "Available at Buildtime"):
#   CMS_API_URL     e.g. https://pilot-admin.vancouverly.ca
#   CMS_PUBLIC_KEY  same value as PUBLIC_API_KEY on that CMS instance

FROM node:20-alpine AS build
WORKDIR /app

ARG CMS_API_URL
ARG CMS_PUBLIC_KEY
ENV CMS_API_URL=$CMS_API_URL
ENV CMS_PUBLIC_KEY=$CMS_PUBLIC_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback: unmatched routes still get 404.html (prerendered) rather than
# nginx's default 404, matching the previous Vercel rewrite behavior.
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location /admin {\n\
    return 404;\n\
  }\n\
  location / {\n\
    try_files $uri $uri/ /404.html =404;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
