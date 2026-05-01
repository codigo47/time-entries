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
import { useLookupsStore } from '@/stores/lookups'
import EntryRow from '@/components/EntryRow.vue'
import type { TimeEntryDraft } from '@shared/schemas/timeEntry'

const mockGet = vi.mocked(api.get)

const baseDraft: TimeEntryDraft = {
  _id: 'row-1',
  company_id: undefined,
  employee_id: undefined,
  project_id: undefined,
  task_id: undefined,
  date: undefined,
  hours: undefined,
  notes: null,
}

describe('EntryRow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders a table row', () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    expect(wrapper.find('[data-test="entry-row"]').exists()).toBe(true)
  })

  it('emits update:draft when company select changes', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]
    mockGet.mockResolvedValue({ data: { data: [] } } as never)

    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    const select = wrapper.find('[data-test="company-select"]')
    await select.setValue('c1')

    const emitted = wrapper.emitted('update:draft')
    expect(emitted).toBeTruthy()
    // first emit is from setValue triggering watcher (company change clears deps)
    // check that company_id is set in first non-watcher emit
    const firstEmit = (emitted as unknown[][])[0][0] as TimeEntryDraft
    expect(firstEmit.company_id).toBe('c1')
  })

  it('disables employee/project/task selects when no company', () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    expect((wrapper.find('[data-test="employee-select"]').element as HTMLSelectElement).disabled).toBe(true)
    expect((wrapper.find('[data-test="project-select"]').element as HTMLSelectElement).disabled).toBe(true)
    expect((wrapper.find('[data-test="task-select"]').element as HTMLSelectElement).disabled).toBe(true)
  })

  it('emits update:draft when date changes', async () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    const input = wrapper.find('[data-test="date-input"]')
    await input.setValue('2026-05-01')

    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].date).toBe('2026-05-01')
  })

  it('emits update:draft when hours changes', async () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    const input = wrapper.find('[data-test="hours-input"]')
    await input.setValue('8')

    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].hours).toBe(8)
  })

  it('emits update:draft when notes changes', async () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    const input = wrapper.find('[data-test="notes-input"]')
    await input.setValue('some notes')

    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].notes).toBe('some notes')
  })

  it('emits duplicate when duplicate button clicked', async () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    await wrapper.find('[data-test="duplicate-btn"]').trigger('click')
    expect(wrapper.emitted('duplicate')).toBeTruthy()
  })

  it('emits remove when remove button clicked', async () => {
    const wrapper = mount(EntryRow, {
      props: { draft: baseDraft, rowErrors: {} },
    })
    await wrapper.find('[data-test="remove-btn"]').trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('shows error messages for fields', () => {
    const wrapper = mount(EntryRow, {
      props: {
        draft: baseDraft,
        rowErrors: {
          company_id: ['Required'],
          employee_id: ['Required'],
          project_id: ['Required'],
          task_id: ['Required'],
          hours: ['Must be >= 0.25'],
        },
      },
    })
    expect(wrapper.find('[data-test="err-company_id"]').text()).toBe('Required')
    expect(wrapper.find('[data-test="err-employee_id"]').text()).toBe('Required')
    expect(wrapper.find('[data-test="err-project_id"]').text()).toBe('Required')
    expect(wrapper.find('[data-test="err-task_id"]').text()).toBe('Required')
    expect(wrapper.find('[data-test="err-hours"]').text()).toBe('Must be >= 0.25')
  })

  it('shows company employees in select when company_id is set', () => {
    const lookups = useLookupsStore()
    lookups.employeesByCompany = {
      c1: [{ id: 'e1', name: 'Alice', email: 'a@test.com' }],
    }
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, {
      props: { draft, rowErrors: {} },
    })
    expect(wrapper.find('[data-test="employee-select"]').text()).toContain('Alice')
  })

  it('clears employee/project/task when company changes (via setProps)', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
    const draft: TimeEntryDraft = {
      ...baseDraft,
      company_id: 'c1',
      employee_id: 'e1',
      project_id: 'p1',
      task_id: 't1',
    }
    const wrapper = mount(EntryRow, {
      props: { draft, rowErrors: {} },
    })
    // Update the prop to a new company — this triggers the watcher
    await wrapper.setProps({
      draft: { ...draft, company_id: 'c2' },
    })
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 30))

    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted).toBeTruthy()
    // The watcher fires after company change, clearing deps
    const clearEmit = emitted.find((e) => e[0].employee_id === undefined && e[0].project_id === undefined && e[0].task_id === undefined)
    expect(clearEmit).toBeTruthy()
  })

  it('shows projects and tasks from lookups when company_id is set', () => {
    const lookups = useLookupsStore()
    lookups.projectsByCompany = { c1: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] }
    lookups.tasksByCompany = { c1: [{ id: 't1', company_id: 'c1', name: 'Dev' }] }
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    expect(wrapper.find('[data-test="project-select"]').text()).toContain('Alpha')
    expect(wrapper.find('[data-test="task-select"]').text()).toContain('Dev')
  })

  it('returns empty lists when company_id is set but not in lookups', () => {
    const lookups = useLookupsStore()
    lookups.employeesByCompany = {}
    lookups.projectsByCompany = {}
    lookups.tasksByCompany = {}
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c-unknown' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    // Only the default "Select…" option
    expect(wrapper.find('[data-test="employee-select"]').findAll('option')).toHaveLength(1)
    expect(wrapper.find('[data-test="project-select"]').findAll('option')).toHaveLength(1)
    expect(wrapper.find('[data-test="task-select"]').findAll('option')).toHaveLength(1)
  })

  it('emits update:draft when employee select changes', async () => {
    const lookups = useLookupsStore()
    lookups.employeesByCompany = { c1: [{ id: 'e1', name: 'Alice', email: 'a@test.com' }] }
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    await wrapper.find('[data-test="employee-select"]').setValue('e1')
    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted[0][0].employee_id).toBe('e1')
  })

  it('emits update:draft when project select changes', async () => {
    const lookups = useLookupsStore()
    lookups.projectsByCompany = { c1: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] }
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    await wrapper.find('[data-test="project-select"]').setValue('p1')
    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted[0][0].project_id).toBe('p1')
  })

  it('emits update:draft when task select changes', async () => {
    const lookups = useLookupsStore()
    lookups.tasksByCompany = { c1: [{ id: 't1', company_id: 'c1', name: 'Dev' }] }
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    await wrapper.find('[data-test="task-select"]').setValue('t1')
    const emitted = wrapper.emitted('update:draft') as TimeEntryDraft[][]
    expect(emitted[0][0].task_id).toBe('t1')
  })

  it('watcher skips loading when company_id changes to falsy', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
    // Start with a company_id set, then change to undefined — triggers watcher with falsy id
    const draft: TimeEntryDraft = { ...baseDraft, company_id: 'c1' }
    const wrapper = mount(EntryRow, { props: { draft, rowErrors: {} } })
    // First change fires watcher with 'c1' (truthy) — loads data
    await new Promise((r) => setTimeout(r, 20))
    vi.clearAllMocks()

    // Now change company_id to undefined — watcher fires with undefined (falsy) → early return
    await wrapper.setProps({ draft: { ...baseDraft, company_id: undefined } })
    await new Promise((r) => setTimeout(r, 20))
    // No API calls after clearing mocks — the if(!id) return path was taken
    expect(mockGet).not.toHaveBeenCalled()
  })
})
