<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import { useDraftEntriesStore } from '@/stores/draftEntries'

const props = withDefaults(defineProps<{ enabled?: boolean }>(), {
  enabled: () => import.meta.env.VITE_AI_ENABLED === 'true',
})

const text = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const drafts = useDraftEntriesStore()

async function parse() {
  if (!text.value.trim()) return
  loading.value = true
  error.value = null
  try {
    const { data } = await api.post('/time-entries/parse', { text: text.value })
    if (!data.rows.length) {
      error.value = 'AI could not extract any rows. Add manually.'
      return
    }
    for (const row of data.rows) {
      drafts.addRow({ ...row })
    }
    text.value = ''
  } catch {
    error.value = 'AI parsing failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="props.enabled" class="rounded border p-3" data-test="ai-assist">
    <label class="text-sm">AI assist</label>
    <textarea v-model="text" rows="2" class="w-full" data-test="ai-text" placeholder="e.g. Athena worked on Olympus CRM doing cleanup for 2 hours on 2026-05-01" />
    <div class="flex items-center gap-2">
      <button data-test="ai-parse-btn" :disabled="loading" @click="parse">
        {{ loading ? 'Parsing…' : 'Parse' }}
      </button>
      <span v-if="error" class="text-red-600 text-sm" data-test="ai-error">{{ error }}</span>
    </div>
  </div>
</template>
