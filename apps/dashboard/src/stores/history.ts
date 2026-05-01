import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { PaginatedResponse, TimeEntryDto } from '@shared/types'

interface Filters {
  company_id?: string
  employee_id?: string
  project_id?: string
  task_id?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
  sort?: string
}

export const useHistoryStore = defineStore('history', () => {
  const items = ref<TimeEntryDto[]>([])
  const meta = ref({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
  const filters = ref<Filters>({ per_page: 25, sort: '-date' })
  const summary = ref<Array<{ group_key: string; total_hours: number; entry_count: number }>>([])

  async function load() {
    const { data } = await api.get<PaginatedResponse<TimeEntryDto>>('/time-entries', { params: filters.value })
    items.value = data.data
    meta.value = data.meta
  }

  async function loadSummary(groupBy: string) {
    const { data } = await api.get('/time-entries/summary', { params: { ...filters.value, group_by: groupBy } })
    summary.value = data.data
  }

  return { items, meta, filters, summary, load, loadSummary }
})
