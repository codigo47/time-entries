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
import HistorySummary from '@/components/HistorySummary.vue'

const mockGet = vi.mocked(api.get)

describe('HistorySummary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls loadSummary on mount with default groupBy=company', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    expect(mockGet).toHaveBeenCalledWith('/time-entries/summary', expect.objectContaining({
      params: expect.objectContaining({ group_by: 'company' }),
    }))
  })

  it('shows empty message when no summary data', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    expect(wrapper.find('[data-test="summary-empty"]').exists()).toBe(true)
  })

  it('renders summary rows when data is available and displays group_label', async () => {
    const history = useHistoryStore()
    mockGet.mockResolvedValueOnce({ data: { data: [
      { group_key: '01919b3d-0000-0000-0000-000000000001', group_label: 'Athena Pallas', total_hours: 40, entry_count: 5 },
    ] } } as never)

    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    // Seed store manually for rendering
    history.summary = [{ group_key: '01919b3d-0000-0000-0000-000000000001', group_label: 'Athena Pallas', total_hours: 40, entry_count: 5 }]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="summary-empty"]').exists()).toBe(false)
    const rows = wrapper.findAll('[data-test="summary-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('Athena Pallas')
    expect(rows[0].text()).not.toContain('01919b3d-0000-0000-0000-000000000001')
    expect(rows[0].text()).toContain('40.00')
    expect(rows[0].text()).toContain('5')
  })

  it('falls back to group_key when group_label is absent (non-date groupBy)', async () => {
    const history = useHistoryStore()
    mockGet.mockResolvedValueOnce({ data: { data: [
      { group_key: '2026-05-01', total_hours: 8, entry_count: 1 },
    ] } } as never)

    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    history.summary = [{ group_key: '2026-05-01', total_hours: 8, entry_count: 1 }]
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('[data-test="summary-row"]')
    expect(rows.length).toBe(1)
    // groupBy defaults to 'company' so no date formatting — shows raw key
    expect(rows[0].text()).toContain('2026-05-01')
  })

  it('formats dates as mm/dd/yyyy when groupBy is date', async () => {
    const history = useHistoryStore()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)

    // Switch groupBy to date
    const select = wrapper.find('[data-test="group-by-select"]')
    await select.setValue('date')
    await new Promise((r) => setTimeout(r, 10))

    history.summary = [{ group_key: '2026-05-01', group_label: '2026-05-01', total_hours: 8, entry_count: 1 }]
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('[data-test="summary-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('05/01/2026')
  })

  it('formats group_key as date when groupBy is date and group_label is absent', async () => {
    const history = useHistoryStore()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)

    // Switch groupBy to date
    const select = wrapper.find('[data-test="group-by-select"]')
    await select.setValue('date')
    await new Promise((r) => setTimeout(r, 10))

    // No group_label — falls back to group_key which is also a date string
    history.summary = [{ group_key: '2026-12-25', total_hours: 4, entry_count: 1 }]
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('[data-test="summary-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0].text()).toContain('12/25/2026')
  })

  it('reloads summary when groupBy changes', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
    const wrapper = mount(HistorySummary)
    await new Promise((r) => setTimeout(r, 10))
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)

    const select = wrapper.find('[data-test="group-by-select"]')
    await select.setValue('employee')
    await new Promise((r) => setTimeout(r, 10))

    expect(mockGet).toHaveBeenCalledWith('/time-entries/summary', expect.objectContaining({
      params: expect.objectContaining({ group_by: 'employee' }),
    }))
  })

  it('group-by select has all expected options', () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    const wrapper = mount(HistorySummary)
    const options = wrapper.findAll('[data-test="group-by-select"] option')
    const values = options.map((o) => (o.element as HTMLOptionElement).value)
    expect(values).toContain('company')
    expect(values).toContain('employee')
    expect(values).toContain('project')
    expect(values).toContain('task')
    expect(values).toContain('date')
  })
})
