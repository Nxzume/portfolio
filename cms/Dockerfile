# Runs cms/migrate.mjs on your Coolify server (same network as Directus).
# Build context: cms/ (set Base Directory to /cms in Coolify).
FROM node:22-alpine
WORKDIR /app
COPY lib/ ./lib/
COPY migrate.mjs ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
