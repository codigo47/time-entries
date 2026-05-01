# CLAUDE.md — apps/dashboard

Vue 3 + TypeScript + Vite + Tailwind + shadcn-vue.

## Layout

- `src/services/api.ts` — Axios instance with ETag cache (replays cached body on 304).
- `src/stores/` — Pinia stores. Each has its own file (`companyContext`, `lookups`, `draftEntries`, `history`).
- `src/composables/` — reusable hooks (`useLookupsForCompany`, `useKeyboardShortcuts`).
- `src/components/` — UI components. shadcn-vue primitives live in `src/components/ui/` (don't hand-edit).
- `src/pages/` — route-level views.
- `src/layouts/` — outer chrome.

## Validation

Frontend validation uses Zod schemas from `@shared/schemas/timeEntry`. They are intentionally identical in spirit to the backend's Form Request rules. The backend remains authoritative — render its errors keyed by `entries.<i>.<field>` for the right cell.

## Keyboard shortcuts

Defined in `composables/useKeyboardShortcuts.ts`. Add new ones at the call site (typically `EntriesPage.vue`). Press `?` for the help dialog.

## Tests

`npm run test` runs Vitest with `@vue/test-utils` and `@testing-library/vue`. Coverage thresholds are 100% for lines/branches/functions/statements.

## When adding a feature

1. Schema in `packages/shared-types/src/schemas/`
2. Store changes (state + actions)
3. Component(s)
4. Tests for store + component
5. Wire into page
