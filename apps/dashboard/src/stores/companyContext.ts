import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useCompanyContextStore = defineStore('companyContext', () => {
  const companyId = ref<string | 'all'>(localStorage.getItem('companyId') ?? 'all')
  watch(companyId, (v) => localStorage.setItem('companyId', v))
  return { companyId }
})
