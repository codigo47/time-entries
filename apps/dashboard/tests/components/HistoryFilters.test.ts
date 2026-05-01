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
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import HistoryFilters from '@/components/HistoryFilters.vue'

const mockGet = vi.mocked(api.get)

describe('HistoryFilters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders filter inputs', () => {
    const wrapper = mount(HistoryFilters)
    expect(wrapper.find('[data-test="filter-date-from"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-date-to"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-employee"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-project"]').exists()).toBe(true)
  })

  it('updates date_from filter and calls load on change', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    const wrapper = mount(HistoryFilters)

    const input = wrapper.find('[data-test="filter-date-from"]')
    await input.setValue('2026-05-01')
    // trigger change event
    await input.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.date_from).toBe('2026-05-01')
    expect(mockGet).toHaveBeenCalledWith('/time-entries', expect.any(Object))
  })

  it('updates date_to filter and calls load on change', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    const wrapper = mount(HistoryFilters)

    const input = wrapper.find('[data-test="filter-date-to"]')
    await input.setValue('2026-05-31')
    await input.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.date_to).toBe('2026-05-31')
  })

  it('shows pre-set date values in inputs', () => {
    const history = useHistoryStore()
    history.filters.date_from = '2026-01-01'
    history.filters.date_to = '2026-12-31'
    const wrapper = mount(HistoryFilters)
    const fromInput = wrapper.find('[data-test="filter-date-from"]').element as HTMLInputElement
    const toInput = wrapper.find('[data-test="filter-date-to"]').element as HTMLInputElement
    expect(fromInput.value).toBe('2026-01-01')
    expect(toInput.value).toBe('2026-12-31')
  })

  it('clears date_to when empty string entered', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    history.filters.date_to = '2026-05-31'
    const wrapper = mount(HistoryFilters)

    const input = wrapper.find('[data-test="filter-date-to"]')
    ;(input.element as HTMLInputElement).value = ''
    await input.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.date_to).toBeUndefined()
  })

  it('clears date_from when empty string entered', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    history.filters.date_from = '2026-05-01'
    const wrapper = mount(HistoryFilters)

    const input = wrapper.find('[data-test="filter-date-from"]')
    // Set empty value and trigger change
    ;(input.element as HTMLInputElement).value = ''
    await input.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.date_from).toBeUndefined()
  })

  it('shows employees from lookups when company is set in filters', () => {
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    history.filters.company_id = 'c1'
    lookups.employeesByCompany = { c1: [{ id: 'e1', name: 'Alice', email: 'a@test.com' }] }

    const wrapper = mount(HistoryFilters)
    expect(wrapper.find('[data-test="filter-employee"]').text()).toContain('Alice')
  })

  it('updates employee filter and calls load', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    history.filters.company_id = 'c1'
    lookups.employeesByCompany = { c1: [{ id: 'e1', name: 'Alice', email: 'a@test.com' }] }

    const wrapper = mount(HistoryFilters)
    const select = wrapper.find('[data-test="filter-employee"]')
    await select.setValue('e1')
    await select.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.employee_id).toBe('e1')
    expect(mockGet).toHaveBeenCalled()
  })

  it('clears employee filter when empty value selected', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    history.filters.employee_id = 'e1'
    history.filters.company_id = 'c1'

    const wrapper = mount(HistoryFilters)
    const select = wrapper.find('[data-test="filter-employee"]')
    ;(select.element as HTMLSelectElement).value = ''
    await select.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.employee_id).toBeUndefined()
  })

  it('updates project filter and calls load', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    history.filters.company_id = 'c1'
    lookups.projectsByCompany = { c1: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] }

    const wrapper = mount(HistoryFilters)
    const select = wrapper.find('[data-test="filter-project"]')
    await select.setValue('p1')
    await select.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.project_id).toBe('p1')
  })

  it('uses ctx.companyId for employees when filter.company_id is unset and ctx is not all', () => {
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    const ctx = useCompanyContextStore()
    // No company_id filter set
    history.filters.company_id = undefined
    ctx.companyId = 'c1'
    lookups.employeesByCompany = { c1: [{ id: 'e1', name: 'Bob', email: 'b@test.com' }] }

    const wrapper = mount(HistoryFilters)
    expect(wrapper.find('[data-test="filter-employee"]').text()).toContain('Bob')
  })

  it('returns empty employee list when ctx.companyId is all and filter.company_id is unset', () => {
    const history = useHistoryStore()
    const ctx = useCompanyContextStore()
    history.filters.company_id = undefined
    ctx.companyId = 'all'

    const wrapper = mount(HistoryFilters)
    // Should show only the "All employees" option
    const options = wrapper.find('[data-test="filter-employee"]').findAll('option')
    expect(options.length).toBe(1)
    expect(options[0].text()).toBe('All employees')
  })

  it('uses ctx.companyId for projects when filter.company_id is unset and ctx is not all', () => {
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    const ctx = useCompanyContextStore()
    history.filters.company_id = undefined
    ctx.companyId = 'c2'
    lookups.projectsByCompany = { c2: [{ id: 'p2', company_id: 'c2', name: 'Beta' }] }

    const wrapper = mount(HistoryFilters)
    expect(wrapper.find('[data-test="filter-project"]').text()).toContain('Beta')
  })

  it('returns empty project list when ctx.companyId is all and filter.company_id is unset', () => {
    const history = useHistoryStore()
    const ctx = useCompanyContextStore()
    history.filters.company_id = undefined
    ctx.companyId = 'all'

    const wrapper = mount(HistoryFilters)
    const options = wrapper.find('[data-test="filter-project"]').findAll('option')
    expect(options.length).toBe(1)
    expect(options[0].text()).toBe('All projects')
  })

  it('returns empty employee list when company has no employees in lookups', () => {
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    history.filters.company_id = 'c-unknown'
    lookups.employeesByCompany = {} // no entry for c-unknown

    const wrapper = mount(HistoryFilters)
    const options = wrapper.find('[data-test="filter-employee"]').findAll('option')
    expect(options.length).toBe(1)
  })

  it('returns empty project list when company has no projects in lookups', () => {
    const history = useHistoryStore()
    const lookups = useLookupsStore()
    history.filters.company_id = 'c-unknown'
    lookups.projectsByCompany = {} // no entry for c-unknown

    const wrapper = mount(HistoryFilters)
    const options = wrapper.find('[data-test="filter-project"]').findAll('option')
    expect(options.length).toBe(1)
  })

  it('clears project filter when empty value selected', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const history = useHistoryStore()
    history.filters.project_id = 'p1'
    history.filters.company_id = 'c1'

    const wrapper = mount(HistoryFilters)
    const select = wrapper.find('[data-test="filter-project"]')
    ;(select.element as HTMLSelectElement).value = ''
    await select.trigger('change')
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.project_id).toBeUndefined()
  })
})
