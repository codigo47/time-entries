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

const selectedName = computed(() => {
  if (ctx.companyId === 'all') return 'All companies'
  const c = lookups.companies.find((c) => c.id === ctx.companyId)
  return c?.name ?? 'All companies'
})

const isAll = computed(() => ctx.companyId === 'all')

const employeeCount = computed(() => {
  return Object.values(lookups.employeesByCompany).reduce((sum, arr) => sum + arr.length, 0)
})

const projectCount = computed(() => {
  return Object.values(lookups.projectsByCompany).reduce((sum, arr) => sum + arr.length, 0)
})
</script>

<template>
  <section
    class="relative z-10"
    style="background: var(--paper); border-bottom: 1px solid var(--rule);"
  >
    <div class="mx-auto max-w-6xl px-8 py-6">
      <!-- Eyebrow -->
      <p
        style="font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--graphite); margin-bottom: 0.35rem;"
      >currently viewing</p>

      <!-- Company name — the dominant editorial element; wraps the Select -->
      <Select v-model="value">
        <SelectTrigger
          class="border-0 shadow-none p-0 h-auto w-auto bg-transparent ring-0 focus:ring-0 hover:bg-transparent"
          style="outline: none;"
        >
          <span
            :style="{
              fontFamily: 'var(--font-display)',
              fontStyle: isAll ? 'italic' : 'normal',
              fontWeight: '500',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              lineHeight: '1.05',
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              display: 'block',
            }"
          >
            <SelectValue :placeholder="selectedName">{{ selectedName }}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All companies</SelectItem>
          <SelectItem v-for="c in lookups.companies" :key="c.id" :value="c.id">
            {{ c.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Sub-line stats -->
      <p
        class="mt-2"
        style="font-family: var(--font-sans); font-size: 0.8125rem; color: var(--graphite);"
      >
        {{ lookups.companies.length }} {{ lookups.companies.length === 1 ? 'company' : 'companies' }}
        <span style="margin: 0 0.4em; color: var(--rule);">·</span>
        {{ employeeCount }} {{ employeeCount === 1 ? 'employee' : 'employees' }}
        <span style="margin: 0 0.4em; color: var(--rule);">·</span>
        {{ projectCount }} {{ projectCount === 1 ? 'project' : 'projects' }}
      </p>
    </div>
  </section>
</template>
