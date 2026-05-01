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
    style="background: var(--paper-2); border: 1px solid var(--rule); border-radius: var(--radius); padding: 1.25rem 1.5rem; margin-bottom: 1rem;"
  >
    <h2
      style="font-family: var(--font-display); font-size: 1rem; font-weight: 500; color: var(--ink); margin-bottom: 0.75rem; letter-spacing: -0.01em;"
    >Keyboard shortcuts</h2>
    <ul style="list-style: none; margin: 0; padding: 0;">
      <li
        v-for="[k, v] in shortcuts"
        :key="k"
        style="display: flex; align-items: baseline; gap: 1rem; padding: 0.35rem 0; border-bottom: 1px solid var(--rule);"
      >
        <span style="width: 45%; flex-shrink: 0;"><kbd>{{ k }}</kbd></span>
        <span style="font-family: var(--font-sans); font-size: 0.8125rem; color: var(--graphite);">{{ v }}</span>
      </li>
    </ul>
  </div>
</template>
