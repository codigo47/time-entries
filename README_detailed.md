# Time Entry App — Detailed

## Goal

Capture employee time entries while enforcing:
- Employee belongs to a chosen company.
- Project belongs to that company.
- Task belongs to that company.
- An employee can have only one project per date — but multiple tasks for that project that day.

## Architecture

Decoupled monorepo:
- `apps/api` — Laravel 12 REST API on Postgres 16.
- `apps/dashboard` — Vue 3 SPA.
- `packages/shared-types` — TypeScript types and Zod schemas shared between frontend and (in concept) the API contract.
- `packages/eslint-config` — ESLint 9 flat config used by the dashboard.

Postgres runs in Docker on port 5477. The API and dashboard run on the host.

## Tech choices

- **Laravel 12 + PHP 8.3** — modern, broad compatibility.
- **Vue 3 + TypeScript + Vite + Tailwind + shadcn-vue** — distinctive UI, full control over the multi-row time-entry editor.
- **Pinia + VeeValidate + Zod** — Vue ecosystem standards. Zod schemas live in `packages/shared-types`.
- **Pest 3 + Larastan + Spatie Query Builder** — modern Laravel testing and clean filter parsing.
- **OpenAI** — `gpt-4o-mini` for AI-assisted entry parsing.

## Directory structure

[mirror the spec exactly]

## Features and how they were implemented

### Time entry creation (single + batch)

`POST /api/v1/time-entries` and `POST /api/v1/time-entries/batch` route to `CreateTimeEntries`, an Action wrapped in `DB::transaction`. It:
1. Validates each row (Form Request), then the action runs business validation.
2. Locks the existing `(employee_id, date)` rows with `SELECT ... FOR UPDATE`.
3. Rejects rows that conflict with persisted state OR with other rows in the same batch.
4. Returns row-keyed errors (e.g. `entries.3.project_id`) so the SPA highlights the offending cell.

### History tab

Backed by `GET /api/v1/time-entries`, paginated by Spatie Query Builder. Filters: company, employee, project, task, date range, full-text on notes. Sorts: `-date`, `hours`, `created_at`.

### Summary totals

`GET /api/v1/time-entries/summary?group_by=date|employee|project|task|company` aggregates SUM(hours) and COUNT(*) per group key, respecting the same filters.

### Edit and delete from history

`PATCH` and `DELETE` on `/api/v1/time-entries/{id}`. Edit goes through `UpdateTimeEntry`, which re-runs the per-day-project rule.

### AI-assisted entry

`POST /api/v1/time-entries/parse` accepts `{ text }`. The action sends a system prompt that includes the company directory and asks for structured JSON rows. Names are resolved to UUIDs server-side; unknown names produce `null` IDs that the user must correct in the UI. Hidden when `OPENAI_API_KEY` is unset.

### Keyboard-friendly entry

Tab/Shift+Tab moves cell-by-cell (default browser behavior given proper inputs). Enter on the last cell of the last row adds a new row. Ctrl/Cmd+D duplicates a row. Ctrl/Cmd+Enter submits. Ctrl/Cmd+1/2 switches tabs. `?` opens the help dialog.

### Caching

Lookup endpoints (companies, employees per company, projects per company, tasks per company) set `Cache-Control: private, max-age=60` and an `ETag` derived from `MAX(updated_at) + COUNT(*)`. The Axios layer in the SPA replays the cached body on 304. Pinia memoizes per-company lookups for the session.

### Validation strategy

Frontend uses Zod. Backend uses Form Requests + Action-level rules + DB constraints. The backend wins; the frontend just speeds up the user.

## Performance considerations

- Every list endpoint eager-loads relations to avoid N+1.
- Time-entry filters use indexed columns (`(company_id, date)`, `(employee_id, date)`).
- ETag-based revalidation prevents redundant payloads on dropdowns.
- Pagination caps at 100 rows per page.
- AI parsing is rate-limited to 10/min/IP and timeboxed (8s).

### Future scale-up paths

- **Redis tagged cache** — replace HTTP caching for high-traffic dropdowns; invalidate by tag on writes.
- **Materialized summary views** — pre-aggregate by employee/project/date for very large datasets.
- **Cursor pagination** — once `time_entries` exceeds a few million rows, switch from offset to keyset.
- **Search index** — full-text search on notes and entity names via Postgres GIN index or a dedicated search service.
- **Read replicas** — split read traffic for `GET /time-entries` once write QPS becomes meaningful.

## Testing

- Backend: 100% line coverage on models, services, actions, requests, and controllers.
- Frontend: 100% on stores, composables, and components.
- Static analysis: Larastan level 8 + `vue-tsc --strict`.

## Out of scope

Authentication, RBAC, Redis, E2E tests, CI workflows, production deployment beyond `scripts/deploy.sh` stub. All documented in the spec.
