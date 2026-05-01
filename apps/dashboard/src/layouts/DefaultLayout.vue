<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto max-w-6xl flex items-center justify-between p-4">
        <h1 class="text-lg font-semibold">
          Time Entry
        </h1>
        <!-- CompanyContext component goes here (built in Phase 8b) -->
        <div class="ml-auto" />
      </div>
    </header>
    <main class="mx-auto max-w-6xl p-4">
      <slot />
    </main>
  </div>
</template>
