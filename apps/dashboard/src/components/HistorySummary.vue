<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { formatDateMDY } from '@/utils/format'

const history = useHistoryStore()
const groupBy = ref('company')

watch(groupBy, (v) => {
  history.loadSummary(v)
}, { immediate: true })
</script>

<template>
  <div class="space-y-2" data-test="history-summary">
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium">Group by:</label>
      <select
        v-model="groupBy"
        data-test="group-by-select"
        class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer"
      >
        <option value="company">
          Company
        </option>
        <option value="employee">
          Employee
        </option>
        <option value="project">
          Project
        </option>
        <option value="task">
          Task
        </option>
        <option value="date">
          Date
        </option>
      </select>
    </div>
    <div v-if="history.summary.length > 0" class="space-y-2">
      <div
        v-for="row in history.summary"
        :key="row.group_key"
        data-test="summary-row"
        class="flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm"
      >
        <span class="flex-1 font-medium text-foreground">{{ groupBy === 'date' ? formatDateMDY(row.group_label ?? row.group_key) : (row.group_label ?? row.group_key) }}</span>
        <span class="w-20 text-right font-medium text-foreground">{{ Number(row.total_hours).toFixed(2) }} h</span>
        <span class="w-20 text-right text-muted-foreground">{{ row.entry_count }} entries</span>
      </div>
    </div>
    <p v-else class="text-sm text-gray-500" data-test="summary-empty">
      No summary data.
    </p>
  </div>
</template>
