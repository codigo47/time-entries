#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building dashboard..."
npm --workspace apps/dashboard run build

echo "==> Optimizing API..."
(cd apps/api && composer install --no-dev --optimize-autoloader)
(cd apps/api && php artisan config:cache && php artisan route:cache)
