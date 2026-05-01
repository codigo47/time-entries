<script setup lang="ts">
import { onMounted } from 'vue'
import { useHistoryStore } from '@/stores/history'
import HistoryFilters from './HistoryFilters.vue'
import HistoryTable from './HistoryTable.vue'

const history = useHistoryStore()

onMounted(() => { history.load() })
</script>

<template>
  <div class="space-y-6" data-test="history-tab">
    <HistoryFilters />
    <HistoryTable />
  </div>
</template>
