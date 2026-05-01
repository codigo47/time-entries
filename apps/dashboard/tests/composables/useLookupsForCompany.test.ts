import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

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
import { useLookupsForCompany } from '@/composables/useLookupsForCompany'

const mockGet = vi.mocked(api.get)

describe('useLookupsForCompany', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('returns empty arrays when companyId is undefined', () => {
    const { employees, projects, tasks } = useLookupsForCompany(() => undefined)
    expect(employees.value).toEqual([])
    expect(projects.value).toEqual([])
    expect(tasks.value).toEqual([])
  })

  it('returns slices from store for the given companyId', async () => {
    const store = useLookupsStore()
    store.employeesByCompany['c1'] = [{ id: 'e1', name: 'Alice', email: 'a@b.com' }]
    store.projectsByCompany['c1'] = [{ id: 'p1', company_id: 'c1', name: 'Alpha' }]
    store.tasksByCompany['c1'] = [{ id: 't1', company_id: 'c1', name: 'Dev' }]

    const { employees, projects, tasks } = useLookupsForCompany(() => 'c1')
    expect(employees.value).toEqual([{ id: 'e1', name: 'Alice', email: 'a@b.com' }])
    expect(projects.value).toEqual([{ id: 'p1', company_id: 'c1', name: 'Alpha' }])
    expect(tasks.value).toEqual([{ id: 't1', company_id: 'c1', name: 'Dev' }])
  })

  it('is reactive to companyId changes', async () => {
    const store = useLookupsStore()
    store.employeesByCompany['c1'] = [{ id: 'e1', name: 'Alice', email: 'a@b.com' }]
    store.employeesByCompany['c2'] = [{ id: 'e2', name: 'Bob', email: 'b@b.com' }]

    const id = ref<string | undefined>('c1')
    const { employees } = useLookupsForCompany(() => id.value)
    expect(employees.value[0].name).toBe('Alice')

    id.value = 'c2'
    expect(employees.value[0].name).toBe('Bob')
  })

  it('ensure calls all three loaders for the given companyId', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { data: [] } } as never)
      .mockResolvedValueOnce({ data: { data: [] } } as never)
      .mockResolvedValueOnce({ data: { data: [] } } as never)

    const { ensure } = useLookupsForCompany(() => 'c1')
    await ensure()

    expect(mockGet).toHaveBeenCalledTimes(3)
    expect(mockGet).toHaveBeenCalledWith('/companies/c1/employees')
    expect(mockGet).toHaveBeenCalledWith('/companies/c1/projects')
    expect(mockGet).toHaveBeenCalledWith('/companies/c1/tasks')
  })

  it('ensure is a no-op when companyId is undefined', async () => {
    const { ensure } = useLookupsForCompany(() => undefined)
    await ensure()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('returns empty arrays when companyId is set but store has no data for it', () => {
    // companyId is defined but there's no entry in the store maps yet
    const { employees, projects, tasks } = useLookupsForCompany(() => 'unknown-company')
    expect(employees.value).toEqual([])
    expect(projects.value).toEqual([])
    expect(tasks.value).toEqual([])
  })
})
