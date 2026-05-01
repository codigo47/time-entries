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
  <div
    v-if="props.enabled"
    class="ai-assist-block"
    data-test="ai-assist"
    style="background: var(--paper); border-top: 1px dashed var(--rule); border-bottom: 1px solid var(--rule); padding: 1rem 1.5rem; margin-bottom: 0.5rem;"
  >
    <!-- Eyebrow -->
    <p
      style="font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--graphite); margin-bottom: 0.5rem;"
    >dictated entry</p>

    <!-- Textarea — italic, baseline-ruled, no box -->
    <div style="position: relative;">
      <textarea
        v-model="text"
        rows="2"
        class="w-full"
        data-test="ai-text"
        placeholder="dictate in plain English…"
        style="font-family: var(--font-mono); font-style: italic; font-size: 0.9rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; resize: none; padding: 0.25rem 0; color: var(--ink); width: 100%;"
      />
    </div>

    <!-- Actions row -->
    <div class="flex items-center gap-4 mt-2">
      <button
        v-if="!loading"
        data-test="ai-parse-btn"
        :disabled="loading"
        class="ai-parse-btn"
        style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--vermilion); background: transparent; border: none; cursor: pointer; padding: 0; letter-spacing: 0.02em; transition: opacity 200ms;"
        @click="parse"
      >Parse</button>
      <span
        v-else
        data-test="ai-parse-btn"
        style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--graphite); animation: ellipsis-blink 1.2s infinite;"
      >Parsing…</span>
      <span
        v-if="error"
        class="text-sm"
        data-test="ai-error"
        style="font-family: var(--font-sans); font-style: italic; color: var(--error); font-size: 0.8125rem;"
      >{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
@keyframes ellipsis-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
/* Arrow prefix via pseudo-element — invisible to .text() in tests */
.ai-parse-btn::before {
  content: '→ ';
  font-style: normal;
}
/* Torn-paper snap on focus — pure CSS, no JS needed */
.ai-assist-block:focus-within {
  border-top: 1px solid var(--ink);
  transition: border-top-color 300ms cubic-bezier(0.2, 0.8, 0.2, 1.0);
}
</style>
