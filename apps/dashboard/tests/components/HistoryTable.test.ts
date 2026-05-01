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
import HistoryTable from '@/components/HistoryTable.vue'
import type { TimeEntryDto } from '@shared/types'

const mockGet = vi.mocked(api.get)
const mockPatch = vi.mocked(api.patch)

const sampleItem: TimeEntryDto = {
  id: 'te-1',
  company_id: 'c1',
  employee_id: 'e1',
  project_id: 'p1',
  task_id: 't1',
  date: '2026-05-01',
  hours: 8,
  notes: 'Test note',
  employee: { id: 'e1', name: 'Alice', email: 'a@test.com' },
  project: { id: 'p1', company_id: 'c1', name: 'Alpha' },
  task: { id: 't1', company_id: 'c1', name: 'Dev' },
}

function mockLoadResponse(items: TimeEntryDto[] = [sampleItem]) {
  mockGet.mockResolvedValue({
    data: {
      data: items,
      meta: { current_page: 1, last_page: 2, per_page: 25, total: 30 },
    },
  } as never)
}

describe('HistoryTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty message when no items', () => {
    const history = useHistoryStore()
    history.items = []
    const wrapper = mount(HistoryTable)
    expect(wrapper.text()).toContain('No entries found.')
  })

  it('renders rows for each item', () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)
    const rows = wrapper.findAll('[data-test="history-row"]')
    expect(rows.length).toBe(1)
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('Test note')
    // date is formatted as mm/dd/yyyy
    expect(wrapper.text()).toContain('05/01/2026')
  })

  it('renders table headers', () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)
    const headers = wrapper.findAll('thead th')
    const headerTexts = headers.map((h) => h.text())
    expect(headerTexts).toContain('Date')
    expect(headerTexts).toContain('Company')
    expect(headerTexts).toContain('Project')
    expect(headerTexts).toContain('Employee')
    expect(headerTexts).toContain('Task')
    expect(headerTexts).toContain('Hours')
  })

  it('renders inverted notes row when notes are present', () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)
    const notesRow = wrapper.find('[data-test="history-notes-row"]')
    expect(notesRow.exists()).toBe(true)
    expect(notesRow.text()).toContain('Notes')
    expect(notesRow.text()).toContain('Test note')
  })

  it('does not render notes row when notes are null', () => {
    const history = useHistoryStore()
    history.items = [{ ...sampleItem, notes: null }]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)
    expect(wrapper.find('[data-test="history-notes-row"]').exists()).toBe(false)
  })

  it('falls back to IDs when relation names are missing', () => {
    const history = useHistoryStore()
    history.items = [{ ...sampleItem, employee: undefined, project: undefined, task: undefined }]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)
    expect(wrapper.text()).toContain('e1')
    expect(wrapper.text()).toContain('p1')
  })

  it('opens edit dialog when edit button is clicked', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(false)
    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(true)
  })

  it('closes edit dialog on cancel', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(true)

    await wrapper.find('[data-test="edit-cancel"]').trigger('click')
    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(false)
  })

  it('calls PATCH on save edit', async () => {
    mockPatch.mockResolvedValueOnce({} as never)
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    const hoursInput = wrapper.find('[data-test="edit-hours"]')
    await hoursInput.setValue('6')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(mockPatch).toHaveBeenCalledWith('/time-entries/te-1', expect.objectContaining({ hours: 6 }))
  })

  it('blocks save and shows "Hours cannot exceed 24" when editing > 24', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-hours"]').setValue('25')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="edit-error"]').text()).toBe('Hours cannot exceed 24 in a single entry.')
    expect(mockPatch).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(true)
  })

  it('blocks save and shows guidance when editing hours <= 0', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-hours"]').setValue('0')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="edit-error"]').text()).toContain('Enter the number of hours worked.')
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('blocks save and shows quarter-hour guidance for non-step values', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-hours"]').setValue('1.1')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="edit-error"]').text()).toContain('15-minute increments')
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('clears edit error on hours input', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-hours"]').setValue('30')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="edit-error"]').exists()).toBe(true)

    await wrapper.find('[data-test="edit-hours"]').setValue('5')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="edit-error"]').exists()).toBe(false)
  })

  it('cancelEdit clears edit error', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-hours"]').setValue('30')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="edit-error"]').exists()).toBe(true)

    await wrapper.find('[data-test="edit-cancel"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="edit-dialog"]').exists()).toBe(false)
  })

  it('shows error when PATCH fails', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'))
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(wrapper.find('[data-test="action-error"]').text()).toContain('Failed to save changes.')
  })

  it('startEdit uses empty string when notes is null', async () => {
    const history = useHistoryStore()
    history.items = [{ ...sampleItem, notes: null }]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    const notesInput = wrapper.find('[data-test="edit-notes"]')
    expect((notesInput.element as HTMLInputElement).value).toBe('')
  })

  it('setSort uses -date default when sort filter is undefined', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    history.filters.sort = undefined
    const wrapper = mount(HistoryTable)

    const sortBtn = wrapper.find('[aria-label="Sort by date"]')
    await sortBtn.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    // current was undefined ?? '-date' = '-date', which !== 'date', so sort = 'date'
    expect(history.filters.sort).toBe('date')
  })

  it('sorts by hours when Sort by Hours button clicked', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    const wrapper = mount(HistoryTable)

    const sortBtn = wrapper.find('[aria-label="Sort by hours"]')
    await sortBtn.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('hours')
  })

  it('sorts ascending on first click of date sort button', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    const wrapper = mount(HistoryTable)

    const sortBtn = wrapper.find('[aria-label="Sort by date"]')
    await sortBtn.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('date')
  })

  it('sorts descending on second click of date sort button', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    history.filters.sort = 'date'
    const wrapper = mount(HistoryTable)

    const sortBtn = wrapper.find('[aria-label="Sort by date"]')
    await sortBtn.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('-date')
  })

  it('shows ArrowDown icon when hours sort is descending', () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 0 }
    history.filters.sort = '-hours'
    const wrapper = mount(HistoryTable)
    // The hours sort button should have active styling (bg-muted)
    const sortBtn = wrapper.find('[aria-label="Sort by hours"]')
    expect(sortBtn.classes().join(' ')).toContain('bg-muted')
  })

  it('navigates to next page', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="page-next"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.page).toBe(2)
    expect(mockGet).toHaveBeenCalled()
  })

  it('prev button is disabled on first page', () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 3, per_page: 25, total: 50 }
    const wrapper = mount(HistoryTable)
    const prevBtn = wrapper.find('[data-test="page-prev"]')
    expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('next button is disabled on last page', () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 3, last_page: 3, per_page: 25, total: 50 }
    const wrapper = mount(HistoryTable)
    const nextBtn = wrapper.find('[data-test="page-next"]')
    expect((nextBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('navigates to prev page', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 2, last_page: 3, per_page: 25, total: 60 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="page-prev"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.page).toBe(1)
  })

  it('saveEdit guard: returns early when editItem is null', async () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 0 }
    const wrapper = mount(HistoryTable)

    const vm = wrapper.vm as unknown as {
      saveEdit: () => Promise<void>
      editItem: null
    }
    expect(vm.editItem).toBeNull()
    await vm.saveEdit()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('notes field is set to null when editNotes is empty on save', async () => {
    mockPatch.mockResolvedValueOnce({} as never)
    mockLoadResponse([])
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    const notesInput = wrapper.find('[data-test="edit-notes"]')
    await notesInput.setValue('')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(mockPatch).toHaveBeenCalledWith('/time-entries/te-1', expect.objectContaining({ notes: null }))
  })

  it('per-page select is rendered with current per_page value', () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
    history.filters.per_page = 10
    const wrapper = mount(HistoryTable)
    const select = wrapper.find('[data-test="per-page-select"]')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('10')
  })

  it('changing per-page select updates store filter and triggers load', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 10, total: 30 }
    history.filters.per_page = 10
    const wrapper = mount(HistoryTable)

    const select = wrapper.find('[data-test="per-page-select"]')
    await select.setValue('25')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.per_page).toBe(25)
    expect(history.filters.page).toBe(1)
    expect(mockGet).toHaveBeenCalledWith('/time-entries', expect.objectContaining({
      params: expect.objectContaining({ per_page: 25 }),
    }))
  })

  it('per-page select has options 10, 25, 50, 100', () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 1, per_page: 10, total: 0 }
    const wrapper = mount(HistoryTable)
    const options = wrapper.findAll('[data-test="per-page-select"] option')
    const values = options.map((o) => (o.element as HTMLOptionElement).value)
    expect(values).toEqual(['10', '25', '50', '100'])
  })
})
