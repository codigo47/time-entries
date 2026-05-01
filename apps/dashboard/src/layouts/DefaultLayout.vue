<script setup lang="ts">
import CompanyContext from '@/components/CompanyContext.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto max-w-6xl flex items-center justify-between p-4">
        <h1 class="text-lg font-semibold">
          Time Entry
        </h1>
        <CompanyContext />
      </div>
    </header>
    <main class="mx-auto max-w-6xl p-4">
      <slot />
    </main>
  </div>
</template>
