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
const mockDelete = vi.mocked(api.delete)

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

  it('opens delete confirm dialog', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(false)
    await wrapper.find('[data-test="delete-btn"]').trigger('click')
    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(true)
  })

  it('cancels delete dialog', async () => {
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="delete-btn"]').trigger('click')
    await wrapper.find('[data-test="delete-cancel"]').trigger('click')
    expect(wrapper.find('[data-test="delete-dialog"]').exists()).toBe(false)
  })

  it('calls DELETE on confirm delete', async () => {
    mockDelete.mockResolvedValueOnce({} as never)
    mockLoadResponse([])
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="delete-btn"]').trigger('click')
    await wrapper.find('[data-test="delete-confirm"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(mockDelete).toHaveBeenCalledWith('/time-entries/te-1')
  })

  it('shows error when DELETE fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Network error'))
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="delete-btn"]').trigger('click')
    await wrapper.find('[data-test="delete-confirm"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(wrapper.find('[data-test="action-error"]').text()).toContain('Failed to delete entry.')
  })

  it('startEdit uses empty string when notes is null', async () => {
    const history = useHistoryStore()
    history.items = [{ ...sampleItem, notes: null }]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    // Edit dialog shows with empty notes input
    const notesInput = wrapper.find('[data-test="edit-notes"]')
    expect((notesInput.element as HTMLInputElement).value).toBe('')
  })

  it('setSort uses -date default when sort filter is undefined', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    history.filters.sort = undefined // explicitly undefined — triggers ?? '-date'
    const wrapper = mount(HistoryTable)

    const th = wrapper.findAll('th').find((el) => el.text() === 'Date')
    await th!.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    // current was undefined ?? '-date' = '-date', which !== 'date', so sort = 'date'
    expect(history.filters.sort).toBe('date')
  })

  it('sorts by hours column when clicked', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    const wrapper = mount(HistoryTable)

    const th = wrapper.findAll('th').find((el) => el.text() === 'Hours')
    await th!.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('hours')
  })

  it('sorts ascending on first click of date column', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    const wrapper = mount(HistoryTable)

    const th = wrapper.findAll('th').find((el) => el.text() === 'Date')
    await th!.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('date')
  })

  it('sorts descending on second click of date column', async () => {
    mockLoadResponse()
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 2, per_page: 25, total: 30 }
    history.filters.sort = 'date' // already sorted asc
    const wrapper = mount(HistoryTable)

    const th = wrapper.findAll('th').find((el) => el.text() === 'Date')
    await th!.trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.sort).toBe('-date')
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

    // defineExpose unwraps refs — vm.editItem is already the value (null), not a ref
    const vm = wrapper.vm as unknown as {
      saveEdit: () => Promise<void>
      editItem: null
    }
    expect(vm.editItem).toBeNull()
    await vm.saveEdit()
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('doDelete guard: returns early when deleteId is null', async () => {
    const history = useHistoryStore()
    history.items = []
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 0 }
    const wrapper = mount(HistoryTable)

    const vm = wrapper.vm as unknown as {
      doDelete: () => Promise<void>
      deleteId: null
    }
    expect(vm.deleteId).toBeNull()
    await vm.doDelete()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('notes field is set to null when editNotes is empty on save', async () => {
    mockPatch.mockResolvedValueOnce({} as never)
    mockLoadResponse([])
    const history = useHistoryStore()
    history.items = [sampleItem]
    history.meta = { current_page: 1, last_page: 1, per_page: 25, total: 1 }
    const wrapper = mount(HistoryTable)

    await wrapper.find('[data-test="edit-btn"]').trigger('click')
    // Clear the notes field
    const notesInput = wrapper.find('[data-test="edit-notes"]')
    await notesInput.setValue('')
    await wrapper.find('[data-test="edit-save"]').trigger('click')
    await new Promise((r) => setTimeout(r, 20))

    expect(mockPatch).toHaveBeenCalledWith('/time-entries/te-1', expect.objectContaining({ notes: null }))
  })
})
