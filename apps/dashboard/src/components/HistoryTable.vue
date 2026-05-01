<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useHistoryStore } from '@/stores/history'
import { api } from '@/services/api'
import type { TimeEntryDto } from '@shared/types'

const history = useHistoryStore()

const editItem = ref<TimeEntryDto | null>(null)
const editHours = ref<number>(0)
const editNotes = ref<string>('')
const deleteId = ref<string | null>(null)
const actionError = ref<string | null>(null)

function startEdit(item: TimeEntryDto) {
  editItem.value = { ...item }
  editHours.value = item.hours
  editNotes.value = item.notes ?? ''
  actionError.value = null
}

function cancelEdit() {
  editItem.value = null
}

async function saveEdit() {
  if (!editItem.value) return
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

function confirmDelete(id: string) {
  deleteId.value = id
  actionError.value = null
}

function cancelDelete() {
  deleteId.value = null
}

async function doDelete() {
  if (!deleteId.value) return
  try {
    await api.delete(`/time-entries/${deleteId.value}`)
    deleteId.value = null
    await history.load()
  } catch {
    actionError.value = 'Failed to delete entry.'
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

defineExpose({ saveEdit, doDelete, editItem, deleteId, actionError })
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
            class="block w-full border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
          />
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

    <!-- Delete confirm dialog -->
    <div
      v-if="deleteId"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      data-test="delete-dialog"
    >
      <div class="bg-white rounded-lg border border-border p-6 w-72 space-y-3 shadow-lg">
        <h3 class="font-semibold text-foreground">
          Delete Entry?
        </h3>
        <p class="text-sm text-muted-foreground">
          This cannot be undone.
        </p>
        <div class="flex gap-2 justify-end">
          <button
            data-test="delete-cancel"
            class="text-sm px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors cursor-pointer bg-transparent"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            data-test="delete-confirm"
            class="text-sm px-3 py-1.5 rounded bg-destructive text-destructive-foreground border-none hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
            @click="doDelete"
          >
            <Trash2 class="size-4" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Sort controls -->
    <div class="flex gap-4 mb-3 text-xs text-muted-foreground">
      <button
        class="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
        @click="setSort('date')"
      >
        Sort by Date
      </button>
      <button
        class="hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
        @click="setSort('hours')"
      >
        Sort by Hours
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
    <div class="space-y-3">
      <div
        v-for="item in history.items"
        :key="item.id"
        data-test="history-row"
        data-test-card="history-card"
        class="rounded-lg border border-border bg-card p-4"
      >
        <!-- Line 1: Company · Date · Employee · Project -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div>
            <p class="text-xs text-muted-foreground mb-0.5">Date</p>
            <p class="text-sm font-medium text-foreground">{{ item.date }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-0.5">Employee</p>
            <p class="text-sm text-foreground">{{ item.employee?.name ?? item.employee_id }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-0.5">Project</p>
            <p class="text-sm text-foreground">{{ item.project?.name ?? item.project_id }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-0.5">Task</p>
            <p class="text-sm text-foreground">{{ item.task?.name ?? item.task_id }}</p>
          </div>
        </div>

        <!-- Line 2: Hours · Notes · Actions -->
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-[80px]">
            <p class="text-xs text-muted-foreground mb-0.5">Hours</p>
            <p class="text-sm font-medium text-foreground text-right">{{ item.hours }}</p>
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted-foreground mb-0.5">Notes</p>
            <p class="text-sm text-foreground">{{ item.notes ?? '—' }}</p>
          </div>
          <div class="flex items-center gap-1 ml-auto">
            <button
              data-test="edit-btn"
              aria-label="Edit entry"
              title="Edit entry"
              class="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border-none bg-transparent cursor-pointer transition-colors"
              @click="startEdit(item)"
            >
              <Pencil class="size-4" />
            </button>
            <button
              data-test="delete-btn"
              aria-label="Delete entry"
              title="Delete entry"
              class="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-none bg-transparent cursor-pointer transition-colors"
              @click="confirmDelete(item.id)"
            >
              <Trash2 class="size-4" />
            </button>
          </div>
        </div>
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
    </div>
  </div>
</template>
