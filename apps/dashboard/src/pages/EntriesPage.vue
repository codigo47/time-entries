<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import NewEntriesTab from '@/components/NewEntriesTab.vue'
import HistoryTab from '@/components/HistoryTab.vue'
import ShortcutsDialog from '@/components/ShortcutsDialog.vue'

const route = useRoute()
const router = useRouter()

const showShortcuts = ref(false)

const tab = computed({
  get: () => (route.query.tab === 'history' ? 'history' : 'new'),
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
])
</script>

<template>
  <div>
    <ShortcutsDialog v-if="showShortcuts" />
    <!-- v8 ignore next -->
    <Tabs v-model="tab" class="w-full tabs-ledger">
      <TabsList
        class="bg-transparent border-0 shadow-none p-0 gap-8 mb-6 h-auto justify-start tabs-list-ledger"
      >
        <TabsTrigger
          value="new"
          class="tab-trigger-ledger bg-transparent border-0 shadow-none px-0 py-2 h-auto rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; color: var(--graphite); border-bottom: 2px solid transparent; transition: color 150ms, border-color 150ms;"
          :style="tab === 'new' ? 'color: var(--ink); border-bottom-color: var(--vermilion);' : ''"
        >
          New Entries
        </TabsTrigger>
        <TabsTrigger
          value="history"
          class="tab-trigger-ledger bg-transparent border-0 shadow-none px-0 py-2 h-auto rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent"
          style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; color: var(--graphite); border-bottom: 2px solid transparent; transition: color 150ms, border-color 150ms;"
          :style="tab === 'history' ? 'color: var(--ink); border-bottom-color: var(--vermilion);' : ''"
        >
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new" class="mt-0">
        <NewEntriesTab />
      </TabsContent>
      <TabsContent value="history" class="mt-0">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
