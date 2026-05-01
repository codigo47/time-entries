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
  <div class="rounded border p-4" data-test="shortcuts-dialog">
    <h2 class="font-semibold">
      Keyboard shortcuts
    </h2>
    <ul class="mt-2 grid grid-cols-2 gap-2 text-sm">
      <li v-for="[k, v] in shortcuts" :key="k">
        <code>{{ k }}</code> — {{ v }}
      </li>
    </ul>
  </div>
</template>
