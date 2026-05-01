<script setup lang="ts">
import { ref } from 'vue'
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
      <div class="bg-white rounded p-6 w-80 space-y-3">
        <h3 class="font-semibold">
          Edit Entry
        </h3>
        <label class="block text-sm">Hours
          <input
            v-model.number="editHours"
            data-test="edit-hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            class="block w-full border rounded px-2 py-1"
          />
        </label>
        <label class="block text-sm">Notes
          <input
            v-model="editNotes"
            data-test="edit-notes"
            type="text"
            class="block w-full border rounded px-2 py-1"
          />
        </label>
        <div class="flex gap-2 justify-end">
          <button data-test="edit-cancel" @click="cancelEdit">
            Cancel
          </button>
          <button data-test="edit-save" @click="saveEdit">
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
      <div class="bg-white rounded p-6 w-72 space-y-3">
        <h3 class="font-semibold">
          Delete Entry?
        </h3>
        <p class="text-sm">
          This cannot be undone.
        </p>
        <div class="flex gap-2 justify-end">
          <button data-test="delete-cancel" @click="cancelDelete">
            Cancel
          </button>
          <button data-test="delete-confirm" class="text-red-600" @click="doDelete">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Data table -->
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th class="cursor-pointer text-left" @click="setSort('date')">
            Date
          </th>
          <th class="text-left">
            Employee
          </th>
          <th class="text-left">
            Project
          </th>
          <th class="text-left">
            Task
          </th>
          <th class="cursor-pointer text-left" @click="setSort('hours')">
            Hours
          </th>
          <th class="text-left">
            Notes
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-if="history.items.length === 0">
          <td colspan="7" class="text-center py-4 text-gray-500">
            No entries found.
          </td>
        </tr>
        <tr
          v-for="item in history.items"
          :key="item.id"
          data-test="history-row"
        >
          <td>{{ item.date }}</td>
          <td>{{ item.employee?.name ?? item.employee_id }}</td>
          <td>{{ item.project?.name ?? item.project_id }}</td>
          <td>{{ item.task?.name ?? item.task_id }}</td>
          <td>{{ item.hours }}</td>
          <td>{{ item.notes }}</td>
          <td class="flex gap-1">
            <button data-test="edit-btn" @click="startEdit(item)">
              Edit
            </button>
            <button data-test="delete-btn" @click="confirmDelete(item.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="flex items-center gap-2 mt-3" data-test="pagination">
      <button
        data-test="page-prev"
        :disabled="history.meta.current_page <= 1"
        @click="setPage(history.meta.current_page - 1)"
      >
        Prev
      </button>
      <span>Page {{ history.meta.current_page }} of {{ history.meta.last_page }}</span>
      <button
        data-test="page-next"
        :disabled="history.meta.current_page >= history.meta.last_page"
        @click="setPage(history.meta.current_page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
