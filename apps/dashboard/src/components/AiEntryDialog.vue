<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useLookupsStore } from '@/stores/lookups'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'

export type PartialDraft = Partial<Omit<TimeEntryDraft, '_id'>>

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', value: { row: PartialDraft; unmatched: string[] }): void
}>()

const lookups = useLookupsStore()

const text = ref('')
const loading = ref(false)
const guardrailError = ref<string | null>(null)
const apiError = ref<string | null>(null)

function isLikelyTimeEntry(t: string): boolean {
  return (
    /\b\d+(\.\d+)?\s*(h|hr|hrs|hour|hours)\b/i.test(t) ||
    /\b(worked|working|did|doing|completed|finished|spent)\b/i.test(t)
  )
}

function close() {
  text.value = ''
  loading.value = false
  guardrailError.value = null
  apiError.value = null
  emit('update:modelValue', false)
}

async function submit() {
  guardrailError.value = null
  apiError.value = null

  if (!isLikelyTimeEntry(text.value)) {
    guardrailError.value = 'Please describe a time entry — include the hours and what was worked on.'
    return
  }

  loading.value = true
  try {
    const { data } = await api.post('/time-entries/parse', { text: text.value })
    const rows: Array<{
      company_id: string | null
      employee_id: string | null
      project_id: string | null
      task_id: string | null
      date: string | null
      hours: number | null
      notes: string | null
    }> = data.rows ?? []

    if (!rows.length) {
      apiError.value = 'Unable to parse. Try rephrasing.'
      return
    }

    const parsed = rows[0]
    const unmatched: string[] = []
    const row: PartialDraft = {}

    // Load companies list
    await lookups.loadCompanies()

    // company
    if (parsed.company_id) {
      const found = lookups.companies.find((c) => c.id === parsed.company_id)
      if (found) {
        row.company_id = parsed.company_id
        await Promise.all([
          lookups.loadEmployees(parsed.company_id),
          lookups.loadProjects(parsed.company_id),
          lookups.loadTasks(parsed.company_id),
        ])
      } else {
        unmatched.push('company')
      }
    }

    const cid = row.company_id
    const empList = cid ? (lookups.employeesByCompany[cid] ?? []) : []
    const projList = cid ? (lookups.projectsByCompany[cid] ?? []) : []
    const taskList = cid ? (lookups.tasksByCompany[cid] ?? []) : []

    // employee
    if (parsed.employee_id) {
      if (empList.some((e) => e.id === parsed.employee_id)) {
        row.employee_id = parsed.employee_id
      } else {
        unmatched.push('employee')
      }
    }

    // project
    if (parsed.project_id) {
      if (projList.some((p) => p.id === parsed.project_id)) {
        row.project_id = parsed.project_id
      } else {
        unmatched.push('project')
      }
    }

    // task
    if (parsed.task_id) {
      if (taskList.some((t) => t.id === parsed.task_id)) {
        row.task_id = parsed.task_id
      } else {
        unmatched.push('task')
      }
    }

    if (parsed.date) row.date = parsed.date
    if (parsed.hours != null) row.hours = parsed.hours
    if (parsed.notes != null) row.notes = parsed.notes

    emit('apply', { row, unmatched })
    close()
  } catch {
    apiError.value = 'Unable to parse. Try rephrasing.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-test="ai-entry-dialog"
      @click.self="close"
    >
      <div class="bg-card rounded-lg border border-border shadow-xl w-full max-w-[480px] mx-4 p-6">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-4">
          <Sparkles class="size-5 text-primary" />
          <h2 class="text-base font-semibold text-foreground">Generate from prompt</h2>
        </div>

        <!-- Textarea -->
        <textarea
          v-model="text"
          rows="4"
          data-test="ai-entry-textarea"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 resize-none"
          placeholder="e.g. Athena worked on Olympus CRM doing cleanup for 2 hours on 2026-05-01"
        />

        <!-- Hint -->
        <p class="text-xs text-muted-foreground mt-1.5 mb-3">
          Be specific: include the company, project, employee, task, date, and hours.
        </p>

        <!-- Guardrail error -->
        <p
          v-if="guardrailError"
          class="text-xs text-destructive mb-3"
          data-test="ai-entry-guardrail"
        >
          {{ guardrailError }}
        </p>

        <!-- API error -->
        <p
          v-if="apiError"
          class="text-xs text-destructive mb-3"
          data-test="ai-entry-error"
        >
          {{ apiError }}
        </p>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            data-test="ai-entry-cancel"
            class="px-4 py-2 text-sm rounded-md border border-border bg-transparent text-foreground cursor-pointer hover:bg-muted transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            data-test="ai-entry-submit"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            @click="submit"
          >
            <Sparkles class="size-4" />
            {{ loading ? 'Generating…' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
