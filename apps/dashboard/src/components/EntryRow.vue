<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, Sparkles, Trash2 } from 'lucide-vue-next'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'
import { useLookupsStore } from '@/stores/lookups'
import AiEntryDialog from './AiEntryDialog.vue'
import type { PartialDraft } from './AiEntryDialog.vue'

const props = withDefaults(defineProps<{
  draft: TimeEntryDraft
  rowErrors: Record<string, string[]>
  seq?: number
  aiEnabled?: boolean
}>(), {
  seq: undefined,
  /* c8 ignore next */
  aiEnabled: () => import.meta.env.VITE_AI_ENABLED !== 'false',
})
const emit = defineEmits<{
  (e: 'update:draft', value: TimeEntryDraft): void
  (e: 'duplicate'): void
  (e: 'remove'): void
}>()

const lookups = useLookupsStore()

const employees = computed(() => {
  const projectId = props.draft.project_id
  const companyId = props.draft.company_id
  if (projectId) return lookups.employeesByProject[projectId] ?? []
  if (companyId) return lookups.employeesByCompany[companyId] ?? []
  return []
})
const projects = computed(() =>
  props.draft.company_id ? lookups.projectsByCompany[props.draft.company_id] ?? [] : [])
const tasks = computed(() =>
  props.draft.company_id ? lookups.tasksByCompany[props.draft.company_id] ?? [] : [])

const hasErrors = computed(() => Object.keys(props.rowErrors).length > 0)
const errorCount = computed(() => Object.keys(props.rowErrors).length)

const suppressCompanyClear = ref(false)
const suppressProjectClear = ref(false)

watch(() => props.draft.company_id, async (id) => {
  if (!id) return
  await Promise.all([
    lookups.loadEmployees(id),
    lookups.loadProjects(id),
    lookups.loadTasks(id),
  ])
  if (suppressCompanyClear.value) {
    suppressCompanyClear.value = false
    return
  }
  // clear dependent fields when company changes
  emit('update:draft', { ...props.draft, employee_id: undefined, project_id: undefined, task_id: undefined })
})

watch(() => props.draft.project_id, async (projectId) => {
  if (!projectId) return
  await lookups.loadEmployeesByProject(projectId)
  if (suppressProjectClear.value) {
    suppressProjectClear.value = false
    return
  }
  // If current employee_id is not in the filtered list, clear it
  if (props.draft.employee_id && !employees.value.some(e => e.id === props.draft.employee_id)) {
    emit('update:draft', { ...props.draft, employee_id: undefined })
  }
})

function set<K extends keyof TimeEntryDraft>(key: K, value: TimeEntryDraft[K]) {
  emit('update:draft', { ...props.draft, [key]: value })
}
function err(field: string): string | undefined {
  return props.rowErrors[field]?.[0]
}

const aiOpen = ref(false)
const aiUnmatched = ref<string[]>([])

function onAiApply({ row, unmatched }: { row: PartialDraft; unmatched: string[] }) {
  aiUnmatched.value = unmatched
  // Suppress the cascading clear watchers when AI provides a complete row
  if (row.company_id && row.company_id !== props.draft.company_id) {
    suppressCompanyClear.value = true
  }
  if (row.project_id && row.project_id !== props.draft.project_id) {
    suppressProjectClear.value = true
  }
  emit('update:draft', { ...props.draft, ...row })
}

const labelClass = 'block text-xs text-muted-foreground mb-1'
const inputClass = 'w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50'
const selectClass = 'w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-ring cursor-pointer'
</script>

<template>
  <div
    data-test="entry-row"
    class="rounded-lg border bg-card p-4 transition-colors"
    :class="hasErrors ? 'border-destructive ring-2 ring-destructive/30' : 'border-border'"
  >
    <!-- Error badge -->
    <div v-if="hasErrors" class="flex justify-end mb-2">
      <span class="text-xs text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full">
        {{ errorCount }} {{ errorCount === 1 ? 'issue' : 'issues' }}
      </span>
    </div>

    <!-- Line 1: Date · Company · Project · Employee -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <!-- Date -->
      <div>
        <label :class="labelClass">Date</label>
        <input
          data-test="date-input"
          type="date"
          :value="draft.date"
          :class="inputClass"
          @input="set('date', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- Company -->
      <div>
        <label :class="labelClass">Company</label>
        <select
          data-test="company-select"
          :value="draft.company_id"
          :class="[selectClass, err('company_id') ? 'border-destructive' : '']"
          @change="set('company_id', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Select...</option>
          <option v-for="c in lookups.companies" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <p v-if="err('company_id')" class="text-xs text-destructive mt-1" data-test="err-company_id">
          {{ err('company_id') }}
        </p>
      </div>

      <!-- Project -->
      <div>
        <label :class="labelClass">Project</label>
        <select
          data-test="project-select"
          :value="draft.project_id"
          :disabled="!draft.company_id"
          :class="[selectClass, err('project_id') ? 'border-destructive' : '']"
          @change="set('project_id', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Select...</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <p v-if="err('project_id')" class="text-xs text-destructive mt-1" data-test="err-project_id">
          {{ err('project_id') }}
        </p>
      </div>

      <!-- Employee -->
      <div>
        <label :class="labelClass">Employee</label>
        <select
          data-test="employee-select"
          :value="draft.employee_id"
          :disabled="!draft.company_id"
          :class="[selectClass, err('employee_id') ? 'border-destructive' : '']"
          @change="set('employee_id', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Select...</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
        <p v-if="err('employee_id')" class="text-xs text-destructive mt-1" data-test="err-employee_id">
          {{ err('employee_id') }}
        </p>
      </div>
    </div>

    <!-- Line 2: Task · Hours · Notes -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <!-- Task -->
      <div>
        <label :class="labelClass">Task</label>
        <select
          data-test="task-select"
          :value="draft.task_id"
          :disabled="!draft.company_id"
          :class="[selectClass, err('task_id') ? 'border-destructive' : '']"
          @change="set('task_id', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Select...</option>
          <option v-for="t in tasks" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <p v-if="err('task_id')" class="text-xs text-destructive mt-1" data-test="err-task_id">
          {{ err('task_id') }}
        </p>
      </div>

      <!-- Hours -->
      <div>
        <label :class="labelClass">Hours</label>
        <input
          data-test="hours-input"
          type="number"
          step="0.25"
          min="0.25"
          max="24"
          :value="draft.hours"
          :class="[inputClass, err('hours') ? 'border-destructive' : '', 'text-right']"
          @input="set('hours', Number(($event.target as HTMLInputElement).value))"
        />
        <p v-if="err('hours')" class="text-xs text-destructive mt-1 text-right" data-test="err-hours">
          {{ err('hours') }}
        </p>
      </div>

      <!-- Notes -->
      <div>
        <label :class="labelClass">Notes</label>
        <input
          data-test="notes-input"
          type="text"
          :value="draft.notes ?? ''"
          :class="inputClass"
          placeholder="Optional notes"
          @input="set('notes', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- AI unmatched banner -->
    <div
      v-if="aiUnmatched.length"
      class="mb-3 rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive"
      data-test="ai-unmatched-banner"
    >
      AI could not match: {{ aiUnmatched.join(', ') }}. Please complete those fields manually.
    </div>

    <!-- Line 3: Action row — 3-column layout -->
    <div class="grid grid-cols-3 items-center">
      <div />
      <div class="flex justify-center gap-3">
        <button
          data-test="duplicate-btn"
          aria-label="Duplicate row"
          title="Duplicate row"
          class="inline-flex items-center justify-center size-10 rounded-md bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 transition-opacity"
          @click="emit('duplicate')"
        >
          <Copy class="size-4" />
        </button>
        <button
          data-test="remove-btn"
          aria-label="Remove row"
          title="Remove row"
          class="inline-flex items-center justify-center size-10 rounded-md bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 transition-opacity"
          @click="emit('remove')"
        >
          <Trash2 class="size-4" />
        </button>
      </div>
      <div class="flex justify-end">
        <button
          data-test="ai-btn"
          aria-label="AI assist"
          title="AI assist"
          :disabled="!props.aiEnabled"
          class="inline-flex items-center justify-center size-10 rounded-md bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          @click="aiOpen = true"
        >
          <Sparkles class="size-4" />
        </button>
      </div>
    </div>

    <AiEntryDialog v-model="aiOpen" @apply="onAiApply" />
  </div>
</template>
