<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { useCompanyContextStore } from '@/stores/companyContext'
import HistoryFilters from './HistoryFilters.vue'
import HistoryTable from './HistoryTable.vue'
import HistorySummary from './HistorySummary.vue'

const history = useHistoryStore()
const ctx = useCompanyContextStore()

watch(() => ctx.companyId, (id) => {
  history.filters.company_id = id === 'all' ? undefined : id
  history.load()
}, { immediate: true })

onMounted(() => { history.load() })
</script>

<template>
  <div class="space-y-4" data-test="history-tab">
    <HistoryFilters />
    <HistoryTable />
    <HistorySummary />
  </div>
</template>
