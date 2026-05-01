<script setup lang="ts">
import { computed } from 'vue'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const emit = defineEmits<{ (e: 'add-row'): void; (e: 'submit'): void }>()
const drafts = useDraftEntriesStore()
const total = computed(() => drafts.rows.reduce((s, r) => s + (Number(r.hours) || 0), 0))
</script>

<template>
  <div class="flex items-center gap-4">
    <!-- + Add row — small text button -->
    <button
      data-test="add-row-btn"
      style="font-family: var(--font-sans); font-size: 0.8125rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 0; letter-spacing: 0.01em; position: relative;"
      class="underline-draw-btn"
      @click="emit('add-row')"
    >+ Add row</button>

    <!-- Running total — center, mono -->
    <div class="flex items-center gap-2 mx-auto">
      <span style="font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--graphite);">Total</span>
      <span
        data-test="total"
        style="font-family: var(--font-mono); font-size: 1rem; font-weight: 500; color: var(--ink); letter-spacing: 0.04em;"
      >{{ total.toFixed(2) }}h</span>
    </div>

    <!-- FILE ENTRIES — principal vermilion CTA -->
    <button
      data-test="submit-btn"
      style="font-family: var(--font-display); font-size: 1rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: var(--vermilion); color: var(--paper); border: none; cursor: pointer; padding: 0.5rem 1.5rem; border-radius: var(--radius); transition: opacity 180ms var(--ease-studio);"
      @click="emit('submit')"
    >File Entries</button>
  </div>
</template>

<style scoped>
.underline-draw-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--ink);
  transition: width 200ms var(--ease-studio);
}
.underline-draw-btn:hover::after {
  width: 100%;
}
</style>
