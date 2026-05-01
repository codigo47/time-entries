import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

function mountWithShortcuts(shortcuts: Parameters<typeof useKeyboardShortcuts>[0]) {
  return mount(
    defineComponent({
      setup() { useKeyboardShortcuts(shortcuts) },
      template: '<div />',
    }),
  )
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls handler when matching key is pressed', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: '?', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler for ctrl+enter combo', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+enter', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler for cmd+d (metaKey)', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'cmd+d', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when ctrl is missing', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+enter', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: false }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call handler for wrong key', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: '?', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call handler when shift is not expected but pressed', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+enter', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, shiftKey: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls multiple shortcut handlers independently', async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    mountWithShortcuts([
      { combo: '?', handler: h1 },
      { combo: 'ctrl+enter', handler: h2 },
    ])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).not.toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }))
    expect(h2).toHaveBeenCalledTimes(1)
    expect(h1).toHaveBeenCalledTimes(1)
  })

  it('stops listening after component is unmounted', async () => {
    const handler = vi.fn()
    const wrapper = mountWithShortcuts([{ combo: '?', handler }])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(handler).toHaveBeenCalledTimes(1)

    await wrapper.unmount()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(handler).toHaveBeenCalledTimes(1) // no new call
  })

  it('only calls the first matching shortcut handler', async () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    mountWithShortcuts([
      { combo: '?', handler: h1 },
      { combo: '?', handler: h2 },
    ])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).not.toHaveBeenCalled()
  })

  it('calls handler for ctrl+enter combo (ctrlKey path)', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+enter', handler }])
    // ctrlKey true (not metaKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, metaKey: false }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when shift is required but not pressed', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+shift+s', handler }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: false }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler with shift+key combo', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+shift+s', handler }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when alt is not expected but pressed', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: '?', handler }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', altKey: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler with alt+key combo', async () => {
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'alt+a', handler }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler when preventDefault is explicitly false', async () => {
    // Exercises the `s.preventDefault !== false` branch (false path)
    const handler = vi.fn()
    mountWithShortcuts([{ combo: 'ctrl+k', handler, preventDefault: false }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not match when combo produces empty key (empty string combo)', async () => {
    // Exercises the `parts.pop() ?? ''` null-coalescing branch (pop on empty array)
    const handler = vi.fn()
    // A combo of just '+' splits to ['', ''] — after pop key is '' which won't match real keys
    mountWithShortcuts([{ combo: '+', handler }])
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(handler).not.toHaveBeenCalled()
  })
})
