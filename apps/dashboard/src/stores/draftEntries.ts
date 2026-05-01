import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'

const STORAGE_KEY = 'draftEntries'

function load(): TimeEntryDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const useDraftEntriesStore = defineStore('draftEntries', () => {
  const rows = ref<TimeEntryDraft[]>(load())

  watch(rows, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })

  function todayIso(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function addRow(seed: Partial<TimeEntryDraft> = {}) {
    rows.value.push({ _id: crypto.randomUUID(), notes: null, date: todayIso(), ...seed } as TimeEntryDraft)
  }
  function duplicate(index: number) {
    const src = rows.value[index]
    if (!src) return
    rows.value.splice(index + 1, 0, { ...src, _id: crypto.randomUUID() })
  }
  function remove(index: number) { rows.value.splice(index, 1) }
  function clear() { rows.value = [] }

  return { rows, addRow, duplicate, remove, clear }
})
