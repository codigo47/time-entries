<script setup lang="ts">
import { ref, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'

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
      <select v-model="groupBy" data-test="group-by-select">
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
    <table v-if="history.summary.length > 0" class="w-full text-sm">
      <thead>
        <tr>
          <th class="text-left">
            Group
          </th>
          <th class="text-left">
            Total Hours
          </th>
          <th class="text-left">
            Entries
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in history.summary" :key="row.group_key" data-test="summary-row">
          <td>{{ row.group_key }}</td>
          <td>{{ row.total_hours.toFixed(2) }}</td>
          <td>{{ row.entry_count }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-sm text-gray-500" data-test="summary-empty">
      No summary data.
    </p>
  </div>
</template>
