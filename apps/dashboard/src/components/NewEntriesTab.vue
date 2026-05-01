<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { api, fieldErrors } from '@/services/api'
import { timeEntryRowSchema } from '@shared/schemas/timeEntry'
import EntryRow from './EntryRow.vue'
import EntryFooter from './EntryFooter.vue'

const drafts = useDraftEntriesStore()
const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

const errorsByRow = ref<Record<number, Record<string, string[]>>>({})
const banner = ref<string | null>(null)

const totalErrors = computed(() =>
  Object.values(errorsByRow.value).reduce((sum, e) => sum + Object.keys(e).length, 0),
)

onMounted(async () => {
  await lookups.loadCompanies()
  if (drafts.rows.length === 0) {
    drafts.addRow({ company_id: ctx.companyId !== 'all' ? ctx.companyId : undefined })
  }
})

const DUPLICATE_BANNER = 'You cannot create a duplicate time entry with the same date, company, project, employee, and task.'

function hasDuplicateError(map: Record<number, Record<string, string[]>>): boolean {
  return Object.values(map).some((row) =>
    Object.values(row).some((msgs) => msgs.some((m) => /duplicate|already exists/i.test(m))),
  )
}

function localValidate(): boolean {
  errorsByRow.value = {}
  let ok = true
  drafts.rows.forEach((row, i) => {
    const result = timeEntryRowSchema.safeParse(row)
    if (!result.success) {
      ok = false
      const fmt: Record<string, string[]> = {}
      for (const issue of result.error.issues) {
        const k = issue.path.join('.')
        ;(fmt[k] ??= []).push(issue.message)
      }
      errorsByRow.value = { ...errorsByRow.value, [i]: fmt }
    }
  })

  // cross-row: exact duplicate (company + employee + project + task + date)
  const exactDupSeen = new Map<string, number>()
  drafts.rows.forEach((row, i) => {
    if (!row.company_id || !row.employee_id || !row.project_id || !row.task_id || !row.date) return
    const key = [row.company_id, row.employee_id, row.project_id, row.task_id, row.date].join('|')
    const firstIdx = exactDupSeen.get(key)
    if (firstIdx !== undefined) {
      ok = false
      ;(errorsByRow.value[i] ??= {}).date = [DUPLICATE_BANNER]
    } else {
      exactDupSeen.set(key, i)
    }
  })

  // cross-row: same employee+date with different project (only flag rows that aren't already exact-dup flagged)
  const seen = new Map<string, { idx: number; project: string }>()
  drafts.rows.forEach((row, i) => {
    if (!row.employee_id || !row.date || !row.project_id) return
    if (errorsByRow.value[i]?.date?.includes(DUPLICATE_BANNER)) return
    const key = row.employee_id + '|' + row.date
    const existing = seen.get(key)
    if (existing && existing.project !== row.project_id) {
      ok = false
      ;(errorsByRow.value[i] ??= {}).project_id = ['An employee can only be assigned to one project per date.']
    } else {
      seen.set(key, { idx: i, project: row.project_id })
    }
  })

  return ok
}

async function submit() {
  banner.value = null
  if (!localValidate()) {
    banner.value = hasDuplicateError(errorsByRow.value)
      ? DUPLICATE_BANNER
      : 'Fix highlighted issues and try again.'
    return
  }
  try {
    await api.post('/time-entries/batch', { entries: drafts.rows })
    drafts.clear()
    drafts.addRow()
    banner.value = 'Saved!'
  } catch (e) {
    const errs = fieldErrors(e)
    const grouped: Record<number, Record<string, string[]>> = {}
    let firstServerMessage: string | null = null
    for (const [k, v] of Object.entries(errs)) {
      const m = k.match(/^entries\.(\d+)\.(.+)$/)
      if (m) {
        const idx = Number(m[1])
        ;(grouped[idx] ??= {})[m[2]] = v
      }
      if (!firstServerMessage && v.length > 0) firstServerMessage = v[0]
    }
    errorsByRow.value = grouped
    banner.value = firstServerMessage ?? 'Server rejected one or more rows.'
  }
}

useKeyboardShortcuts([
  { combo: 'ctrl+enter', handler: submit },
  { combo: 'cmd+enter', handler: submit },
])

defineExpose({ submit, localValidate, errorsByRow, banner })
</script>

<template>
  <div class="space-y-4">
    <!-- Validation summary alert -->
    <div
      v-if="banner && totalErrors > 0"
      role="alert"
      data-test="banner"
      class="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive flex gap-2 items-start"
    >
      <AlertCircle class="size-4 mt-0.5 shrink-0" />
      <span>{{ banner }}</span>
    </div>

    <!-- Success / info banner (no errors) -->
    <div
      v-else-if="banner"
      role="status"
      data-test="banner"
      class="rounded-md border border-green-600/50 bg-green-50 p-3 text-sm text-green-700 flex gap-2 items-start"
    >
      <CheckCircle2 class="size-4 mt-0.5 shrink-0" />
      <span>{{ banner }}</span>
    </div>

    <!-- Entry cards stack -->
    <div class="space-y-3">
      <EntryRow
        v-for="(row, i) in drafts.rows"
        :key="row._id"
        :draft="row"
        :row-errors="errorsByRow[i] ?? {}"
        :seq="i + 1"
        @update:draft="(v) => (drafts.rows[i] = v)"
        @duplicate="drafts.duplicate(i)"
        @remove="drafts.remove(i)"
      />
    </div>

    <!-- Footer -->
    <div class="border border-border rounded-lg px-4 py-3 bg-card">
      <EntryFooter @add-row="drafts.addRow()" @submit="submit" />
    </div>
  </div>
</template>
