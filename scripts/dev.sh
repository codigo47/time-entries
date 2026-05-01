#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Bringing up Postgres..."
docker compose up -d
docker compose exec -T postgres sh -c 'until pg_isready -U time_entries; do sleep 1; done' || true

echo "==> Installing API dependencies..."
(cd apps/api && composer install --no-interaction)

echo "==> Installing dashboard dependencies..."
npm install

echo "==> Running migrations and seeders..."
(cd apps/api && php artisan migrate:fresh --seed --force)

cat <<EOF

==> Setup complete. Run these in two terminals:

   Terminal 1 (API):
     cd apps/api && php artisan serve --host=127.0.0.1 --port=8000

   Terminal 2 (Dashboard):
     npm --workspace apps/dashboard run dev

EOF
