# CLAUDE.md — apps/api

Laravel 12 REST API on PHP 8.3, Postgres 16. No auth scaffolded.

## Layout

- `app/Models/` — Eloquent models with `HasUuids` and a `newUniqueId()` returning UUIDv7.
- `app/Http/Controllers/Api/V1/` — thin controllers, one per resource.
- `app/Http/Resources/` — JSON shape for responses.
- `app/Http/Requests/` — validation rules. Common rules in `Concerns/TimeEntryRules.php`.
- `app/Actions/` — write-side business logic (CreateTimeEntries, UpdateTimeEntry, ParseTimeEntryText).
- `app/Services/` — read-side helpers (EtagService).
- `app/Exceptions/TimeEntryValidationException` — carries field-pathed errors out of actions.

## Business rule

An employee can only work on one project per date. Enforced in `CreateTimeEntries` and `UpdateTimeEntry` inside a transaction with `SELECT ... FOR UPDATE` on the `(employee_id, date)` rows. The DB only protects against exact duplicates via `UNIQUE(employee_id, date, project_id, task_id)`.

## Cache headers

Lookup endpoints set `Cache-Control: private, max-age=1200` (20 minutes) and an `ETag` from `EtagService`. They return `304` on `If-None-Match` match. The dashboard's axios layer auto-replays the cached body on 304.

## Tests

- `tests/Unit/` — pure unit tests for models, services, actions
- `tests/Feature/` — HTTP tests for endpoints and form requests
- Run: `./vendor/bin/pest` (no coverage driver required)
- Run with coverage: `./vendor/bin/pest --coverage`

### Coverage driver requirement

`--coverage` requires Xdebug or PCOV installed for the host PHP CLI binary. Without it, Pest exits with "No code coverage driver is available". Running `pest` without `--coverage` confirms tests pass and does not require any extension.

**Install PCOV:**

- macOS (PECL): `pecl install pcov && echo "extension=pcov.so" >> $(php --ini | grep 'Loaded Configuration' | awk '{print $NF}')`
- Ubuntu/Debian: `sudo apt install php8.3-pcov`
- Via PECL (any OS): `pecl install pcov` then add `extension=pcov.so` to your `php.ini`

## Adding a new endpoint

1. Form Request with rules
2. Action (if it mutates state) or controller method (if read-only)
3. Resource (if returning a model)
4. Route
5. Feature test for the route + Unit test for the action
