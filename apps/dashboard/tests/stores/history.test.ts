import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  fieldErrors: vi.fn(),
}))

import { api } from '@/services/api'
import { useHistoryStore } from '@/stores/history'

const mockGet = vi.mocked(api.get)

describe('history store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useHistoryStore()
    expect(store.items).toEqual([])
    expect(store.meta.current_page).toBe(1)
    expect(store.meta.last_page).toBe(1)
    expect(store.meta.per_page).toBe(10)
    expect(store.meta.total).toBe(0)
    expect(store.summary).toEqual([])
  })

  it('has default filters', () => {
    const store = useHistoryStore()
    expect(store.filters.per_page).toBe(10)
    expect(store.filters.sort).toBe('-date')
  })

  it('load fetches time entries with current filters', async () => {
    const store = useHistoryStore()
    const mockItems = [{ id: 'te1', company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-01-01', hours: 8, notes: null }]
    const mockMeta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    mockGet.mockResolvedValueOnce({ data: { data: mockItems, meta: mockMeta } } as never)

    await store.load()

    expect(mockGet).toHaveBeenCalledWith('/time-entries', { params: store.filters })
    expect(store.items).toEqual(mockItems)
    expect(store.meta).toEqual(mockMeta)
  })

  it('load uses updated filters', async () => {
    const store = useHistoryStore()
    store.filters.company_id = 'c1'
    store.filters.employee_id = 'e1'
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)

    await store.load()

    expect(mockGet).toHaveBeenCalledWith('/time-entries', {
      params: expect.objectContaining({ company_id: 'c1', employee_id: 'e1' }),
    })
  })

  it('loadSummary fetches summary with groupBy param', async () => {
    const store = useHistoryStore()
    const mockSummary = [{ group_key: 'Acme', total_hours: 40, entry_count: 5 }]
    mockGet.mockResolvedValueOnce({ data: { data: mockSummary } } as never)

    await store.loadSummary('company')

    expect(mockGet).toHaveBeenCalledWith('/time-entries/summary', {
      params: expect.objectContaining({ group_by: 'company' }),
    })
    expect(store.summary).toEqual(mockSummary)
  })

  it('loadSummary merges current filters into the request params', async () => {
    const store = useHistoryStore()
    store.filters.company_id = 'c1'
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)

    await store.loadSummary('employee')

    expect(mockGet).toHaveBeenCalledWith('/time-entries/summary', {
      params: expect.objectContaining({ company_id: 'c1', group_by: 'employee' }),
    })
  })
})
