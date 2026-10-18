#!/bin/sh
set -e

bun scripts/migrate.ts
bun src/lib/server/db/seed.ts

exec "$@"
