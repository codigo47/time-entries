import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompanyContextStore } from '@/stores/companyContext'

describe('companyContext store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('defaults to "all" when localStorage is empty', () => {
    const store = useCompanyContextStore()
    expect(store.companyId).toBe('all')
  })

  it('reads initial value from localStorage', () => {
    localStorage.setItem('companyId', 'company-uuid-123')
    const store = useCompanyContextStore()
    expect(store.companyId).toBe('company-uuid-123')
  })

  it('persists changes to localStorage', async () => {
    const store = useCompanyContextStore()
    store.companyId = 'new-company-id'
    // Wait for the watcher to flush
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('companyId')).toBe('new-company-id')
  })

  it('allows setting back to "all"', async () => {
    localStorage.setItem('companyId', 'some-id')
    const store = useCompanyContextStore()
    store.companyId = 'all'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('companyId')).toBe('all')
  })
})
