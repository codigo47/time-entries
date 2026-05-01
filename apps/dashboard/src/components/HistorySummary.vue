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
  <div class="flex justify-end" data-test="history-summary">
    <div
      style="background: var(--paper-2); border: 1px solid var(--rule); border-radius: var(--radius); padding: 1rem 1.25rem; min-width: 20rem;"
    >
      <!-- Group-by selector as serif italic inline label -->
      <div class="flex items-center gap-2" style="margin-bottom: 0.75rem;">
        <span style="font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--graphite);">Grouped by</span>
        <select
          v-model="groupBy"
          data-test="group-by-select"
          style="font-family: var(--font-display); font-style: italic; font-size: 0.9rem; font-weight: 400; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; color: var(--ink); cursor: pointer; padding: 0 0.2em;"
        >
          <option value="company">Company</option>
          <option value="employee">Employee</option>
          <option value="project">Project</option>
          <option value="task">Task</option>
          <option value="date">Date</option>
        </select>
      </div>

      <table v-if="history.summary.length > 0" class="w-full" style="border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--rule);">
            <th style="padding: 0.3rem 0.5rem 0.3rem 0; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left;">Group</th>
            <th style="padding: 0.3rem 0.5rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: right;">Hours</th>
            <th style="padding: 0.3rem 0 0.3rem 0.5rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: right;">Entries</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in history.summary"
            :key="row.group_key"
            data-test="summary-row"
            style="border-bottom: 1px solid var(--rule);"
          >
            <td style="padding: 0.4rem 0.5rem 0.4rem 0; font-family: var(--font-sans); font-size: 0.8125rem; color: var(--ink);">{{ row.group_key }}</td>
            <td style="padding: 0.4rem 0.5rem; font-family: var(--font-mono); font-size: 0.875rem; font-weight: 500; text-align: right; color: var(--ink);">{{ row.total_hours.toFixed(2) }}</td>
            <td style="padding: 0.4rem 0 0.4rem 0.5rem; font-family: var(--font-mono); font-size: 0.8125rem; text-align: right; color: var(--graphite);">{{ row.entry_count }}</td>
          </tr>
        </tbody>
      </table>
      <p
        v-else
        data-test="summary-empty"
        style="font-family: var(--font-sans); font-style: italic; font-size: 0.8125rem; color: var(--graphite);"
      >No summary data.</p>
    </div>
  </div>
</template>
