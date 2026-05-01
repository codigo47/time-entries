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

const hasErrors = computed(() => Object.keys(props.rowErrors).length > 0)

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

const cellStyle = 'padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--rule); vertical-align: top;'
const inputStyle = 'background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; width: 100%; font-family: var(--font-sans); font-size: 0.875rem; color: var(--ink); padding: 0.125rem 0;'
const selectStyle = 'background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; width: 100%; font-family: var(--font-sans); font-size: 0.875rem; color: var(--ink); padding: 0.125rem 0; cursor: pointer;'
</script>

<template>
  <tr
    data-test="entry-row"
    :style="{
      borderLeft: hasErrors ? '2px solid var(--vermilion)' : '2px solid transparent',
      transition: 'border-left-color 250ms var(--ease-studio)',
      position: 'relative',
    }"
    class="entry-row-hover"
  >
    <!-- Sequence number — draftsman marginalia -->
    <td
      :style="cellStyle + 'border-right: 1px solid var(--rule); text-align: center; width: 2.5rem;'"
    >
      <span style="font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.05em; color: var(--graphite);">
        {{ String(seq ?? 1).padStart(2, '0') }}
      </span>
    </td>

    <!-- Company -->
    <td :style="cellStyle">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span v-if="err('company_id')" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vermilion);flex-shrink:0;" />
        <select data-test="company-select" :value="draft.company_id" :style="selectStyle" @change="set('company_id', ($event.target as HTMLSelectElement).value)">
          <option value="">Select…</option>
          <option v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <p v-if="err('company_id')" class="text-xs" data-test="err-company_id" style="font-style: italic; color: var(--error); font-size: 0.7rem; margin-top: 2px; font-family: var(--font-sans);">
        {{ err('company_id') }}
      </p>
    </td>

    <!-- Date -->
    <td :style="cellStyle">
      <input
        data-test="date-input"
        type="date"
        :value="draft.date"
        :style="inputStyle + 'font-family: var(--font-mono); font-size: 0.8rem;'"
        @input="set('date', ($event.target as HTMLInputElement).value)"
      />
    </td>

    <!-- Employee -->
    <td :style="cellStyle">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span v-if="err('employee_id')" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vermilion);flex-shrink:0;" />
        <select data-test="employee-select" :value="draft.employee_id" :disabled="!draft.company_id" :style="selectStyle" @change="set('employee_id', ($event.target as HTMLSelectElement).value)">
          <option value="">Select…</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>
      <p v-if="err('employee_id')" class="text-xs" data-test="err-employee_id" style="font-style: italic; color: var(--error); font-size: 0.7rem; margin-top: 2px; font-family: var(--font-sans);">
        {{ err('employee_id') }}
      </p>
    </td>

    <!-- Project -->
    <td :style="cellStyle">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span v-if="err('project_id')" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vermilion);flex-shrink:0;" />
        <select data-test="project-select" :value="draft.project_id" :disabled="!draft.company_id" :style="selectStyle" @change="set('project_id', ($event.target as HTMLSelectElement).value)">
          <option value="">Select…</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <p v-if="err('project_id')" class="text-xs" data-test="err-project_id" style="font-style: italic; color: var(--error); font-size: 0.7rem; margin-top: 2px; font-family: var(--font-sans);">
        {{ err('project_id') }}
      </p>
    </td>

    <!-- Task -->
    <td :style="cellStyle">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span v-if="err('task_id')" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vermilion);flex-shrink:0;" />
        <select data-test="task-select" :value="draft.task_id" :disabled="!draft.company_id" :style="selectStyle" @change="set('task_id', ($event.target as HTMLSelectElement).value)">
          <option value="">Select…</option>
          <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <p v-if="err('task_id')" class="text-xs" data-test="err-task_id" style="font-style: italic; color: var(--error); font-size: 0.7rem; margin-top: 2px; font-family: var(--font-sans);">
        {{ err('task_id') }}
      </p>
    </td>

    <!-- Hours — right-aligned, mono, heavier weight -->
    <td :style="cellStyle + 'text-align: right;'">
      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
        <span v-if="err('hours')" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--vermilion);flex-shrink:0;" />
        <input
          data-test="hours-input"
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          :value="draft.hours"
          :style="inputStyle + 'font-family: var(--font-mono); font-weight: 500; font-size: 0.9rem; text-align: right; width: 5rem;'"
          @input="set('hours', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <p v-if="err('hours')" class="text-xs" data-test="err-hours" style="font-style: italic; color: var(--error); font-size: 0.7rem; margin-top: 2px; font-family: var(--font-sans); text-align: right;">
        {{ err('hours') }}
      </p>
    </td>

    <!-- Notes — italic placeholder -->
    <td :style="cellStyle">
      <input
        data-test="notes-input"
        type="text"
        :value="draft.notes ?? ''"
        :style="inputStyle + 'font-style: italic;'"
        placeholder="memo…"
        @input="set('notes', ($event.target as HTMLInputElement).value)"
      />
    </td>

    <!-- Row actions — revealed on hover -->
    <td :style="cellStyle + 'text-align: center; white-space: nowrap;'" class="row-actions">
      <button
        data-test="duplicate-btn"
        title="Duplicate row"
        style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 2px 4px; letter-spacing: 0.05em; opacity: 0; transition: opacity 180ms;"
        class="row-action-btn"
        @click="emit('duplicate')"
      >D</button>
      <button
        data-test="remove-btn"
        title="Remove row"
        style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--vermilion); background: transparent; border: none; cursor: pointer; padding: 2px 4px; letter-spacing: 0.05em; opacity: 0; transition: opacity 180ms;"
        class="row-action-btn"
        @click="emit('remove')"
      >×</button>
    </td>
  </tr>
</template>

<style scoped>
.entry-row-hover:hover .row-action-btn {
  opacity: 1 !important;
}
</style>
