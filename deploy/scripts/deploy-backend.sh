#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${DEPLOY_API_HOST:?Must set DEPLOY_API_HOST}"
REMOTE_USER="${DEPLOY_API_USER:-ubuntu}"
REMOTE_DIR="${DEPLOY_API_DIR:-/home/${REMOTE_USER}/ordinary-note}"

# Register host key if not already known
ssh-keyscan -H "${REMOTE_HOST}" >> ~/.ssh/known_hosts 2>/dev/null

echo "=== Backend Deployment ==="

# 1. Build locally
echo "[1/5] Building..."
pnpm turbo build --filter=@ordinary-note/server

# 2. Sync files to server
echo "[2/5] Syncing files..."
rsync -azP --delete \
  --include='package.json' \
  --include='pnpm-lock.yaml' \
  --include='pnpm-workspace.yaml' \
  --include='packages/' \
  --include='packages/shared/' \
  --include='packages/shared/dist/***' \
  --include='packages/shared/package.json' \
  --include='packages/server/' \
  --include='packages/server/dist/***' \
  --include='packages/server/prisma/' \
  --include='packages/server/prisma/schema.prisma' \
  --include='packages/server/prisma/migrations/' \
  --include='packages/server/prisma/migrations/***' \
  --include='packages/server/package.json' \
  --exclude='*' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# 3. Install dependencies & run migrations
echo "[3/5] Installing dependencies & running migrations..."
ssh"${REMOTE_USER}@${REMOTE_HOST}" bash -s <<REMOTE
  set -euo pipefail
  cd ${REMOTE_DIR}
  pnpm install --frozen-lockfile
  cd packages/server
  npx prisma migrate deploy
REMOTE

# 4. Restart PM2
echo "[4/5] Restarting PM2..."
ssh"${REMOTE_USER}@${REMOTE_HOST}" bash -s <<REMOTE
  set -euo pipefail
  cd ${REMOTE_DIR}
  pm2 startOrRestart deploy/ecosystem.config.cjs --update-env
  pm2 save
REMOTE

# 5. Health check
echo "[5/5] Health check..."
for i in 1 2 3 4 5; do
  sleep 3
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${REMOTE_HOST}/api/health" || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "Health check passed (attempt $i)"
    break
  fi
  echo "Attempt $i failed (HTTP $HTTP_STATUS), retrying..."
  if [ "$i" = "5" ]; then
    echo "Health check failed after 5 attempts"
    exit 1
  fi
done

echo "=== Backend deployment complete ==="
