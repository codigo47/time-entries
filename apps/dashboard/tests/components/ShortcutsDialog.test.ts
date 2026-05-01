import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShortcutsDialog from '@/components/ShortcutsDialog.vue'

describe('ShortcutsDialog', () => {
  it('renders the shortcuts dialog', () => {
    const wrapper = mount(ShortcutsDialog)
    expect(wrapper.find('[data-test="shortcuts-dialog"]').exists()).toBe(true)
  })

  it('shows keyboard shortcuts title', () => {
    const wrapper = mount(ShortcutsDialog)
    expect(wrapper.text()).toContain('Keyboard shortcuts')
  })

  it('renders all shortcut entries', () => {
    const wrapper = mount(ShortcutsDialog)
    expect(wrapper.text()).toContain('Ctrl/Cmd + Enter')
    expect(wrapper.text()).toContain('Submit')
    expect(wrapper.text()).toContain('Ctrl/Cmd + D')
    expect(wrapper.text()).toContain('Duplicate row')
    expect(wrapper.text()).toContain('?')
    expect(wrapper.text()).toContain('Open this help')
  })

  it('renders correct number of shortcut items', () => {
    const wrapper = mount(ShortcutsDialog)
    const items = wrapper.findAll('li')
    expect(items.length).toBe(9)
  })

  it('shows Ctrl/Cmd+3 summary tab shortcut', () => {
    const wrapper = mount(ShortcutsDialog)
    expect(wrapper.text()).toContain('Ctrl/Cmd + 3')
    expect(wrapper.text()).toContain('Summary tab')
  })
})
