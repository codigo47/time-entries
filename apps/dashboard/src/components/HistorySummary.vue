<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { formatDateMDY } from '@/utils/format'

const history = useHistoryStore()
const groupBy = ref('company')

// Reload the summary on group-by changes AND whenever the shared filters
// (e.g. the global Company selector) change while this tab is mounted.
watch(
  [groupBy, () => history.filters],
  () => history.loadSummary(groupBy.value),
  { immediate: true, deep: true },
)
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
    <div v-if="history.summary.length > 0" class="border border-border rounded-lg overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border">Group</th>
            <th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border">Total Hours</th>
            <th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border">Entries</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in history.summary"
            :key="row.group_key"
            data-test="summary-row"
            class="hover:bg-muted/40 transition-colors"
          >
            <td class="px-3 py-2 border-b border-border">{{ groupBy === 'date' ? formatDateMDY(row.group_label ?? row.group_key) : (row.group_label ?? row.group_key) }}</td>
            <td class="px-3 py-2 text-right font-medium border-b border-border">{{ Number(row.total_hours).toFixed(2) }} h</td>
            <td class="px-3 py-2 text-right text-muted-foreground border-b border-border">{{ row.entry_count }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="text-sm text-muted-foreground" data-test="summary-empty">
      No summary data.
    </p>
  </div>
</template>
