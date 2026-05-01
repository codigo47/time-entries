# Time Entry App — Design Spec

**Date:** 2026-05-01
**Status:** Approved (pending user review of written doc)
**Owner:** codigo47@gmail.com

## 1. Goal

Build a Laravel 12 REST API and a Vue 3 SPA that lets users record and review employee time entries against companies, projects, and tasks, enforcing the business rule that an employee can only work on one project per date (but multiple tasks within that project on that date).

Authentication is **out of scope** for this iteration. The repo is structured so auth can be slotted in later.

## 2. Tech Stack

### Backend (`apps/api`)
- Laravel 12, PHP 8.3
- PostgreSQL 16 (Docker, port 5477)
- Pest 3 for tests
- Larastan / PHPStan level 8
- Spatie Query Builder for filter/sort/include parsing
- Laravel Telescope (dev only)
- OpenAI PHP client for AI parsing

### Frontend (`apps/dashboard`)
- Vue 3 with Composition API + `<script setup>`
- TypeScript (strict)
- Vite
- Tailwind CSS + shadcn-vue (Reka UI primitives)
- Pinia
- Vue Router
- Axios
- VeeValidate + Zod
- Vitest + Vue Test Utils + @testing-library/vue

### Shared
- `packages/shared-types` — TypeScript types and Zod schemas mirroring API resources
- `packages/eslint-config` — shared ESLint config

### Infrastructure
- `docker-compose.yml` runs **only Postgres** (port 5477)
- API and dashboard run directly on the host
- `scripts/dev.sh` brings Postgres up, installs deps, runs migrations + seeders, prints the two commands to start API and dashboard

## 3. Data Model

All primary keys are **UUIDv7** (`HasUuidsv7` trait). Foreign keys are also UUID.

### Tables

```
companies          (id uuid pk, name varchar, timestamps)
employees          (id uuid pk, name varchar, email varchar UNIQUE, timestamps)

company_employee   (company_id uuid fk, employee_id uuid fk,
                    PRIMARY KEY (company_id, employee_id), timestamps)

projects           (id uuid pk, company_id uuid fk, name varchar, timestamps)
                   UNIQUE (company_id, name)

tasks              (id uuid pk, company_id uuid fk, name varchar, timestamps)
                   UNIQUE (company_id, name)

employee_project   (employee_id uuid fk, project_id uuid fk,
                    PRIMARY KEY (employee_id, project_id), timestamps)

time_entries       (id uuid pk, company_id uuid fk, employee_id uuid fk,
                    project_id uuid fk, task_id uuid fk,
                    date DATE NOT NULL, hours DECIMAL(4,2) NOT NULL,
                    notes TEXT NULL, timestamps)
                   UNIQUE (employee_id, date, project_id, task_id)
                   CHECK (hours > 0 AND hours <= 24)
                   CHECK (hours = ROUND(hours * 4) / 4)  -- quarter-hour increments
                   INDEXES: (company_id, date), (employee_id, date),
                            (project_id), (task_id)
```

### Business Rule Enforcement

The unique index `UNIQUE(employee_id, date, project_id, task_id)` prevents exact-duplicate rows. The "one project per (employee, date)" rule is enforced at the **application layer**: a Form Request + a service action that wraps the write in a transaction with `SELECT ... FOR UPDATE` on existing rows for the `(employee_id, date)` pair, rejecting any attempt to create a row whose `project_id` differs from one already recorded for that pair.

### Relationships

- `Company` hasMany `Employee` (through `company_employee`), hasMany `Project`, hasMany `Task`, hasMany `TimeEntry`
- `Employee` belongsToMany `Company`, belongsToMany `Project`, hasMany `TimeEntry`
- `Project` belongsTo `Company`, belongsToMany `Employee`, hasMany `TimeEntry`
- `Task` belongsTo `Company`, hasMany `TimeEntry`
- `TimeEntry` belongsTo `Company`, `Employee`, `Project`, `Task`

### Invariants

- An employee can only be assigned to a project belonging to a company they're a member of (enforced in `EmployeeProjectService`).
- A time entry's `(company, employee, project, task)` must be mutually consistent: `project.company_id == time_entry.company_id`, `task.company_id == time_entry.company_id`, `employee ∈ company.employees`, `project ∈ employee.projects`.

## 4. API Surface

All endpoints under `/api/v1`. JSON content type. Standard Laravel API Resources.

### Lookup endpoints (cacheable)

```
GET /companies
GET /companies/{id}/employees
GET /companies/{id}/projects
GET /companies/{id}/tasks
GET /employees/{id}/projects
GET /employees/{id}/companies
```

Cache headers: `Cache-Control: private, max-age=60`, `ETag` derived from `MAX(updated_at)` and row count of the relevant entity. Returns `304` on `If-None-Match` match.

### Time-entry endpoints

```
GET    /time-entries                 — paginated list with filters/sort/search
GET    /time-entries/{id}
POST   /time-entries                 — create one
POST   /time-entries/batch           — create many in one transaction
PATCH  /time-entries/{id}            — edit
DELETE /time-entries/{id}            — delete
GET    /time-entries/summary         — totals grouped by employee|project|task|date|company
```

### AI parsing endpoint

```
POST /time-entries/parse             — { text: "John worked on Project X..." }
                                       returns array of partial rows + per-field confidence
                                       Hidden in UI when OPENAI_API_KEY is unset.
```

### Filter parameters (Spatie Query Builder)

`company_id`, `employee_id`, `project_id`, `task_id`, `date_from`, `date_to`, `q` (full-text on notes), `sort` (e.g., `-date,employee.name`), `page`, `per_page` (default 25, max 100).

### Response envelope

```json
{ "data": { ... }, "meta": { "etag": "..." } }
```

### Error envelope (single)

`422 Unprocessable Entity`:
```json
{ "message": "...", "errors": { "project_id": ["..."] } }
```

### Error envelope (batch)

`422 Unprocessable Entity`:
```json
{
  "message": "Validation failed for one or more entries.",
  "errors": {
    "entries.0.project_id": ["The selected project does not belong to the chosen company."],
    "entries.3.date": ["Employee already has a different project on this date."]
  }
}
```

The frontend maps each error key by row index + field to highlight the exact cell.

## 5. Frontend Structure

### Pages

```
/                redirect → /entries
/entries?tab=new        New Entries tab (default)
/entries?tab=history    History tab
```

### Component tree

```
App.vue
└── DefaultLayout.vue           Header: Logo · CompanySelector · ThemeToggle
    └── EntriesPage.vue
        ├── CompanyContext.vue  Sticky company filter (default "All")
        ├── Tabs (shadcn)
        │   ├── NewEntriesTab.vue
        │   │   ├── AiAssistInput.vue       (collapsible; only when AI enabled)
        │   │   ├── EntryRow.vue ×N         (Company/Date/Employee/Project/Task/Hours/Notes/Actions)
        │   │   └── EntryFooter.vue         Add Row · Duplicate Last · Submit · running totals
        │   └── HistoryTab.vue
        │       ├── HistoryFilters.vue      date range, employee, project, task, search
        │       ├── HistoryTable.vue        sortable, paginated, edit/delete inline
        │       └── HistorySummary.vue      totals by group_by selector
```

### Pinia stores

- `useCompanyContextStore` — `{ companyId: string | "all" }`, persisted to localStorage
- `useLookupsStore` — companies, `employeesByCompany`, `projectsByCompany`, `tasksByCompany`. Lazy-loaded per company. ETag revalidation on focus.
- `useDraftEntriesStore` — `rows[]` for New Entries tab, persisted to localStorage so refresh doesn't lose work
- `useHistoryStore` — paginated entries, filters, sort, summary

### Keyboard shortcuts (entries page)

| Shortcut | Action |
|---|---|
| `Tab` / `Shift+Tab` | Next/prev cell |
| `Enter` (last cell of last row) | Add new row, focus first cell |
| `Ctrl/Cmd+D` | Duplicate current row |
| `Ctrl/Cmd+Backspace` | Delete current row (with undo toast) |
| `Ctrl/Cmd+Enter` | Submit all rows |
| `Ctrl/Cmd+1` / `Ctrl/Cmd+2` | Switch tabs |
| `?` | Show shortcut help dialog |

### Validation strategy (frontend)

- Per-cell live validation via VeeValidate + Zod schema on blur and on submit
- Cross-field rules in Zod refine: company → date → employee → project (filtered) → task → hours
- Pre-submit cross-row check warns when two rows propose different projects for same `(employee, date)`
- Backend `422` errors map by `entries.{idx}.{field}` and highlight the exact cell with the message
- Server response is the source of truth; frontend errors clear when server validates a row

## 6. Validation, Business Rules, Performance

### Layered validation

| Layer | Rules |
|---|---|
| DB schema | UNIQUE composite (prevents exact duplicates), FK constraints, CHECK on hours range and quarter-hour |
| Form Request | Type/format, exists-in-DB checks, hours range/step, date sanity bounds, mutual consistency between company/employee/project/task |
| Service / Action | Wraps writes in transaction with `SELECT ... FOR UPDATE` on `(employee_id, date)` rows; enforces "one project per employee per date" against DB and other batch rows; returns field-pathed errors |
| Frontend (UX only) | Same Zod schema, live validation, cross-row check |

### Performance posture

| Concern | Strategy |
|---|---|
| Dropdown fetches | Per-company endpoints; `Cache-Control: private, max-age=60` + ETag (304 on no change). Browser caches per session. |
| N+1 prevention | Eager-load relations in resources (`with([...])`), select only needed columns |
| Pagination | Spatie Query Builder offset pagination, default 25, max 100 |
| SPA lookups | Pinia in-memory cache per company; ETag revalidation on tab switch |
| Bulk insert | Batch endpoint validates all rows then `insert()` in single transaction |
| AI parser | 10 req/min/IP rate limit, 8s timeout, graceful fallback |
| Indexes | `(employee_id, date)`, `(company_id, date)`, `(project_id)`, `(task_id)` |
| Future-scale notes (README) | Redis tagged cache, materialized summary views, cursor pagination |

## 7. Testing Strategy

| Suite | Scope | Coverage Target |
|---|---|---|
| Backend Unit (Pest) | Services, Actions, Form Request rules, Policies (stubs), value objects | 100% lines |
| Backend Feature (Pest) | All API endpoints — success + error paths, business rule violations (one-project-per-day enforced in service layer), ETag/304, batch errors, AI parse mock | 100% endpoint coverage |
| Frontend Unit (Vitest) | Stores, composables, Zod schemas, utility fns | 100% lines |
| Frontend Component (Vue Test Utils + @testing-library/vue) | EntryRow, NewEntriesTab, HistoryTab, AiAssistInput, CompanyContext, keyboard shortcuts, error mapping | 100% components |
| Static analysis | Larastan level 8, vue-tsc strict, ESLint shared config | clean |

## 8. Seeders & Factories

Deterministic, idempotent (`firstOrCreate`):

- **CompanySeeder** — 5 companies (Roman gods): Jupiter Industries, Mars Logistics, Neptune Networks, Mercury Couriers, Vulcan Forge
- **EmployeeSeeder** — 12 employees (Greek gods + contemporary philosophers): Athena Pallas, Apollo Helios, Artemis Selene, Hermes Trismegistus, Dionysus Bacchus, Hera Olympia, Demeter Ceres, Hades Pluto, Michel Foucault, Judith Butler, Slavoj Žižek, Byung-Chul Han
- **CompanyEmployeeSeeder** — each employee in 2-3 companies
- **ProjectSeeder** — 3-4 projects per company (e.g., Pantheon Migration, Olympus CRM, Stoa Refactor, Dialectic Analytics)
- **TaskSeeder** — 5-6 tasks per company: Development, QA Testing, Code Review, Documentation, Cleanup, Deployment
- **EmployeeProjectSeeder** — each employee on 1-3 projects within their companies
- **TimeEntrySeeder** — ~80 entries over the last 30 days, respecting all rules

Every model has a Factory used by tests.

## 9. Project Layout

```
project-root/
├── apps/
│   ├── api/                   Laravel 12
│   └── dashboard/             Vue 3 SPA
├── packages/
│   ├── shared-types/          TS types + Zod schemas
│   └── eslint-config/         shared ESLint
├── scripts/
│   ├── dev.sh                 Postgres up + install + migrate + seed + print run hints
│   ├── build.sh               Production build for both apps
│   └── deploy.sh              Stub with checklist comments
├── docs/superpowers/specs/    Design + plan documents
├── docker-compose.yml         Postgres only
├── README.md                  Setup + run + test
├── README_detailed.md         Architecture + features + decisions
├── .gitignore
├── .env.example
└── package.json
```

Notable backend files:
- `apps/api/app/Actions/CreateTimeEntries.php`
- `apps/api/app/Actions/UpdateTimeEntry.php`
- `apps/api/app/Actions/ParseTimeEntryText.php`
- `apps/api/app/Services/EtagService.php`
- `apps/api/app/Http/Controllers/Api/V1/{TimeEntryController, CompanyController, EmployeeController}.php`
- `apps/api/app/Http/Resources/{Company, Employee, Project, Task, TimeEntry}Resource.php`
- `apps/api/app/Http/Requests/{StoreTimeEntryRequest, BatchStoreTimeEntryRequest, UpdateTimeEntryRequest}.php`

Notable frontend files:
- `apps/dashboard/src/services/api.ts` — Axios instance with ETag and error normalization
- `apps/dashboard/src/composables/useLookups.ts`
- `apps/dashboard/src/composables/useKeyboardShortcuts.ts`
- `apps/dashboard/src/composables/useDraftEntries.ts`
- `apps/dashboard/src/stores/{companyContext, lookups, draftEntries, history}.ts`

## 10. Deliverables

- Source for both apps and shared packages
- All migrations, models, factories, seeders, controllers, requests, resources, services, actions
- 100% test coverage on backend (Pest) and frontend components (Vitest)
- `docker-compose.yml` with Postgres on port 5477
- `.env.example` at root, in `apps/api`, in `apps/dashboard`
- `README.md` (basic) + `README_detailed.md` (deep)
- `CLAUDE.md` at root, `apps/api/CLAUDE.md`, `apps/dashboard/CLAUDE.md`

## 11. Out of Scope (documented as next steps)

- Authentication (Laravel Sanctum, RBAC)
- Redis cache layer
- E2E tests (Playwright)
- CI workflows
- Production deployment beyond `scripts/deploy.sh` stub

## 12. Open Decisions

None at this time. All clarifying questions resolved with the user on 2026-05-01.

## 13. Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Include all bonus features (edit, duplicate, row-level errors, summaries, history filters, keyboard shortcuts, AI-assisted entry) | Explicit user request |
| 2 | Laravel 12 + PHP 8.3 | Modern, stable, broadly compatible |
| 3 | Vue 3 + TS + Vite + Tailwind + shadcn-vue | Distinctive UI, custom multi-row editor needs |
| 4 | Pinia + Axios + Vue Router + VeeValidate + Zod + Vitest | Vue ecosystem standards; Zod schemas reusable |
| 5 | Pest + Spatie Query Builder + Larastan; no Sanctum | Auth not in scope yet; avoids dead scaffolding |
| 6 | OpenAI provider, env-gated, graceful fallback | User choice |
| 7 | HTTP cache headers + ETag (no Redis) | User choice; documents Redis as scale-up path |
| 8 | Composite UNIQUE for exact-dup protection; "one project per employee per date" enforced in the API service layer (Form Request + transaction with `SELECT ... FOR UPDATE`) | User choice; keeps schema simple, business rule lives in the API |
| 9 | Hours decimal(4,2), 0.25 step, max 24 | User choice; standard timesheet UX |
| 10 | Pivots `company_employee` and `employee_project` (option A) | Models reality of company membership independent of project assignment |
| 11 | UUIDv7 primary keys | User request; sortable, indexes well |
| 12 | docker-compose runs only Postgres; API + dashboard run on host manually | User request |
