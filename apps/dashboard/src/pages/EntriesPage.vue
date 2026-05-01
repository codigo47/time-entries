<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useCompanyContextStore } from '@/stores/companyContext'
import { useHistoryStore } from '@/stores/history'
import { useDraftEntriesStore } from '@/stores/draftEntries'
import NewEntriesTab from '@/components/NewEntriesTab.vue'
import HistoryTab from '@/components/HistoryTab.vue'
import HistorySummary from '@/components/HistorySummary.vue'
import ShortcutsDialog from '@/components/ShortcutsDialog.vue'

const route = useRoute()
const router = useRouter()

const ctx = useCompanyContextStore()
const history = useHistoryStore()
const drafts = useDraftEntriesStore()

// When the global company changes, sync both History and New Entries
// even when their tabs are not currently mounted.
watch(() => ctx.companyId, (id) => {
  // History: update filter and reload
  history.filters.company_id = id === 'all' ? undefined : id
  history.filters.employee_id = undefined
  history.filters.project_id = undefined
  history.filters.task_id = undefined
  history.filters.page = 1
  history.load()

  // New Entries: propagate to existing draft rows when picking a specific company.
  // "All" leaves rows untouched (manual rows can't be "All").
  if (id !== 'all') {
    drafts.rows.forEach((row, i) => {
      drafts.rows[i] = {
        ...row,
        company_id: id,
        employee_id: undefined,
        project_id: undefined,
        task_id: undefined,
      }
    })
  }
})

const showShortcuts = ref(false)

const tab = computed({
  get: () => {
    const t = route.query.tab
    if (t === 'history' || t === 'summary') return t
    return 'new'
  },
  set: (v) => router.replace({ query: { ...route.query, tab: v } }),
})

useKeyboardShortcuts([
  { combo: '?', handler: () => { showShortcuts.value = !showShortcuts.value }, preventDefault: false },
  { combo: 'ctrl+1', handler: () => { tab.value = 'new' } },
  /* v8 ignore next */
  { combo: 'cmd+1', handler: () => { tab.value = 'new' } },
  { combo: 'ctrl+2', handler: () => { tab.value = 'history' } },
  /* v8 ignore next */
  { combo: 'cmd+2', handler: () => { tab.value = 'history' } },
  { combo: 'ctrl+3', handler: () => { tab.value = 'summary' } },
  /* v8 ignore next */
  { combo: 'cmd+3', handler: () => { tab.value = 'summary' } },
])
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 style="font-family: var(--font-sans); font-size: 1.25rem; font-weight: 600; color: var(--foreground); letter-spacing: -0.01em;">
        Time Entries
      </h1>
    </div>
    <ShortcutsDialog v-if="showShortcuts" />
    <!-- v8 ignore next -->
    <Tabs v-model="tab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="new">
          New Entries
        </TabsTrigger>
        <TabsTrigger value="history">
          History
        </TabsTrigger>
        <TabsTrigger value="summary">
          Summary
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new" class="mt-0">
        <NewEntriesTab />
      </TabsContent>
      <TabsContent value="history" class="mt-0">
        <HistoryTab />
      </TabsContent>
      <TabsContent value="summary" class="mt-0">
        <HistorySummary />
      </TabsContent>
    </Tabs>
  </div>
</template>
