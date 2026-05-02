<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

const ui = useUiStore()

useKeyboardShortcuts([{ combo: 'escape', handler: () => ui.closeShortcuts() }])

const shortcuts = [
  ['F1', 'Open this help'],
  ['?', 'Open this help'],
  ['Esc', 'Close this help'],
  ['Tab / Shift+Tab', 'Move between cells'],
  ['Enter (last cell)', 'Add a new row'],
  ['Ctrl/Cmd + D', 'Duplicate row'],
  ['Ctrl/Cmd + Backspace', 'Delete row'],
  ['Ctrl/Cmd + Enter', 'Submit'],
  ['Ctrl/Cmd + 1', 'Switch to New Entries tab'],
  ['Ctrl/Cmd + 2', 'Switch to History tab'],
  ['Ctrl/Cmd + 3', 'Switch to Summary tab'],
]
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ui.shortcutsOpen"
      data-test="shortcuts-overlay"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      @click.self="ui.closeShortcuts()"
    >
      <div
        data-test="shortcuts-dialog"
        class="relative rounded-lg border border-border bg-card p-5 w-full max-w-md mx-4 shadow-lg"
      >
        <button
          type="button"
          data-test="shortcuts-close-btn"
          aria-label="Close keyboard shortcuts"
          class="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          @click="ui.closeShortcuts()"
        >
          <X class="size-4" />
        </button>
        <h2 class="text-sm font-semibold text-foreground mb-3">
          Keyboard shortcuts
        </h2>
        <ul style="list-style: none; margin: 0; padding: 0;">
          <li
            v-for="[k, v] in shortcuts"
            :key="k"
            class="flex items-baseline gap-4 py-1.5 border-b border-border last:border-0"
          >
            <span class="w-5/12 flex-shrink-0"><kbd>{{ k }}</kbd></span>
            <span class="text-sm text-muted-foreground">{{ v }}</span>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
