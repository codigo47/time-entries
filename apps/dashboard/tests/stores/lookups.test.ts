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
import { useLookupsStore } from '@/stores/lookups'

const mockGet = vi.mocked(api.get)

describe('lookups store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useLookupsStore()
    expect(store.companies).toEqual([])
    expect(store.employeesByCompany).toEqual({})
    expect(store.projectsByCompany).toEqual({})
    expect(store.tasksByCompany).toEqual({})
  })

  it('loadCompanies fetches and stores companies', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Acme' }] } } as never)
    await store.loadCompanies()
    expect(mockGet).toHaveBeenCalledWith('/companies')
    expect(store.companies).toEqual([{ id: '1', name: 'Acme' }])
  })

  it('loadCompanies is a no-op when data already loaded', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Acme' }] } } as never)
    await store.loadCompanies()
    await store.loadCompanies()
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadEmployees fetches employees for a company', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'alice@test.com' }] } } as never)
    await store.loadEmployees('company-1')
    expect(mockGet).toHaveBeenCalledWith('/companies/company-1/employees')
    expect(store.employeesByCompany['company-1']).toEqual([{ id: 'e1', name: 'Alice', email: 'alice@test.com' }])
  })

  it('loadEmployees is a no-op when already loaded for that company', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
    await store.loadEmployees('company-1')
    await store.loadEmployees('company-1')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadProjects fetches projects for a company', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] } } as never)
    await store.loadProjects('c1')
    expect(mockGet).toHaveBeenCalledWith('/companies/c1/projects')
    expect(store.projectsByCompany['c1']).toEqual([{ id: 'p1', company_id: 'c1', name: 'Alpha' }])
  })

  it('loadProjects is a no-op when already loaded', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    await store.loadProjects('c1')
    await store.loadProjects('c1')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadTasks fetches tasks for a company', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 't1', company_id: 'c1', name: 'Dev' }] } } as never)
    await store.loadTasks('c1')
    expect(mockGet).toHaveBeenCalledWith('/companies/c1/tasks')
    expect(store.tasksByCompany['c1']).toEqual([{ id: 't1', company_id: 'c1', name: 'Dev' }])
  })

  it('loadTasks is a no-op when already loaded', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    await store.loadTasks('c1')
    await store.loadTasks('c1')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('invalidateAll resets all state', async () => {
    const store = useLookupsStore()
    mockGet
      .mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Acme' }] } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
    await store.loadCompanies()
    await store.loadEmployees('c1')
    store.invalidateAll()
    expect(store.companies).toEqual([])
    expect(store.employeesByCompany).toEqual({})
    expect(store.projectsByCompany).toEqual({})
    expect(store.tasksByCompany).toEqual({})
  })
})
