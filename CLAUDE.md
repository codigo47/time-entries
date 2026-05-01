# CLAUDE.md — Time Entry Monorepo

This is a Laravel + Vue monorepo. Two apps:

- `apps/api` — Laravel 12 REST API (PHP 8.3, Postgres). See `apps/api/CLAUDE.md`.
- `apps/dashboard` — Vue 3 SPA (TypeScript, Vite, Tailwind, shadcn-vue). See `apps/dashboard/CLAUDE.md`.

## Working directory contract

Always run commands from the repo root unless the file says otherwise.
- Bring up the database: `docker compose up -d`
- Full bootstrap: `bash scripts/dev.sh`

## Conventions

- All new IDs are UUIDv7. Never introduce auto-incrementing primary keys.
- The API never serves HTML; the dashboard never embeds in a server-rendered page. Calls go over HTTP.
- Validations live in the API. The frontend mirrors them with Zod for UX speed but is not authoritative.
- Cache only via `Cache-Control` and `ETag` (HTTP-level). No Redis until traffic justifies it (see README_detailed).

## Tests

- Backend: `cd apps/api && ./vendor/bin/pest`
- Frontend: `npm --workspace apps/dashboard run test`
- Both target 100% coverage. Don't ship a feature without tests.

## Style

- Backend follows Laravel + PSR-12 + Larastan level 8.
- Frontend follows the shared ESLint config in `packages/eslint-config` and `vue-tsc --strict`.
