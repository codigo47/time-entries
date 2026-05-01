<script setup lang="ts">
import { ref, computed } from 'vue'
import { Pencil, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useHistoryStore } from '@/stores/history'
import { api } from '@/services/api'
import type { TimeEntryDto } from '@shared/types'
import { formatDateMDY } from '@/utils/format'

const history = useHistoryStore()

const editItem = ref<TimeEntryDto | null>(null)
const editHours = ref<number>(0)
const editNotes = ref<string>('')
const editError = ref<string | null>(null)
const actionError = ref<string | null>(null)

function startEdit(item: TimeEntryDto) {
  editItem.value = { ...item }
  editHours.value = item.hours
  editNotes.value = item.notes ?? ''
  editError.value = null
  actionError.value = null
}

function cancelEdit() {
  editItem.value = null
  editError.value = null
}

function validateEditHours(): string | null {
  const v = Number(editHours.value)
  if (!Number.isFinite(v) || v <= 0) return 'Enter the number of hours worked.'
  if (v > 24) return 'Hours cannot exceed 24 in a single entry.'
  if (!Number.isInteger(v * 4)) return 'Hours must be in 15-minute increments (e.g. 0.25, 0.50, 0.75).'
  return null
}

async function saveEdit() {
  if (!editItem.value) return
  const localErr = validateEditHours()
  if (localErr) {
    editError.value = localErr
    return
  }
  editError.value = null
  try {
    await api.patch(`/time-entries/${editItem.value.id}`, {
      hours: editHours.value,
      notes: editNotes.value || null,
    })
    editItem.value = null
    await history.load()
  } catch {
    actionError.value = 'Failed to save changes.'
  }
}

function setSort(field: string) {
  const current = history.filters.sort ?? '-date'
  if (current === field) {
    history.filters.sort = `-${field}`
  } else {
    history.filters.sort = field
  }
  history.filters.page = 1
  history.load()
}

function setPage(page: number) {
  history.filters.page = page
  history.load()
}

function setPerPage(value: number) {
  history.filters.per_page = value
  history.filters.page = 1
  history.load()
}

function sortIcon(field: string) {
  const s = history.filters.sort
  if (s === field) return 'asc'
  if (s === `-${field}`) return 'desc'
  return 'none'
}

const dateSortState = computed(() => sortIcon('date'))
const hoursSortState = computed(() => sortIcon('hours'))

defineExpose({ saveEdit, editItem, editError, actionError })
</script>

<template>
  <div data-test="history-table">
    <!-- Action error -->
    <div
      v-if="actionError"
      class="text-red-600 text-sm mb-2"
      data-test="action-error"
    >{{ actionError }}</div>

    <!-- Edit dialog -->
    <div
      v-if="editItem"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      data-test="edit-dialog"
    >
      <div class="bg-white rounded-lg border border-border p-6 w-80 space-y-3 shadow-lg">
        <h3 class="font-semibold text-foreground">
          Edit Entry
        </h3>
        <label class="block text-sm text-foreground">
          <span class="text-xs text-muted-foreground mb-1 block">Hours</span>
          <input
            v-model.number="editHours"
            data-test="edit-hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            :class="['block w-full border rounded px-2 py-1.5 text-sm outline-none focus:ring-1', editError ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : 'border-border focus:border-ring focus:ring-ring/50']"
            @input="editError = null"
          />
          <p v-if="editError" data-test="edit-error" class="text-xs text-destructive mt-1">{{ editError }}</p>
        </label>
        <label class="block text-sm text-foreground">
          <span class="text-xs text-muted-foreground mb-1 block">Notes</span>
          <input
            v-model="editNotes"
            data-test="edit-notes"
            type="text"
            class="block w-full border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
          />
        </label>
        <div class="flex gap-2 justify-end">
          <button
            data-test="edit-cancel"
            class="text-sm px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors cursor-pointer bg-transparent"
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button
            data-test="edit-save"
            class="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground border-none hover:opacity-90 transition-opacity cursor-pointer"
            @click="saveEdit"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- Sort controls -->
    <div class="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
      <span class="font-medium">Sort:</span>
      <button
        aria-label="Sort by date"
        :class="[
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer border-none transition-colors',
          dateSortState !== 'none' ? 'bg-muted text-foreground font-medium' : 'bg-transparent hover:text-foreground hover:bg-muted/50'
        ]"
        @click="setSort('date')"
      >
        <ArrowUp v-if="dateSortState === 'asc'" class="size-3.5" />
        <ArrowDown v-else-if="dateSortState === 'desc'" class="size-3.5" />
        <ArrowUpDown v-else class="size-3.5" />
        Date
      </button>
      <button
        aria-label="Sort by hours"
        :class="[
          'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer border-none transition-colors',
          hoursSortState !== 'none' ? 'bg-muted text-foreground font-medium' : 'bg-transparent hover:text-foreground hover:bg-muted/50'
        ]"
        @click="setSort('hours')"
      >
        <ArrowUp v-if="hoursSortState === 'asc'" class="size-3.5" />
        <ArrowDown v-else-if="hoursSortState === 'desc'" class="size-3.5" />
        <ArrowUpDown v-else class="size-3.5" />
        Hours
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-if="history.items.length === 0"
      class="text-center py-8 text-muted-foreground text-sm"
    >
      No entries found.
    </div>

    <!-- History cards -->
    <div class="space-y-2">
      <div
        v-for="item in history.items"
        :key="item.id"
        data-test="history-row"
        data-test-card="history-card"
        class="rounded-lg border border-border bg-card px-4 py-3"
      >
        <!-- Line 1: compact inline fields with right-aligned edit icon -->
        <div class="flex items-center gap-3">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground flex-1 min-w-0">
            <span class="font-medium">{{ formatDateMDY(item.date) }}</span>
            <span class="text-muted-foreground">·</span>
            <span>{{ item.employee?.name ?? item.employee_id }}</span>
            <span class="text-muted-foreground">·</span>
            <span>{{ item.project?.name ?? item.project_id }}</span>
            <span class="text-muted-foreground">·</span>
            <span>{{ item.task?.name ?? item.task_id }}</span>
            <span class="text-muted-foreground">·</span>
            <span class="font-medium">{{ item.hours }} h</span>
          </div>
          <button
            data-test="edit-btn"
            aria-label="Edit entry"
            title="Edit entry"
            class="inline-flex items-center justify-center size-9 rounded-md bg-primary text-primary-foreground border-none cursor-pointer hover:opacity-90 transition-opacity shrink-0"
            @click="startEdit(item)"
          >
            <Pencil class="size-4" />
          </button>
        </div>
        <!-- Line 2: notes (only if present) -->
        <p v-if="item.notes" class="text-xs italic text-muted-foreground mt-1">{{ item.notes }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center gap-2 mt-4" data-test="pagination">
      <button
        data-test="page-prev"
        :disabled="history.meta.current_page <= 1"
        class="inline-flex items-center justify-center size-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
        @click="setPage(history.meta.current_page - 1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <span class="text-sm text-muted-foreground">Page {{ history.meta.current_page }} of {{ history.meta.last_page }}</span>
      <button
        data-test="page-next"
        :disabled="history.meta.current_page >= history.meta.last_page"
        class="inline-flex items-center justify-center size-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer bg-transparent"
        @click="setPage(history.meta.current_page + 1)"
      >
        <ChevronRight class="size-4" />
      </button>
      <div class="flex items-center gap-1.5 ml-auto">
        <label class="text-sm text-muted-foreground" for="per-page-select">Per page:</label>
        <select
          id="per-page-select"
          data-test="per-page-select"
          :value="history.filters.per_page"
          class="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring cursor-pointer"
          @change="setPerPage(Number(($event.target as HTMLSelectElement).value))"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>
