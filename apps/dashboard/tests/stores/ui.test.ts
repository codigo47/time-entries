import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '@/stores/ui'

describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shortcutsOpen defaults to false', () => {
    const ui = useUiStore()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('openShortcuts sets shortcutsOpen to true', () => {
    const ui = useUiStore()
    ui.openShortcuts()
    expect(ui.shortcutsOpen).toBe(true)
  })

  it('closeShortcuts sets shortcutsOpen to false', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    ui.closeShortcuts()
    expect(ui.shortcutsOpen).toBe(false)
  })

  it('toggleShortcuts flips shortcutsOpen from false to true', () => {
    const ui = useUiStore()
    ui.toggleShortcuts()
    expect(ui.shortcutsOpen).toBe(true)
  })

  it('toggleShortcuts flips shortcutsOpen from true to false', () => {
    const ui = useUiStore()
    ui.shortcutsOpen = true
    ui.toggleShortcuts()
    expect(ui.shortcutsOpen).toBe(false)
  })
})
