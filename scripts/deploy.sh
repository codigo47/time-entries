#!/usr/bin/env bash
# Deployment stub. Replace with your platform's deploy commands.
set -euo pipefail
echo "Production deployment is not configured."
echo "Checklist:"
echo "  - Provision Postgres (managed or self-hosted)"
echo "  - Set API .env with PROD DB credentials, APP_ENV=production"
echo "  - Run scripts/build.sh"
echo "  - Run 'php artisan migrate --force' on the API host"
echo "  - Serve dashboard build (apps/dashboard/dist) behind a CDN or static host"
exit 0
