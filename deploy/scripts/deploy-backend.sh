#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${DEPLOY_API_HOST:?Must set DEPLOY_API_HOST}"
REMOTE_USER="${DEPLOY_API_USER:-ubuntu}"
REMOTE_DIR="${DEPLOY_API_DIR:-/home/${REMOTE_USER}/ordinary-note}"
SSH_OPTS="-o StrictHostKeyChecking=no"

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
  --include='packages/server/prisma/***' \
  --include='packages/server/package.json' \
  --include='deploy/***' \
  --exclude='*' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# 3. Install dependencies & run migrations
echo "[3/5] Installing dependencies & running migrations..."
ssh ${SSH_OPTS} "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<REMOTE
  set -euo pipefail
  cd ${REMOTE_DIR}
  pnpm install --frozen-lockfile
  cd packages/server
  npx prisma migrate deploy
REMOTE

# 4. Restart PM2
echo "[4/5] Restarting PM2..."
ssh ${SSH_OPTS} "${REMOTE_USER}@${REMOTE_HOST}" bash -s <<REMOTE
  set -euo pipefail
  cd ${REMOTE_DIR}
  pm2 startOrRestart deploy/ecosystem.config.cjs --update-env
  pm2 save
REMOTE

# 5. Health check
echo "[5/5] Health check..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${REMOTE_HOST}/api/health" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "Health check passed (HTTP $HTTP_STATUS)"
else
  echo "Health check failed (HTTP $HTTP_STATUS)"
  ssh ${SSH_OPTS} "${REMOTE_USER}@${REMOTE_HOST}" "pm2 logs ordinary-note-api --lines 20 --nostream"
  exit 1
fi

echo "=== Backend deployment complete ==="
