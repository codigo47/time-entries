import { onMounted, onUnmounted } from 'vue'

export interface Shortcut {
  combo: string
  handler: (ev: KeyboardEvent) => void
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  function match(ev: KeyboardEvent, combo: string) {
    const parts = combo.toLowerCase().split('+')
    // v8 ignore next
    const key = parts.pop() ?? ''
    const wantCtrl = parts.includes('ctrl') || parts.includes('cmd')
    const wantShift = parts.includes('shift')
    const wantAlt = parts.includes('alt')
    const ctrlPressed = ev.ctrlKey || ev.metaKey
    return ev.key.toLowerCase() === key
      && (wantCtrl ? ctrlPressed : !ctrlPressed)
      && (wantShift ? ev.shiftKey : !ev.shiftKey)
      && (wantAlt ? ev.altKey : !ev.altKey)
  }

  function handler(ev: KeyboardEvent) {
    for (const s of shortcuts) {
      if (match(ev, s.combo)) {
        if (s.preventDefault !== false) ev.preventDefault()
        s.handler(ev)
        return
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
