<script setup lang="ts">
import CompanyContext from '@/components/CompanyContext.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- ── HEADER — narrow top bar ─────────────────────────── -->
    <header
      class="sticky top-0 z-10 bg-background border-b border-border"
      style="height: 56px;"
    >
      <div class="mx-auto max-w-6xl h-full flex items-center justify-between px-6">
        <!-- Product name -->
        <div class="flex items-center gap-2">
          <span
            style="width: 6px; height: 6px; background: var(--foreground); display: inline-block; flex-shrink: 0;"
            aria-hidden="true"
          />
          <span
            style="font-family: var(--font-sans); font-size: 15px; font-weight: 600; color: var(--foreground); letter-spacing: -0.01em;"
          >Mason Time Entries</span>
        </div>

        <!-- Right: Company selector -->
        <div class="flex items-center gap-4">
          <CompanyContext />
        </div>
      </div>
    </header>

    <!-- ── MAIN content ───────────────────────────────────── -->
    <main class="mx-auto max-w-6xl px-6 py-6">
      <slot />
    </main>
  </div>
</template>
