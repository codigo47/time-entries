<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useLookupsStore } from '@/stores/lookups'
import { useCompanyContextStore } from '@/stores/companyContext'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const lookups = useLookupsStore()
const ctx = useCompanyContextStore()

onMounted(() => lookups.loadCompanies())

const value = computed({
  get: () => ctx.companyId,
  set: (v) => (ctx.companyId = v as 'all' | string),
})

defineExpose({ value })
</script>

<template>
  <Select v-model="value">
    <SelectTrigger
      class="w-56"
      data-test="company-context"
      title="Changes the company across all entries and filters"
      aria-label="Changes the company across all entries and filters"
    >
      <SelectValue placeholder="Company" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">
        All companies
      </SelectItem>
      <SelectItem v-for="c in lookups.companies" :key="c.id" :value="c.id">
        {{ c.name }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
