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
import HistoryTab from '@/components/HistoryTab.vue'

const mockGet = vi.mocked(api.get)

const globalStubs = {
  HistoryFilters: { template: '<div data-test="history-filters-stub" />' },
  HistoryTable: { template: '<div data-test="history-table-stub" />' },
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
  })

  it('does not sync companyId from context into history filters', async () => {
    mockLoadResponse()
    mount(HistoryTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))

    const history = useHistoryStore()
    // company_id filter should remain unset — HistoryFilters owns it
    expect(history.filters.company_id).toBeUndefined()
  })
})
