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
