<script setup lang="ts">
import { computed } from 'vue'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const emit = defineEmits<{ (e: 'add-row'): void; (e: 'submit'): void }>()
const drafts = useDraftEntriesStore()
const total = computed(() => drafts.rows.reduce((s, r) => s + (Number(r.hours) || 0), 0))
</script>

<template>
  <div class="flex items-center gap-4">
    <!-- Add row — ghost button -->
    <button
      data-test="add-row-btn"
      class="text-sm text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer px-0 py-0"
      @click="emit('add-row')"
    >+ Add row</button>

    <!-- Running total — center -->
    <div class="flex items-center gap-1 mx-auto text-sm text-muted-foreground">
      Total:
      <span
        data-test="total"
        class="font-medium text-foreground"
      >{{ total.toFixed(2) }}h</span>
    </div>

    <!-- Submit entries — primary button -->
    <button
      data-test="submit-btn"
      class="text-sm font-medium bg-primary text-primary-foreground border-none cursor-pointer px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
      @click="emit('submit')"
    >Submit entries</button>
  </div>
</template>
