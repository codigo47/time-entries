<script setup lang="ts">
const shortcuts = [
  ['Tab / Shift+Tab', 'Move between cells'],
  ['Enter (last cell)', 'Add a new row'],
  ['Ctrl/Cmd + D', 'Duplicate row'],
  ['Ctrl/Cmd + Backspace', 'Delete row'],
  ['Ctrl/Cmd + Enter', 'Submit'],
  ['Ctrl/Cmd + 1 / 2', 'Switch tabs'],
  ['?', 'Open this help'],
]
</script>

<template>
  <div
    data-test="shortcuts-dialog"
    class="rounded-lg border border-border bg-card p-5 mb-4"
  >
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
</template>
