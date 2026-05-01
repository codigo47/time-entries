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
    <Tabs v-model="tab" class="w-full">
      <TabsList>
        <TabsTrigger value="new">
          New Entries
        </TabsTrigger>
        <TabsTrigger value="history">
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <NewEntriesTab />
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
