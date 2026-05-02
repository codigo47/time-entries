import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const shortcutsOpen = ref(false)
  function toggleShortcuts() { shortcutsOpen.value = !shortcutsOpen.value }
  function openShortcuts() { shortcutsOpen.value = true }
  function closeShortcuts() { shortcutsOpen.value = false }
  return { shortcutsOpen, toggleShortcuts, openShortcuts, closeShortcuts }
})
