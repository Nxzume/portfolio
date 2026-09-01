# Runs cms/migrate.mjs on your Coolify server (same network as Directus).
# Build context: repo root (Base Directory / in Coolify, Dockerfile /cms/Dockerfile).
FROM node:22-alpine
WORKDIR /app
COPY cms/lib/ ./lib/
COPY cms/migrate.mjs cms/entrypoint.sh ./
COPY content/ ./content/
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
