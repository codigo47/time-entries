import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

vi.mock('@/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  fieldErrors: vi.fn(),
}))

import { useDraftEntriesStore } from '@/stores/draftEntries'
import EntryFooter from '@/components/EntryFooter.vue'

describe('EntryFooter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders add row and submit buttons', () => {
    const wrapper = mount(EntryFooter)
    expect(wrapper.find('[data-test="add-row-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="submit-btn"]').exists()).toBe(true)
  })

  it('shows total hours from draft store', () => {
    const drafts = useDraftEntriesStore()
    drafts.rows = [
      { _id: 'r1', hours: 4, notes: null },
      { _id: 'r2', hours: 2.5, notes: null },
    ] as never
    const wrapper = mount(EntryFooter)
    expect(wrapper.find('[data-test="total"]').text()).toContain('6.50h')
  })

  it('shows 0.00h when no rows', () => {
    const wrapper = mount(EntryFooter)
    expect(wrapper.find('[data-test="total"]').text()).toContain('0.00h')
  })

  it('emits add-row when add row button is clicked', async () => {
    const wrapper = mount(EntryFooter)
    await wrapper.find('[data-test="add-row-btn"]').trigger('click')
    expect(wrapper.emitted('add-row')).toBeTruthy()
  })

  it('emits submit when submit button is clicked', async () => {
    const wrapper = mount(EntryFooter)
    await wrapper.find('[data-test="submit-btn"]').trigger('click')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('treats non-numeric hours as 0 in total calculation', () => {
    const drafts = useDraftEntriesStore()
    // Row with undefined hours (Number(undefined) = NaN, so || 0 gives 0)
    drafts.rows = [
      { _id: 'r1', hours: undefined, notes: null },
      { _id: 'r2', hours: 3, notes: null },
    ] as never
    const wrapper = mount(EntryFooter)
    expect(wrapper.find('[data-test="total"]').text()).toContain('3.00h')
  })
})
