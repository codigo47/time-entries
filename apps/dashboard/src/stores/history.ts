import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { PaginatedResponse, SummaryRow, TimeEntryDto } from '@shared/types'

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
  const meta = ref({ current_page: 1, last_page: 1, per_page: 10, total: 0 })
  const filters = ref<Filters>({ per_page: 10, sort: '-date' })
  const summary = ref<SummaryRow[]>([])

  function buildParams(extra: Record<string, unknown> = {}): Record<string, unknown> {
    const f = filters.value
    const params: Record<string, unknown> = { ...extra }
    if (f.per_page !== undefined) params.per_page = f.per_page
    if (f.page !== undefined) params.page = f.page
    if (f.sort !== undefined) params.sort = f.sort
    if (f.company_id) params['filter[company_id]'] = f.company_id
    if (f.employee_id) params['filter[employee_id]'] = f.employee_id
    if (f.project_id) params['filter[project_id]'] = f.project_id
    if (f.task_id) params['filter[task_id]'] = f.task_id
    if (f.date_from) params['filter[date_from]'] = f.date_from
    if (f.date_to) params['filter[date_to]'] = f.date_to
    return params
  }

  async function load() {
    const { data } = await api.get<PaginatedResponse<TimeEntryDto>>('/time-entries', { params: buildParams() })
    items.value = data.data
    meta.value = data.meta
  }

  async function loadSummary(groupBy: string) {
    const { data } = await api.get('/time-entries/summary', { params: buildParams({ group_by: groupBy }) })
    summary.value = data.data
  }

  return { items, meta, filters, summary, load, loadSummary }
})
