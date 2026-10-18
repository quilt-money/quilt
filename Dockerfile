FROM node:22-bookworm-slim
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile

COPY . .
# SvelteKit's postbuild step imports the DB module, so it needs a DATABASE_URL (never opened).
RUN DATABASE_URL=/tmp/build.db bun run build

ENV NODE_ENV=production \
	PORT=3000 \
	DATABASE_URL=/data/portfolio.db
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "build"]
