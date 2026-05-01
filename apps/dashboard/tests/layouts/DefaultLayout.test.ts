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

import DefaultLayout from '@/layouts/DefaultLayout.vue'

describe('DefaultLayout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the header logo', () => {
    const wrapper = mount(DefaultLayout, {
      global: { stubs: { CompanyContext: { template: '<div data-test="company-context" />' } } },
    })
    expect(wrapper.find('[data-test="header-logo"]').exists()).toBe(true)
  })

  it('renders company-context selector in the header', () => {
    const wrapper = mount(DefaultLayout, {
      global: { stubs: { CompanyContext: { template: '<div data-test="company-context" />' } } },
    })
    const header = wrapper.find('header')
    expect(header.find('[data-test="company-context"]').exists()).toBe(true)
  })

  it('renders slot content in main', () => {
    const wrapper = mount(DefaultLayout, {
      global: { stubs: { CompanyContext: { template: '<div />' } } },
      slots: { default: '<span data-test="slot-content">Hello</span>' },
    })
    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(true)
  })
})
