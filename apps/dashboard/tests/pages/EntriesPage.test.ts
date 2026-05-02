import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

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
import { useCompanyContextStore } from '@/stores/companyContext'
import { useHistoryStore } from '@/stores/history'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import { useUiStore } from '@/stores/ui'
import EntriesPage from '@/pages/EntriesPage.vue'

const mockGet = vi.mocked(api.get)

const globalStubs = {
  NewEntriesTab: { template: '<div data-test="new-entries-tab-stub" />' },
  HistoryTab: { template: '<div data-test="history-tab-stub" />' },
  HistorySummary: { template: '<div data-test="history-summary-stub" />' },
  ShortcutsDialog: { template: '<div data-test="shortcuts-dialog-stub" />' },
  Tabs: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    // The button triggers update:modelValue on the Tabs stub itself (v-model wired to parent)
    template: '<div data-test="tabs" :data-value="modelValue"><button data-test="switch-tab-btn" @click="$emit(\'update:modelValue\', modelValue === \'new\' ? \'history\' : \'new\')" /><slot /></div>',
  },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: {
    props: ['value'],
    template: '<button :data-tab="value" @click="$emit(\'update:modelValue\', value)"><slot /></button>',
    emits: ['update:modelValue'],
  },
  TabsContent: {
    props: ['value'],
    template: '<div :data-content="value"><slot /></div>',
  },
}

function makeRouter(initialPath = '/entries') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/entries', component: EntriesPage },
    ],
  })
  router.push(initialPath)
  return router
}

describe('EntriesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('defaults to new tab when no query param', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.find('[data-test="tabs"]')
    expect(tabs.attributes('data-value')).toBe('new')
  })

  it('shows history tab when ?tab=history', async () => {
    const router = makeRouter('/entries?tab=history')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.find('[data-test="tabs"]')
    expect(tabs.attributes('data-value')).toBe('history')
  })

  it('shows summary tab when ?tab=summary', async () => {
    const router = makeRouter('/entries?tab=summary')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.find('[data-test="tabs"]')
    expect(tabs.attributes('data-value')).toBe('summary')
  })

  it('defaults to new tab for unknown tab query value', async () => {
    const router = makeRouter('/entries?tab=unknown')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()
    const tabs = wrapper.find('[data-test="tabs"]')
    expect(tabs.attributes('data-value')).toBe('new')
  })

  it('does not show shortcuts dialog by default', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    const ui = useUiStore()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('shows shortcuts dialog when ? key is pressed', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    const ui = useUiStore()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(ui.shortcutsOpen).toBe(true)
  })

  it('hides shortcuts dialog on second ? press (toggle)', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    const ui = useUiStore()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('toggles shortcuts dialog on F1 key press', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    const ui = useUiStore()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('switches to new tab on Ctrl+1', async () => {
    const router = makeRouter('/entries?tab=history')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('new')
  })

  it('switches to history tab on Ctrl+2', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', ctrlKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('history')
  })

  it('renders all three tab contents', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-content="new"]').exists()).toBe(true)
    expect(wrapper.find('[data-content="history"]').exists()).toBe(true)
    expect(wrapper.find('[data-content="summary"]').exists()).toBe(true)
  })

  it('switches to summary tab on Ctrl+3', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', ctrlKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('summary')
  })

  it('switches to summary tab on Cmd+3 (metaKey)', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', metaKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('summary')
  })

  it('switches to new tab on Cmd+1 (metaKey)', async () => {
    const router = makeRouter('/entries?tab=history')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', metaKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('new')
  })

  it('switches to history tab on Cmd+2 (metaKey)', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', metaKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('history')
  })

  it('tab computed setter fires via Tabs v-model update', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    // Click the switch-tab button on the Tabs stub — emits update:modelValue on Tabs
    // This exercises the tab computed setter (router.replace)
    await wrapper.find('[data-test="switch-tab-btn"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 10))

    expect(router.currentRoute.value.query.tab).toBe('history')
  })

  it('changing ctx.companyId to a specific company updates history.filters.company_id and clears dependents', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const router = makeRouter('/entries')
    await router.isReady()
    const ctx = useCompanyContextStore()
    const history = useHistoryStore()
    history.filters.employee_id = 'e1'
    history.filters.project_id = 'p1'
    history.filters.task_id = 't1'
    ctx.companyId = 'all'

    const wrapper = mount(EntriesPage, { global: { plugins: [router], stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))

    ctx.companyId = 'c1'
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.company_id).toBe('c1')
    expect(history.filters.employee_id).toBeUndefined()
    expect(history.filters.project_id).toBeUndefined()
    expect(history.filters.task_id).toBeUndefined()
    expect(history.filters.page).toBe(1)
    expect(mockGet).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('changing ctx.companyId to "all" clears history.filters.company_id and reloads', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const router = makeRouter('/entries')
    await router.isReady()
    const ctx = useCompanyContextStore()
    const history = useHistoryStore()
    history.filters.company_id = 'c1'
    ctx.companyId = 'c1'

    const wrapper = mount(EntriesPage, { global: { plugins: [router], stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))

    ctx.companyId = 'all'
    await new Promise((r) => setTimeout(r, 10))

    expect(history.filters.company_id).toBeUndefined()
    expect(mockGet).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('changing ctx.companyId to a specific company propagates to every draft row and clears dependents', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const router = makeRouter('/entries')
    await router.isReady()
    const ctx = useCompanyContextStore()
    const drafts = useDraftEntriesStore()
    drafts.addRow({ _id: 'r1', company_id: 'old-c', employee_id: 'e-old', project_id: 'p-old', task_id: 't-old' })
    drafts.addRow({ _id: 'r2', company_id: undefined, employee_id: 'e-old2', project_id: 'p-old2', task_id: 't-old2' })

    const wrapper = mount(EntriesPage, { global: { plugins: [router], stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))

    ctx.companyId = 'c-new'
    await new Promise((r) => setTimeout(r, 10))

    expect(drafts.rows[0].company_id).toBe('c-new')
    expect(drafts.rows[0].employee_id).toBeUndefined()
    expect(drafts.rows[0].project_id).toBeUndefined()
    expect(drafts.rows[0].task_id).toBeUndefined()
    expect(drafts.rows[1].company_id).toBe('c-new')
    expect(drafts.rows[1].employee_id).toBeUndefined()
    wrapper.unmount()
  })

  it('changing ctx.companyId to "all" leaves draft rows untouched', async () => {
    mockGet.mockResolvedValue({ data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } } } as never)
    const router = makeRouter('/entries')
    await router.isReady()
    const ctx = useCompanyContextStore()
    const drafts = useDraftEntriesStore()
    ctx.companyId = 'c1'
    drafts.addRow({ _id: 'r1', company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1' })

    const wrapper = mount(EntriesPage, { global: { plugins: [router], stubs: globalStubs } })
    await new Promise((r) => setTimeout(r, 10))

    ctx.companyId = 'all'
    await new Promise((r) => setTimeout(r, 10))

    expect(drafts.rows[0].company_id).toBe('c1')
    expect(drafts.rows[0].employee_id).toBe('e1')
    expect(drafts.rows[0].project_id).toBe('p1')
    expect(drafts.rows[0].task_id).toBe('t1')
    wrapper.unmount()
  })
})
