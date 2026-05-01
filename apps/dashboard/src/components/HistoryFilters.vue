<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useLookupsStore } from '@/stores/lookups'

const history = useHistoryStore()
const lookups = useLookupsStore()

const employees = computed(() => {
  const id = history.filters.company_id
  if (id) return lookups.employeesByCompany[id] ?? []
  return lookups.allEmployees
})

const projects = computed(() => {
  const id = history.filters.company_id
  if (id) return lookups.projectsByCompany[id] ?? []
  return lookups.allProjects
})

async function ensureAllLoaded() {
  if (!history.filters.company_id) {
    await Promise.all([lookups.loadAllEmployees(), lookups.loadAllProjects()])
  }
}

onMounted(async () => {
  await lookups.loadCompanies()
  await ensureAllLoaded()
})
watch(() => history.filters.company_id, ensureAllLoaded)

function onFilter() {
  history.filters.page = 1
  history.load()
}

function onCompanyChange(value: string) {
  history.filters.company_id = value || undefined
  // clear dependent filters when company changes
  history.filters.employee_id = undefined
  history.filters.project_id = undefined
  onFilter()
}
</script>

<template>
  <div
    class="flex flex-wrap items-end gap-4"
    data-test="history-filters"
  >
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-muted-foreground">Company</label>
      <select
        data-test="filter-company"
        :value="history.filters.company_id ?? ''"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer"
        @change="onCompanyChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="">All companies</option>
        <option v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
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
        <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
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
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

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
  </div>
</template>
