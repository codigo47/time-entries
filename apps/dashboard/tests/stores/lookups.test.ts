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
    expect(store.allEmployees).toEqual([])
    expect(store.allProjects).toEqual([])
    expect(store.employeesByProject).toEqual({})
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

  it('loadAllEmployees fetches all employees', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'alice@test.com' }] } } as never)
    await store.loadAllEmployees()
    expect(mockGet).toHaveBeenCalledWith('/employees')
    expect(store.allEmployees).toEqual([{ id: 'e1', name: 'Alice', email: 'alice@test.com' }])
  })

  it('loadAllEmployees is a no-op when already loaded', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
    await store.loadAllEmployees()
    await store.loadAllEmployees()
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadAllProjects fetches all projects', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] } } as never)
    await store.loadAllProjects()
    expect(mockGet).toHaveBeenCalledWith('/projects')
    expect(store.allProjects).toEqual([{ id: 'p1', company_id: 'c1', name: 'Alpha' }])
  })

  it('loadAllProjects is a no-op when already loaded', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    await store.loadAllProjects()
    await store.loadAllProjects()
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadEmployeesByProject fetches employees for a project', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'alice@test.com' }] } } as never)
    await store.loadEmployeesByProject('p1')
    expect(mockGet).toHaveBeenCalledWith('/projects/p1/employees')
    expect(store.employeesByProject['p1']).toEqual([{ id: 'e1', name: 'Alice', email: 'alice@test.com' }])
  })

  it('loadEmployeesByProject is a no-op on second call (memoized)', async () => {
    const store = useLookupsStore()
    mockGet.mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
    await store.loadEmployeesByProject('p1')
    await store.loadEmployeesByProject('p1')
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('loadEmployeesByProject fetches separately per project', async () => {
    const store = useLookupsStore()
    mockGet
      .mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'e2', name: 'Bob', email: 'b@b.com' }] } } as never)
    await store.loadEmployeesByProject('p1')
    await store.loadEmployeesByProject('p2')
    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(store.employeesByProject['p1']).toHaveLength(1)
    expect(store.employeesByProject['p2']).toHaveLength(1)
  })

  it('invalidateAll resets all state including employeesByProject', async () => {
    const store = useLookupsStore()
    mockGet
      .mockResolvedValueOnce({ data: { data: [{ id: '1', name: 'Acme' }] } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'e1', name: 'Alice', email: 'a@b.com' }] } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'e2', name: 'Bob', email: 'b@b.com' }] } } as never)
      .mockResolvedValueOnce({ data: { data: [{ id: 'e3', name: 'Carol', email: 'c@b.com' }] } } as never)
    await store.loadCompanies()
    await store.loadEmployees('c1')
    await store.loadAllEmployees()
    await store.loadEmployeesByProject('p1')
    store.invalidateAll()
    expect(store.companies).toEqual([])
    expect(store.employeesByCompany).toEqual({})
    expect(store.projectsByCompany).toEqual({})
    expect(store.tasksByCompany).toEqual({})
    expect(store.allEmployees).toEqual([])
    expect(store.allProjects).toEqual([])
    expect(store.employeesByProject).toEqual({})
  })
})
