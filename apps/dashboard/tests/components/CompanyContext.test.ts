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
import { useCompanyContextStore } from '@/stores/companyContext'
import CompanyContext from '@/components/CompanyContext.vue'

const mockGet = vi.mocked(api.get)

describe('CompanyContext', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls loadCompanies on mount', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    mount(CompanyContext, {
      global: {
        stubs: {
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div><slot /></div>' },
          SelectValue: { template: '<span />' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
        },
      },
    })
    await vi.waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/companies')
    })
  })

  it('starts with companyId = all', () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    mount(CompanyContext, {
      global: {
        stubs: {
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div><slot /></div>' },
          SelectValue: { template: '<span />' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
        },
      },
    })
    const ctx = useCompanyContextStore()
    expect(ctx.companyId).toBe('all')
  })

  it('renders company items from lookups store', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [
      { id: 'c1', name: 'Acme' },
      { id: 'c2', name: 'Globex' },
    ]
    mockGet.mockResolvedValueOnce({ data: { data: lookups.companies } } as never)

    const wrapper = mount(CompanyContext, {
      global: {
        stubs: {
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div><slot /></div>' },
          SelectValue: { template: '<span />' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { props: ['value'], template: '<div :data-value="value"><slot /></div>' },
        },
      },
    })
    await wrapper.vm.$nextTick()
    const text = wrapper.text()
    expect(text).toContain('Acme')
    expect(text).toContain('Globex')
  })

  it('updates companyId in store when Select emits update:modelValue', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } } as never)
    const ctx = useCompanyContextStore()

    const wrapper = mount(CompanyContext, {
      global: {
        stubs: {
          // Stub Select so it renders and can emit update:modelValue
          Select: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<div><button data-test="select-trigger" @click="$emit(\'update:modelValue\', \'c1\')">Select</button><slot /></div>',
          },
          SelectTrigger: { template: '<div><slot /></div>' },
          SelectValue: { template: '<span />' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.find('[data-test="select-trigger"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(ctx.companyId).toBe('c1')
  })

  it('does not fetch companies if already loaded', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]

    mount(CompanyContext, {
      global: {
        stubs: {
          Select: { template: '<div><slot /></div>' },
          SelectTrigger: { template: '<div><slot /></div>' },
          SelectValue: { template: '<span />' },
          SelectContent: { template: '<div><slot /></div>' },
          SelectItem: { template: '<div><slot /></div>' },
        },
      },
    })
    await new Promise((r) => setTimeout(r, 10))
    // loadCompanies skips if companies already populated
    expect(mockGet).not.toHaveBeenCalled()
  })
})
