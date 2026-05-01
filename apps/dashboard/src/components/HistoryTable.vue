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
      data-test="action-error"
      style="font-family: var(--font-sans); font-style: italic; font-size: 0.8125rem; color: var(--error); margin-bottom: 0.75rem;"
    >{{ actionError }}</div>

    <!-- Edit dialog — inset card -->
    <div
      v-if="editItem"
      class="fixed inset-0 flex items-center justify-center z-50"
      style="background: rgba(15,14,12,0.45);"
      data-test="edit-dialog"
    >
      <div
        style="background: var(--paper-2); border: 1px solid var(--rule); border-radius: var(--radius); padding: 1.75rem 2rem; width: 22rem;"
      >
        <h3 style="font-family: var(--font-display); font-size: 1.125rem; font-weight: 500; color: var(--ink); margin-bottom: 1rem; letter-spacing: -0.01em;">
          Edit Entry
        </h3>
        <label style="display: block; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--graphite); margin-bottom: 0.75rem;">
          Hours
          <input
            v-model.number="editHours"
            data-test="edit-hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            style="display: block; width: 100%; margin-top: 0.3rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; font-family: var(--font-mono); font-size: 1rem; font-weight: 500; color: var(--ink); padding: 0.2rem 0;"
          />
        </label>
        <label style="display: block; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--graphite); margin-bottom: 1.25rem;">
          Notes
          <input
            v-model="editNotes"
            data-test="edit-notes"
            type="text"
            style="display: block; width: 100%; margin-top: 0.3rem; background: transparent; border: none; border-bottom: 1px solid var(--rule); outline: none; font-family: var(--font-sans); font-style: italic; font-size: 0.875rem; color: var(--ink); padding: 0.2rem 0;"
          />
        </label>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            data-test="edit-cancel"
            style="font-family: var(--font-sans); font-size: 0.8125rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 0;"
            @click="cancelEdit"
          >Cancel</button>
          <button
            data-test="edit-save"
            style="font-family: var(--font-display); font-size: 0.9rem; font-weight: 500; letter-spacing: 0.08em; background: var(--ledger); color: var(--paper); border: none; cursor: pointer; padding: 0.4rem 1rem; border-radius: var(--radius);"
            @click="saveEdit"
          >Save</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <div
      v-if="deleteId"
      class="fixed inset-0 flex items-center justify-center z-50"
      style="background: rgba(15,14,12,0.45);"
      data-test="delete-dialog"
    >
      <div
        style="background: var(--paper-2); border: 1px solid var(--rule); border-radius: var(--radius); padding: 1.75rem 2rem; width: 20rem;"
      >
        <h3 style="font-family: var(--font-display); font-size: 1.125rem; font-weight: 500; color: var(--ink); margin-bottom: 0.5rem; letter-spacing: -0.01em;">
          Delete Entry?
        </h3>
        <p style="font-family: var(--font-sans); font-size: 0.8125rem; font-style: italic; color: var(--graphite); margin-bottom: 1.25rem;">
          This cannot be undone.
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            data-test="delete-cancel"
            style="font-family: var(--font-sans); font-size: 0.8125rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 0;"
            @click="cancelDelete"
          >Cancel</button>
          <button
            data-test="delete-confirm"
            style="font-family: var(--font-display); font-size: 0.9rem; font-weight: 500; letter-spacing: 0.08em; background: var(--vermilion); color: var(--paper); border: none; cursor: pointer; padding: 0.4rem 1rem; border-radius: var(--radius);"
            @click="doDelete"
          >Delete</button>
        </div>
      </div>
    </div>

    <!-- Ledger table -->
    <div style="background: var(--paper-2); border: 1px solid var(--rule); border-radius: var(--radius);">
      <table class="w-full" style="border-collapse: collapse; font-size: 0.875rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--rule);">
            <th
              class="cursor-pointer sort-th"
              :data-sort="(history.filters.sort ?? '-date') === 'date' ? 'asc' : (history.filters.sort === '-date' ? 'desc' : '')"
              style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left; user-select: none;"
              @click="setSort('date')"
            >Date</th>
            <th style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left;">Employee</th>
            <th style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left;">Project</th>
            <th style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left;">Task</th>
            <th
              class="cursor-pointer sort-th"
              :data-sort="history.filters.sort === 'hours' ? 'asc' : /* v8 ignore next */ (history.filters.sort === '-hours' ? 'desc' : '')"
              style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: right; user-select: none;"
              @click="setSort('hours')"
            >Hours</th>
            <th style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--graphite); text-align: left;">Notes</th>
            <th style="width: 5rem;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="history.items.length === 0">
            <td
              colspan="7"
              style="text-align: center; padding: 2rem; font-family: var(--font-sans); font-style: italic; font-size: 0.875rem; color: var(--graphite); border-bottom: 1px solid var(--rule);"
            >No entries found.</td>
          </tr>
          <tr
            v-for="item in history.items"
            :key="item.id"
            data-test="history-row"
            style="border-bottom: 1px solid var(--rule);"
            class="history-row-hover"
          >
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink);">{{ item.date }}</td>
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-sans); font-size: 0.875rem; color: var(--ink);">{{ item.employee?.name ?? item.employee_id }}</td>
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-sans); font-size: 0.875rem; color: var(--ink);">{{ item.project?.name ?? item.project_id }}</td>
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-sans); font-size: 0.875rem; color: var(--graphite);">{{ item.task?.name ?? item.task_id }}</td>
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-mono); font-size: 0.875rem; font-weight: 500; text-align: right; color: var(--ink);">{{ item.hours }}</td>
            <td style="padding: 0.5rem 0.75rem; font-family: var(--font-sans); font-style: italic; font-size: 0.875rem; color: var(--graphite);">{{ item.notes }}</td>
            <td style="padding: 0.5rem 0.75rem; text-align: right;">
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end; opacity: 0; transition: opacity 180ms;" class="row-actions-hist">
                <button
                  data-test="edit-btn"
                  style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--blueprint); background: transparent; border: none; cursor: pointer; padding: 1px 4px; letter-spacing: 0.05em;"
                  @click="startEdit(item)"
                >edit</button>
                <button
                  data-test="delete-btn"
                  style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--vermilion); background: transparent; border: none; cursor: pointer; padding: 1px 4px; letter-spacing: 0.05em;"
                  @click="confirmDelete(item.id)"
                >×</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination — mono text style -->
      <div
        class="flex items-center justify-center gap-3"
        style="padding: 0.75rem; border-top: 1px solid var(--rule);"
        data-test="pagination"
      >
        <button
          data-test="page-prev"
          :disabled="history.meta.current_page <= 1"
          style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 0; disabled:opacity-40;"
          :style="history.meta.current_page <= 1 ? 'opacity: 0.35; cursor: default;' : ''"
          @click="setPage(history.meta.current_page - 1)"
        >← previous</button>
        <span style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--rule);">·</span>
        <span style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--ink);">{{ history.meta.current_page }} / {{ history.meta.last_page }}</span>
        <span style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--rule);">·</span>
        <button
          data-test="page-next"
          :disabled="history.meta.current_page >= history.meta.last_page"
          style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--graphite); background: transparent; border: none; cursor: pointer; padding: 0;"
          :style="history.meta.current_page >= history.meta.last_page ? 'opacity: 0.35; cursor: default;' : ''"
          @click="setPage(history.meta.current_page + 1)"
        >next →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-row-hover:hover .row-actions-hist {
  opacity: 1 !important;
}
.sort-th::after {
  content: '';
  margin-left: 0.25em;
  opacity: 0.5;
  font-size: 0.8em;
}
.sort-th[data-sort='asc']::after {
  content: '↑';
}
.sort-th[data-sort='desc']::after {
  content: '↓';
}
</style>
