# Time Entry App

A Laravel 12 REST API + Vue 3 SPA for recording employee time entries. See `README_detailed.md` for the deeper write-up.

## Requirements

- PHP 8.3 with `pdo_pgsql`, `intl`, `bcmath`
- Composer 2.x
- Node 22 + npm 10
- Docker (only for Postgres)

## Setup

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
bash scripts/dev.sh
```

`scripts/dev.sh` brings up Postgres on port 5477, installs dependencies for both apps, and runs migrations + seeders.

## Run (in two terminals)

```bash
# Terminal 1 — API
cd apps/api && php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2 — Dashboard
npm --workspace apps/dashboard run dev
```

Visit http://127.0.0.1:5173.

## Environment variables

- Root `.env`: Postgres credentials and ports (used by docker-compose).
- `apps/api/.env`:
  - `DB_*` for Postgres
  - `OPENAI_API_KEY` (optional) — enables AI-assisted entry. Leave blank to hide it.
  - `OPENAI_MODEL` — defaults to `gpt-4o-mini`.
- `apps/dashboard/.env`:
  - `VITE_API_BASE_URL` — defaults to `http://127.0.0.1:8000/api/v1`.
  - `VITE_AI_ENABLED` — `true`/`false`. Set to `false` to hide the AI chat box.

## Tests

```bash
# Backend
cd apps/api && ./vendor/bin/pest --coverage

# Frontend
npm --workspace apps/dashboard run test
```
