<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { api, fieldErrors } from '@/services/api'
import { timeEntryRowSchema } from '@shared/schemas/timeEntry'
import EntryRow from './EntryRow.vue'
import EntryFooter from './EntryFooter.vue'
import AiAssistInput from './AiAssistInput.vue'

const drafts = useDraftEntriesStore()
const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

const errorsByRow = ref<Record<number, Record<string, string[]>>>({})
const banner = ref<string | null>(null)

onMounted(async () => {
  await lookups.loadCompanies()
  if (drafts.rows.length === 0) {
    drafts.addRow({ company_id: ctx.companyId !== 'all' ? ctx.companyId : undefined })
  }
})

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

  // cross-row: same employee+date with different project
  const seen = new Map<string, { idx: number; project: string }>()
  drafts.rows.forEach((row, i) => {
    if (!row.employee_id || !row.date || !row.project_id) return
    const key = row.employee_id + '|' + row.date
    const existing = seen.get(key)
    if (existing && existing.project !== row.project_id) {
      ok = false
      ;(errorsByRow.value[i] ??= {}).project_id = ['Conflicts with row ' + (existing.idx + 1) + ' (different project on same day).']
    } else {
      seen.set(key, { idx: i, project: row.project_id })
    }
  })

  return ok
}

async function submit() {
  banner.value = null
  if (!localValidate()) {
    banner.value = 'Fix highlighted issues and try again.'
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
    for (const [k, v] of Object.entries(errs)) {
      const m = k.match(/^entries\.(\d+)\.(.+)$/)
      if (m) {
        const idx = Number(m[1])
        ;(grouped[idx] ??= {})[m[2]] = v
      }
    }
    errorsByRow.value = grouped
    banner.value = 'Server rejected one or more rows.'
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
    <AiAssistInput />
    <div v-if="banner" data-test="banner">
      {{ banner }}
    </div>
    <table class="w-full">
      <thead>
        <tr>
          <th>Company</th><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th><th>Notes</th><th></th>
        </tr>
      </thead>
      <tbody>
        <EntryRow
          v-for="(row, i) in drafts.rows" :key="row._id"
          :draft="row" :row-errors="errorsByRow[i] ?? {}"
          @update:draft="(v) => (drafts.rows[i] = v)"
          @duplicate="drafts.duplicate(i)"
          @remove="drafts.remove(i)"
        />
      </tbody>
    </table>
    <EntryFooter @add-row="drafts.addRow()" @submit="submit" />
  </div>
</template>
