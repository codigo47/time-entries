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
  <!-- Editorial filter line: From · Through · Employee · Project -->
  <div
    class="flex flex-wrap items-center gap-0"
    data-test="history-filters"
    style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--graphite); border-bottom: 1px solid var(--rule); padding-bottom: 0.75rem;"
  >
    <span style="margin-right: 0.3em;">From</span>
    <input
      type="date"
      data-test="filter-date-from"
      :value="history.filters.date_from ?? ''"
      placeholder="date"
      style="font-family: var(--font-mono); font-size: 0.8125rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; color: var(--ink); padding: 0 0.2em; width: 9em;"
      @change="history.filters.date_from = ($event.target as HTMLInputElement).value || undefined; onFilter()"
    />
    <span style="margin: 0 0.5em; color: var(--rule);">·</span>
    <span style="margin-right: 0.3em;">Through</span>
    <input
      type="date"
      data-test="filter-date-to"
      :value="history.filters.date_to ?? ''"
      placeholder="date"
      style="font-family: var(--font-mono); font-size: 0.8125rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; color: var(--ink); padding: 0 0.2em; width: 9em;"
      @change="history.filters.date_to = ($event.target as HTMLInputElement).value || undefined; onFilter()"
    />
    <span style="margin: 0 0.5em; color: var(--rule);">·</span>
    <span style="margin-right: 0.3em;">Employee</span>
    <select
      data-test="filter-employee"
      :value="history.filters.employee_id ?? ''"
      style="font-family: var(--font-mono); font-size: 0.8125rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; color: var(--ink); padding: 0 0.2em; cursor: pointer;"
      @change="history.filters.employee_id = ($event.target as HTMLSelectElement).value || undefined; onFilter()"
    >
      <option value="">All employees</option>
      <option v-for="e in employees()" :key="e.id" :value="e.id">{{ e.name }}</option>
    </select>
    <span style="margin: 0 0.5em; color: var(--rule);">·</span>
    <span style="margin-right: 0.3em;">Project</span>
    <select
      data-test="filter-project"
      :value="history.filters.project_id ?? ''"
      style="font-family: var(--font-mono); font-size: 0.8125rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; color: var(--ink); padding: 0 0.2em; cursor: pointer;"
      @change="history.filters.project_id = ($event.target as HTMLSelectElement).value || undefined; onFilter()"
    >
      <option value="">All projects</option>
      <option v-for="p in projects()" :key="p.id" :value="p.id">{{ p.name }}</option>
    </select>
  </div>
</template>
