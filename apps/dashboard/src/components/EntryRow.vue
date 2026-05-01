<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'
import { useLookupsStore } from '@/stores/lookups'

const props = defineProps<{
  draft: TimeEntryDraft
  rowErrors: Record<string, string[]>
  seq?: number
}>()
const emit = defineEmits<{
  (e: 'update:draft', value: TimeEntryDraft): void
  (e: 'duplicate'): void
  (e: 'remove'): void
}>()

const lookups = useLookupsStore()

const employees = computed(() =>
  props.draft.company_id ? lookups.employeesByCompany[props.draft.company_id] ?? [] : [])
const projects = computed(() =>
  props.draft.company_id ? lookups.projectsByCompany[props.draft.company_id] ?? [] : [])
const tasks = computed(() =>
  props.draft.company_id ? lookups.tasksByCompany[props.draft.company_id] ?? [] : [])

watch(() => props.draft.company_id, async (id) => {
  if (!id) return
  await Promise.all([
    lookups.loadEmployees(id),
    lookups.loadProjects(id),
    lookups.loadTasks(id),
  ])
  // clear dependent fields when company changes
  emit('update:draft', { ...props.draft, employee_id: undefined, project_id: undefined, task_id: undefined })
})

function set<K extends keyof TimeEntryDraft>(key: K, value: TimeEntryDraft[K]) {
  emit('update:draft', { ...props.draft, [key]: value })
}
function err(field: string): string | undefined {
  return props.rowErrors[field]?.[0]
}

const cellClass = 'px-3 py-2 border-b border-border align-top'
const inputClass = 'w-full bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50'
const selectClass = 'w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer'
</script>

<template>
  <tr
    data-test="entry-row"
    class="hover:bg-muted/50 transition-colors"
  >
    <!-- Company -->
    <td :class="cellClass">
      <select
        data-test="company-select"
        :value="draft.company_id"
        :class="[selectClass, err('company_id') ? 'border-destructive' : '']"
        @change="set('company_id', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select…</option>
        <option v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <p v-if="err('company_id')" class="text-xs text-destructive mt-1" data-test="err-company_id">
        {{ err('company_id') }}
      </p>
    </td>

    <!-- Date -->
    <td :class="cellClass">
      <input
        data-test="date-input"
        type="date"
        :value="draft.date"
        :class="inputClass"
        @input="set('date', ($event.target as HTMLInputElement).value)"
      />
    </td>

    <!-- Employee -->
    <td :class="cellClass">
      <select
        data-test="employee-select"
        :value="draft.employee_id"
        :disabled="!draft.company_id"
        :class="[selectClass, err('employee_id') ? 'border-destructive' : '']"
        @change="set('employee_id', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select…</option>
        <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
      </select>
      <p v-if="err('employee_id')" class="text-xs text-destructive mt-1" data-test="err-employee_id">
        {{ err('employee_id') }}
      </p>
    </td>

    <!-- Project -->
    <td :class="cellClass">
      <select
        data-test="project-select"
        :value="draft.project_id"
        :disabled="!draft.company_id"
        :class="[selectClass, err('project_id') ? 'border-destructive' : '']"
        @change="set('project_id', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select…</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <p v-if="err('project_id')" class="text-xs text-destructive mt-1" data-test="err-project_id">
        {{ err('project_id') }}
      </p>
    </td>

    <!-- Task -->
    <td :class="cellClass">
      <select
        data-test="task-select"
        :value="draft.task_id"
        :disabled="!draft.company_id"
        :class="[selectClass, err('task_id') ? 'border-destructive' : '']"
        @change="set('task_id', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select…</option>
        <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <p v-if="err('task_id')" class="text-xs text-destructive mt-1" data-test="err-task_id">
        {{ err('task_id') }}
      </p>
    </td>

    <!-- Hours — right-aligned, sans-serif -->
    <td :class="cellClass" style="text-align: right;">
      <input
        data-test="hours-input"
        type="number"
        step="0.25"
        min="0.25"
        max="24"
        :value="draft.hours"
        :class="[inputClass, err('hours') ? 'border-destructive' : '']"
        style="width: 5rem; text-align: right;"
        @input="set('hours', Number(($event.target as HTMLInputElement).value))"
      />
      <p v-if="err('hours')" class="text-xs text-destructive mt-1" data-test="err-hours" style="text-align: right;">
        {{ err('hours') }}
      </p>
    </td>

    <!-- Notes -->
    <td :class="cellClass">
      <input
        data-test="notes-input"
        type="text"
        :value="draft.notes ?? ''"
        :class="inputClass"
        placeholder="Notes"
        @input="set('notes', ($event.target as HTMLInputElement).value)"
      />
    </td>

    <!-- Row actions -->
    <td :class="cellClass" style="text-align: center; white-space: nowrap;">
      <button
        data-test="duplicate-btn"
        title="Duplicate row"
        class="text-xs text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer px-1 py-0.5"
        @click="emit('duplicate')"
      >D</button>
      <button
        data-test="remove-btn"
        title="Remove row"
        class="text-xs text-destructive hover:text-destructive/80 bg-transparent border-none cursor-pointer px-1 py-0.5"
        @click="emit('remove')"
      >×</button>
    </td>
  </tr>
</template>
