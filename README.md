# Time Entry App

A Laravel 12 REST API + Vue 3 SPA for recording employee time entries. See `README_detailed.md` for the deeper write-up.

## Requirements

- PHP 8.3 with `pdo_pgsql`, `intl`, `bcmath`
- Composer 2.x
- Node 22 + npm 10
- Docker (only for Postgres)

## Setup

### 1. Copy environment files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

### 2. Start Postgres (Docker)

The database runs in Docker on port **5477**. Bring it up before anything else:

```bash
docker compose up -d
```

Verify it's healthy:

```bash
docker compose ps
# postgres should show "Up (healthy)"
```

To stop it later: `docker compose down` (data persists in the named volume) or `docker compose down -v` (wipes data).

### 3. Install dependencies and run migrations + seeders

You can do steps 2 and 3 in one shot with `bash scripts/dev.sh`, or run them manually:

```bash
# Backend
(cd apps/api && composer install && php artisan migrate:fresh --seed)

# Frontend
npm install
```

`scripts/dev.sh` automates: docker compose up + composer install + npm install + migrations + seeders.

## Run (in two terminals)

Make sure Postgres is up (`docker compose up -d`), then:

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
# Backend (no coverage driver required)
cd apps/api && ./vendor/bin/pest

# Backend with coverage (requires Xdebug or PCOV — see apps/api/CLAUDE.md)
cd apps/api && ./vendor/bin/pest --coverage

# Frontend
npm --workspace apps/dashboard run test
```

> **PHP coverage driver:** `--coverage` requires Xdebug or PCOV installed for the host PHP CLI.
> - macOS: `pecl install pcov && echo "extension=pcov.so" >> $(php --ini | grep 'Loaded Configuration' | awk '{print $NF}')`
> - Ubuntu/Debian: `sudo apt install php8.3-pcov`
>
> Running `pest` without `--coverage` works without any extension and confirms all tests pass.
