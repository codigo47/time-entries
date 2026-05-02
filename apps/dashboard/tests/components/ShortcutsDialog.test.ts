import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, VueWrapper } from '@vue/test-utils'
import { useUiStore } from '@/stores/ui'
import ShortcutsDialog from '@/components/ShortcutsDialog.vue'

describe('ShortcutsDialog', () => {
  let attachTo: HTMLDivElement
  let wrapper: VueWrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    attachTo = document.createElement('div')
    document.body.appendChild(attachTo)
  })

  afterEach(() => {
    wrapper?.unmount()
    attachTo.remove()
  })

  it('does not render the dialog when shortcutsOpen is false', () => {
    wrapper = mount(ShortcutsDialog, { attachTo })
    expect(document.body.querySelector('[data-test="shortcuts-dialog"]')).toBeNull()
  })

  it('renders the dialog when shortcutsOpen is true', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    expect(document.body.querySelector('[data-test="shortcuts-dialog"]')).not.toBeNull()
  })

  it('shows keyboard shortcuts title', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const dialog = document.body.querySelector('[data-test="shortcuts-dialog"]')!
    expect(dialog.textContent).toContain('Keyboard shortcuts')
  })

  it('renders all shortcut entries', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const dialog = document.body.querySelector('[data-test="shortcuts-dialog"]')!
    expect(dialog.textContent).toContain('Ctrl/Cmd + Enter')
    expect(dialog.textContent).toContain('Submit')
    expect(dialog.textContent).toContain('Ctrl/Cmd + D')
    expect(dialog.textContent).toContain('Duplicate row')
    expect(dialog.textContent).toContain('?')
    expect(dialog.textContent).toContain('Open this help')
  })

  it('renders correct number of shortcut items (11)', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const items = document.body.querySelectorAll('[data-test="shortcuts-dialog"] li')
    expect(items.length).toBe(11)
  })

  it('shows F1 shortcut entry', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const dialog = document.body.querySelector('[data-test="shortcuts-dialog"]')!
    expect(dialog.textContent).toContain('F1')
  })

  it('shows Ctrl/Cmd+3 summary tab shortcut', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const dialog = document.body.querySelector('[data-test="shortcuts-dialog"]')!
    expect(dialog.textContent).toContain('Ctrl/Cmd + 3')
    expect(dialog.textContent).toContain('Summary tab')
  })

  it('clicking the close button sets shortcutsOpen to false', async () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const btn = document.body.querySelector<HTMLButtonElement>('[data-test="shortcuts-close-btn"]')!
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('clicking the overlay (outside the card) closes the dialog', async () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    const overlay = document.body.querySelector<HTMLElement>('[data-test="shortcuts-overlay"]')!
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('pressing Esc closes the dialog', async () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    wrapper = mount(ShortcutsDialog, { attachTo })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(ui.shortcutsOpen).toBe(false)
  })
})
