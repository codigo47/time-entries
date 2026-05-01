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
  fieldErrors: vi.fn(() => ({})),
}))

import { api, fieldErrors } from '@/services/api'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import { useCompanyContextStore } from '@/stores/companyContext'
import NewEntriesTab from '@/components/NewEntriesTab.vue'

const mockPost = vi.mocked(api.post)
const mockGet = vi.mocked(api.get)
const mockFieldErrors = vi.mocked(fieldErrors)

const globalStubs = {
  AiAssistInput: { template: '<div data-test="ai-assist-stub" />' },
  EntryRow: {
    props: ['draft', 'rowErrors'],
    emits: ['update:draft', 'duplicate', 'remove'],
    template: '<div data-test="entry-row-stub">{{ draft._id }}</div>',
  },
  EntryFooter: {
    emits: ['add-row', 'submit'],
    template: '<div data-test="entry-footer-stub"><button data-test="add-row" @click="$emit(\'add-row\')">Add</button><button data-test="submit" @click="$emit(\'submit\')">Submit</button></div>',
  },
}

describe('NewEntriesTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
  })

  it('adds a row on mount if none exist', async () => {
    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))
    const drafts = useDraftEntriesStore()
    expect(drafts.rows.length).toBeGreaterThan(0)
  })

  it('does not add a row on mount if rows already exist', async () => {
    const drafts = useDraftEntriesStore()
    drafts.addRow({ _id: 'existing' })
    mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))
    expect(drafts.rows.length).toBe(1)
  })

  it('uses company from context when adding initial row (non-all)', async () => {
    const ctx = useCompanyContextStore()
    ctx.companyId = 'c1'
    mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))
    const drafts = useDraftEntriesStore()
    expect(drafts.rows[0]?.company_id).toBe('c1')
  })

  it('shows validation banner when localValidate fails', async () => {
    const drafts = useDraftEntriesStore()
    drafts.addRow({ _id: 'r1' }) // incomplete row

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="banner"]').text()).toContain('Fix highlighted issues and try again.')
  })

  it('posts batch on submit with valid rows', async () => {
    const drafts = useDraftEntriesStore()
    const validRow = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 8,
      notes: null,
    }
    drafts.rows = [validRow]

    mockPost.mockResolvedValueOnce({ data: {} } as never)

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(mockPost).toHaveBeenCalledWith('/time-entries/batch', expect.objectContaining({ entries: expect.any(Array) }))
    expect(wrapper.find('[data-test="banner"]').text()).toBe('Saved!')
  })

  it('shows server error banner on API failure', async () => {
    const drafts = useDraftEntriesStore()
    const validRow = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 8,
      notes: null,
    }
    drafts.rows = [validRow]

    mockPost.mockRejectedValueOnce(new Error('Server error'))
    mockFieldErrors.mockReturnValueOnce({ 'entries.0.hours': ['Too many hours'] })

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(wrapper.find('[data-test="banner"]').text()).toContain('Server rejected one or more rows.')
  })

  it('detects cross-row conflict: same employee+date, different project', async () => {
    const drafts = useDraftEntriesStore()
    const row1 = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 4,
      notes: null,
    }
    const row2 = {
      _id: 'r2',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '55555555-5555-7555-8555-555555555555', // different project
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 4,
      notes: null,
    }
    drafts.rows = [row1, row2]

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="banner"]').text()).toContain('Fix highlighted issues and try again.')
  })

  it('shows descriptive duplicate banner when two draft rows are identical', async () => {
    const drafts = useDraftEntriesStore()
    const row = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 4,
      notes: null,
    }
    drafts.rows = [row, { ...row, _id: 'r2' }]

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="banner"]').text()).toContain(
      'You cannot create a duplicate time entry with the same company, employee, project, task, and date.',
    )
  })

  it('shows descriptive duplicate banner when server returns "already exists" error', async () => {
    const drafts = useDraftEntriesStore()
    const validRow = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 8,
      notes: null,
    }
    drafts.rows = [validRow]

    mockPost.mockRejectedValueOnce(new Error('Server error'))
    mockFieldErrors.mockReturnValueOnce({
      'entries.0.date': ['An entry already exists for this combination.'],
    })

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 20))

    expect(wrapper.find('[data-test="banner"]').text()).toContain(
      'You cannot create a duplicate time entry with the same company, employee, project, task, and date.',
    )
  })

  it('add-row event from footer adds a row', async () => {
    const drafts = useDraftEntriesStore()
    drafts.addRow()
    expect(drafts.rows.length).toBe(1)

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    const initialCount = drafts.rows.length
    await wrapper.find('[data-test="add-row"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(drafts.rows.length).toBe(initialCount + 1)
  })

  it('ignores server fieldError keys that do not match entries.<idx>.<field>', async () => {
    const drafts = useDraftEntriesStore()
    const validRow = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 8,
      notes: null,
    }
    drafts.rows = [validRow]

    mockPost.mockRejectedValueOnce(new Error('Server error'))
    // Mix of matching and non-matching keys — the non-matching one should be ignored
    mockFieldErrors.mockReturnValueOnce({
      'entries.0.hours': ['Too many hours'],
      'some_other_key': ['Some error'],
    })

    const wrapper = mount(NewEntriesTab, { global: { stubs: globalStubs } })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    // Call submit directly via button click
    await wrapper.find('[data-test="submit"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 20))

    // defineExpose unwraps refs — vm.errorsByRow gives the plain object directly
    const vm = wrapper.vm as unknown as { errorsByRow: Record<number, Record<string, string[]>> }
    expect(vm.errorsByRow[0]?.hours).toEqual(['Too many hours'])
    expect(wrapper.find('[data-test="banner"]').text()).toContain('Server rejected one or more rows.')
  })

  it('update:draft event on EntryRow stub updates the row', async () => {
    const drafts = useDraftEntriesStore()
    const row = {
      _id: 'r1',
      company_id: '11111111-1111-7111-8111-111111111111',
      employee_id: '22222222-2222-7222-8222-222222222222',
      project_id: '33333333-3333-7333-8333-333333333333',
      task_id: '44444444-4444-7444-8444-444444444444',
      date: '2026-05-01',
      hours: 4,
      notes: null,
    }
    drafts.rows = [row]

    // Use a stub that can emit update:draft
    const EmittingEntryRow = {
      props: ['draft', 'rowErrors'],
      emits: ['update:draft', 'duplicate', 'remove'],
      template: `<div>
        <button data-test="update-draft-btn" @click="$emit('update:draft', { ...$props.draft, hours: 6 })">Update</button>
        <button data-test="duplicate-btn" @click="$emit('duplicate')">Dup</button>
        <button data-test="remove-btn" @click="$emit('remove')">Rem</button>
      </div>`,
    }

    const wrapper = mount(NewEntriesTab, {
      global: {
        stubs: {
          ...globalStubs,
          EntryRow: EmittingEntryRow,
        },
      },
    })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="update-draft-btn"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(drafts.rows[0]?.hours).toBe(6)
  })

  it('duplicate event on EntryRow stub duplicates the row', async () => {
    const drafts = useDraftEntriesStore()
    const row = { _id: 'r1', hours: 4, notes: null }
    drafts.rows = [row] as never

    const EmittingEntryRow = {
      props: ['draft', 'rowErrors'],
      emits: ['update:draft', 'duplicate', 'remove'],
      template: `<div><button data-test="duplicate-btn" @click="$emit('duplicate')">Dup</button></div>`,
    }

    const wrapper = mount(NewEntriesTab, {
      global: { stubs: { ...globalStubs, EntryRow: EmittingEntryRow } },
    })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="duplicate-btn"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(drafts.rows.length).toBe(2)
  })

  it('remove event on EntryRow stub removes the row', async () => {
    const drafts = useDraftEntriesStore()
    drafts.rows = [{ _id: 'r1', hours: 4, notes: null }, { _id: 'r2', hours: 2, notes: null }] as never

    const EmittingEntryRow = {
      props: ['draft', 'rowErrors'],
      emits: ['update:draft', 'duplicate', 'remove'],
      template: `<div><button :data-test="'remove-btn-' + draft._id" @click="$emit('remove')">Rem</button></div>`,
    }

    const wrapper = mount(NewEntriesTab, {
      global: { stubs: { ...globalStubs, EntryRow: EmittingEntryRow } },
    })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    await wrapper.find('[data-test="remove-btn-r1"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(drafts.rows.length).toBe(1)
  })
})
