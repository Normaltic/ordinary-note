#!/usr/bin/env bash
set -euo pipefail

S3_BUCKET="s3://${S3_FRONTEND_BUCKET:?Must set S3_FRONTEND_BUCKET}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:?Must set CLOUDFRONT_DISTRIBUTION_ID}"
VITE_API_URL="${VITE_API_URL:?Must set VITE_API_URL}"
VITE_WS_URL="${VITE_WS_URL:?Must set VITE_WS_URL}"
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:?Must set VITE_GOOGLE_CLIENT_ID}"

echo "=== Frontend Deployment ==="

# 1. Build
echo "[1/3] Building..."
VITE_API_URL="${VITE_API_URL}" \
VITE_WS_URL="${VITE_WS_URL}" \
VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID}" \
pnpm turbo build --filter=@ordinary-note/web

# 2. S3 sync with cache strategy
echo "[2/3] Syncing to S3..."
# Hashed assets: long cache
aws s3 sync packages/web/dist/ "${S3_BUCKET}/" \
  --delete \
  --exclude "*" \
  --include "assets/*" \
  --cache-control "public, max-age=31536000, immutable"

# HTML and other root files: no cache
aws s3 sync packages/web/dist/ "${S3_BUCKET}/" \
  --delete \
  --exclude "assets/*" \
  --cache-control "no-cache, no-store, must-revalidate"

# 3. CloudFront invalidation
echo "[3/3] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "=== Frontend deployment complete ==="
