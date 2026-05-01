<script setup lang="ts">
import { useHistoryStore } from '@/stores/history'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'

const history = useHistoryStore()
const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

function employees() {
  const id = history.filters.company_id ?? (ctx.companyId !== 'all' ? ctx.companyId : undefined)
  return id ? lookups.employeesByCompany[id] ?? [] : []
}
function projects() {
  const id = history.filters.company_id ?? (ctx.companyId !== 'all' ? ctx.companyId : undefined)
  return id ? lookups.projectsByCompany[id] ?? [] : []
}

function onFilter() {
  history.filters.page = 1
  history.load()
}
</script>

<template>
  <div
    class="flex flex-wrap items-end gap-4"
    data-test="history-filters"
  >
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-muted-foreground">From</label>
      <input
        type="date"
        data-test="filter-date-from"
        :value="history.filters.date_from ?? ''"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
        placeholder="date"
        @change="history.filters.date_from = ($event.target as HTMLInputElement).value || undefined; onFilter()"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-muted-foreground">Through</label>
      <input
        type="date"
        data-test="filter-date-to"
        :value="history.filters.date_to ?? ''"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
        placeholder="date"
        @change="history.filters.date_to = ($event.target as HTMLInputElement).value || undefined; onFilter()"
      />
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-muted-foreground">Employee</label>
      <select
        data-test="filter-employee"
        :value="history.filters.employee_id ?? ''"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer"
        @change="history.filters.employee_id = ($event.target as HTMLSelectElement).value || undefined; onFilter()"
      >
        <option value="">All employees</option>
        <option v-for="e in employees()" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-muted-foreground">Project</label>
      <select
        data-test="filter-project"
        :value="history.filters.project_id ?? ''"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer"
        @change="history.filters.project_id = ($event.target as HTMLSelectElement).value || undefined; onFilter()"
      >
        <option value="">All projects</option>
        <option v-for="p in projects()" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>
  </div>
</template>
