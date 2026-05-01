import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

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
import { useCompanyContextStore } from '@/stores/companyContext'
import HistoryTab from '@/components/HistoryTab.vue'

const mockGet = vi.mocked(api.get)

const globalStubs = {
  HistoryFilters: { template: '<div data-test="history-filters-stub" />' },
  HistoryTable: { template: '<div data-test="history-table-stub" />' },
  HistorySummary: { template: '<div data-test="history-summary-stub" />' },
}

function mockLoadResponse() {
  mockGet.mockResolvedValue({
    data: {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    },
  } as never)
}

describe('HistoryTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads history on mount', async () => {
    mockLoadResponse()
    mount(HistoryTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))
    expect(mockGet).toHaveBeenCalledWith('/time-entries', expect.any(Object))
  })

  it('renders sub-components', () => {
    mockLoadResponse()
    const wrapper = mount(HistoryTab, { global: { stubs: globalStubs } })
    expect(wrapper.find('[data-test="history-filters-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="history-table-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="history-summary-stub"]').exists()).toBe(true)
  })

  it('reloads when companyId changes in context store', async () => {
    mockLoadResponse()
    mount(HistoryTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))
    vi.clearAllMocks()
    mockLoadResponse()

    const ctx = useCompanyContextStore()
    ctx.companyId = 'c1'
    await new Promise((r) => setTimeout(r, 10))

    expect(mockGet).toHaveBeenCalledWith('/time-entries', expect.objectContaining({
      params: expect.objectContaining({ company_id: 'c1' }),
    }))
  })

  it('sets company_id filter to undefined when companyId is all', async () => {
    mockLoadResponse()
    const ctx = useCompanyContextStore()
    ctx.companyId = 'c1'
    mount(HistoryTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))
    vi.clearAllMocks()
    mockLoadResponse()

    ctx.companyId = 'all'
    await new Promise((r) => setTimeout(r, 10))

    const history = useHistoryStore()
    expect(history.filters.company_id).toBeUndefined()
  })
})
