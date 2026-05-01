<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'
import { useLookupsStore } from '@/stores/lookups'

const props = defineProps<{
  draft: TimeEntryDraft
  rowErrors: Record<string, string[]>
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
</script>

<template>
  <tr data-test="entry-row">
    <td>
      <select data-test="company-select" :value="draft.company_id" @change="set('company_id', ($event.target as HTMLSelectElement).value)">
        <option value="">
          Select…
        </option>
        <option v-for="c in lookups.companies" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
      <p v-if="err('company_id')" class="text-xs text-red-600" data-test="err-company_id">
        {{ err('company_id') }}
      </p>
    </td>
    <td>
      <input data-test="date-input" type="date" :value="draft.date" @input="set('date', ($event.target as HTMLInputElement).value)" />
    </td>
    <td>
      <select data-test="employee-select" :value="draft.employee_id" :disabled="!draft.company_id" @change="set('employee_id', ($event.target as HTMLSelectElement).value)">
        <option value="">
          Select…
        </option>
        <option v-for="e in employees" :key="e.id" :value="e.id">
          {{ e.name }}
        </option>
      </select>
      <p v-if="err('employee_id')" class="text-xs text-red-600" data-test="err-employee_id">
        {{ err('employee_id') }}
      </p>
    </td>
    <td>
      <select data-test="project-select" :value="draft.project_id" :disabled="!draft.company_id" @change="set('project_id', ($event.target as HTMLSelectElement).value)">
        <option value="">
          Select…
        </option>
        <option v-for="p in projects" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
      <p v-if="err('project_id')" class="text-xs text-red-600" data-test="err-project_id">
        {{ err('project_id') }}
      </p>
    </td>
    <td>
      <select data-test="task-select" :value="draft.task_id" :disabled="!draft.company_id" @change="set('task_id', ($event.target as HTMLSelectElement).value)">
        <option value="">
          Select…
        </option>
        <option v-for="t in tasks" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
      <p v-if="err('task_id')" class="text-xs text-red-600" data-test="err-task_id">
        {{ err('task_id') }}
      </p>
    </td>
    <td>
      <input
        data-test="hours-input" type="number" step="0.25" min="0.25" max="24" :value="draft.hours"
        @input="set('hours', Number(($event.target as HTMLInputElement).value))"
      />
      <p v-if="err('hours')" class="text-xs text-red-600" data-test="err-hours">
        {{ err('hours') }}
      </p>
    </td>
    <td>
      <input
        data-test="notes-input" type="text" :value="draft.notes ?? ''"
        @input="set('notes', ($event.target as HTMLInputElement).value)"
      />
    </td>
    <td>
      <button data-test="duplicate-btn" @click="emit('duplicate')">
        Duplicate
      </button>
      <button data-test="remove-btn" @click="emit('remove')">
        Remove
      </button>
    </td>
  </tr>
</template>
