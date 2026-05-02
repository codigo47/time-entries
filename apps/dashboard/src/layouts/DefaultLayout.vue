<script setup lang="ts">
import { Keyboard } from 'lucide-vue-next'
import CompanyContext from '@/components/CompanyContext.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- ── HEADER — narrow top bar ─────────────────────────── -->
    <header
      class="sticky top-0 z-10 bg-background border-b border-border"
      style="height: 56px;"
    >
      <div class="mx-auto max-w-6xl h-full flex items-center px-6">
        <!-- Product name -->
        <div class="flex items-center gap-2" data-test="header-logo">
          <span
            style="width: 6px; height: 6px; background: var(--foreground); display: inline-block; flex-shrink: 0;"
            aria-hidden="true"
          />
          <span
            style="font-family: var(--font-sans); font-size: 15px; font-weight: 600; color: var(--foreground); letter-spacing: -0.01em;"
          >Mason Time Entries</span>
        </div>
        <!-- Global company selector -->
        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            data-test="shortcuts-help-btn"
            aria-label="Show keyboard shortcuts (F1)"
            title="Keyboard shortcuts (F1)"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            @click="ui.openShortcuts()"
          >
            <Keyboard class="size-3.5" />
            <kbd class="text-[10px] font-mono px-1 py-0.5 border border-border rounded bg-muted">F1</kbd>
          </button>
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
