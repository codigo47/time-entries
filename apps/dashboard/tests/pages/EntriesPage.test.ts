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

import EntriesPage from '@/pages/EntriesPage.vue'

const globalStubs = {
  NewEntriesTab: { template: '<div data-test="new-entries-tab-stub" />' },
  HistoryTab: { template: '<div data-test="history-tab-stub" />' },
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
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    expect(wrapper.find('[data-test="shortcuts-dialog-stub"]').exists()).toBe(false)
  })

  it('shows shortcuts dialog when ? key is pressed', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="shortcuts-dialog-stub"]').exists()).toBe(true)
  })

  it('hides shortcuts dialog on second ? press (toggle)', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="shortcuts-dialog-stub"]').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="shortcuts-dialog-stub"]').exists()).toBe(false)
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

  it('renders both tab contents', async () => {
    const router = makeRouter('/entries')
    await router.isReady()
    const wrapper = mount(EntriesPage, {
      global: { plugins: [router], stubs: globalStubs },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-content="new"]').exists()).toBe(true)
    expect(wrapper.find('[data-content="history"]').exists()).toBe(true)
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
})
