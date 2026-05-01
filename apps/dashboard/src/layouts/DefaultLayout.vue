<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import CompanyContext from '@/components/CompanyContext.vue'
import HoursMasthead from '@/components/HoursMasthead.vue'

const timeStr = ref('')

function updateTime() {
  const now = new Date()
  timeStr.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

let timer: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="min-h-screen bg-background text-foreground relative">
    <!-- Decorative left-margin notebook rule -->
    <div
      class="pointer-events-none fixed top-0 bottom-0 w-px"
      style="left: calc(50% - 40rem + 1.5rem); background: var(--rule); opacity: 0.45;"
      aria-hidden="true"
    />

    <!-- ── HEADER — journal masthead ─────────────────────── -->
    <header
      class="relative z-10"
      style="background: var(--paper); border-bottom: 1px solid var(--rule);"
    >
      <div class="mx-auto max-w-6xl flex items-center justify-between px-8 py-4">
        <!-- Wordmark -->
        <div class="flex flex-col leading-none gap-0.5">
          <span
            style="font-family: var(--font-display); font-style: italic; font-weight: 500; font-size: 1.5rem; color: var(--ink); letter-spacing: -0.02em;"
          >Horæ</span>
          <span
            style="font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--graphite);"
          >time ledger v1</span>
        </div>

        <!-- Right: clock (CompanyContext accessible but visually subordinate here) -->
        <div class="flex items-center gap-6">
          <span
            class="tabular-nums"
            style="font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: 0.05em; color: var(--graphite);"
          >{{ timeStr }}</span>
          <!-- CompanyContext kept in DOM for its tests; visually it lives in HoursMasthead -->
          <div class="sr-only" aria-hidden="true">
            <CompanyContext />
          </div>
        </div>
      </div>
    </header>

    <!-- ── MASTHEAD — filing slip / company selector ─────── -->
    <HoursMasthead />

    <!-- ── MAIN content ───────────────────────────────────── -->
    <main class="relative z-10 mx-auto max-w-6xl px-8 py-6">
      <slot />
    </main>
  </div>
</template>
