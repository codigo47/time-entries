<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import NewEntriesTab from '@/components/NewEntriesTab.vue'
import HistoryTab from '@/components/HistoryTab.vue'
import HistorySummary from '@/components/HistorySummary.vue'
import ShortcutsDialog from '@/components/ShortcutsDialog.vue'

const route = useRoute()
const router = useRouter()

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
