<script setup lang="ts">
import { computed } from 'vue'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const emit = defineEmits<{ (e: 'add-row'): void; (e: 'submit'): void }>()
const drafts = useDraftEntriesStore()
const total = computed(() => drafts.rows.reduce((s, r) => s + (Number(r.hours) || 0), 0))
</script>

<template>
  <div class="flex items-center gap-3">
    <button data-test="add-row-btn" @click="emit('add-row')">
      Add row
    </button>
    <button data-test="submit-btn" @click="emit('submit')">
      Submit
    </button>
    <span class="ml-auto" data-test="total">Total: {{ total.toFixed(2) }}h</span>
  </div>
</template>
