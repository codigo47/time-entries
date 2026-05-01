# Time Entry App

A Laravel 12 REST API + Vue 3 SPA for recording employee time entries. See `README_detailed.md` for the deeper write-up.

## Requirements

- PHP 8.3 with `pdo_pgsql`, `intl`, `bcmath`
- Composer 2.x
- Node 22 + npm 10
- Docker (only for Postgres)

## Setup

### 1. Copy the env files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
```

### 2. Edit the root `.env`

Used by `docker-compose.yml` to start Postgres.

| Key | Default | Description |
|---|---|---|
| `POSTGRES_PORT` | `5477` | Host port the Postgres container binds to. |
| `POSTGRES_DB` | `time_entries` | Database name. |
| `POSTGRES_USER` | `time_entries` | Database user. |
| `POSTGRES_PASSWORD` | `time_entries` | Database password. Change it for non-local environments. |

### 3. Edit `apps/api/.env`

Used by Laravel.

| Key | Default | Description |
|---|---|---|
| `APP_KEY` | _empty_ | Generated in step 4 below. |
| `APP_ENV` | `local` | `local` for dev, `production` for prod. |
| `APP_DEBUG` | `true` | Set to `false` in production. |
| `APP_URL` | `http://127.0.0.1:8000` | Public URL of the API. |
| `DB_HOST` | `127.0.0.1` | Postgres host. |
| `DB_PORT` | `5477` | Must match `POSTGRES_PORT` from the root `.env`. |
| `DB_DATABASE` | `time_entries` | Must match `POSTGRES_DB`. |
| `DB_USERNAME` | `time_entries` | Must match `POSTGRES_USER`. |
| `DB_PASSWORD` | `time_entries` | Must match `POSTGRES_PASSWORD`. |
| `CACHE_STORE` | `database` | Cache backend. |
| `SESSION_DRIVER` | `array` | No sessions used. |
| `QUEUE_CONNECTION` | `sync` | No queue worker used. |
| `OPENAI_API_KEY` | _empty_ | Required only for the AI-assisted entry feature. Get one at https://platform.openai.com/api-keys. |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model used by the parse action. |
| `FRONTEND_URL` | `http://127.0.0.1:5173` | Origin allowed by CORS. |

### 4. Install backend dependencies and generate the Laravel app key

```bash
cd apps/api
composer install
php artisan key:generate
```

### 5. Edit `apps/dashboard/.env`

Used by Vite.

| Key | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | Where the SPA sends API requests. |
| `VITE_AI_ENABLED` | _unset_ (= enabled) | Set to `false` to hide the AI assist button. |

### 6. Install frontend dependencies

```bash
cd apps/dashboard
npm install
```

## Run

Open four terminals and run the commands below, **in this order**.

**Terminal 1 — Postgres**

```bash
docker compose up
```

**Terminal 2 — Migrations and seeders** (run once, then close this terminal)

```bash
cd apps/api
php artisan migrate:fresh --seed
```

**Terminal 3 — Backend (API)**

```bash
cd apps/api
php artisan serve --host=127.0.0.1 --port=8000
```

**Terminal 4 — Frontend (dashboard)**

```bash
cd apps/dashboard
npm run dev
```

Open http://127.0.0.1:5173.

## Tests

### Requirements

- **Backend tests**: no extra requirements.
- **Backend coverage** (`--coverage`): requires Xdebug or PCOV installed for the host PHP CLI.
  - Ubuntu/Debian:

    ```bash
    sudo apt install php8.3-pcov
    ```

  - macOS (PECL):

    ```bash
    pecl install pcov
    ```

    Then add `extension=pcov.so` to your `php.ini`.
- **Frontend tests**: no extra requirements (Vitest runs in jsdom).

### Run backend tests

```bash
cd apps/api
./vendor/bin/pest
```

### Run backend tests with coverage

```bash
cd apps/api
./vendor/bin/pest --coverage
```

### Run frontend tests

```bash
cd apps/dashboard
npm run test
```
