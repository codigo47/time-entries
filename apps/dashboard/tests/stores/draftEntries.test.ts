import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDraftEntriesStore } from '@/stores/draftEntries'

describe('draftEntries store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.resetModules()
  })

  it('starts with empty rows when localStorage is empty', () => {
    const store = useDraftEntriesStore()
    expect(store.rows).toEqual([])
  })

  it('addRow pushes a new draft with _id', () => {
    const store = useDraftEntriesStore()
    store.addRow()
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]._id).toBeDefined()
    expect(store.rows[0].notes).toBeNull()
  })

  it('addRow merges seed values', () => {
    const store = useDraftEntriesStore()
    store.addRow({ company_id: 'c1', employee_id: 'e1' })
    expect(store.rows[0].company_id).toBe('c1')
    expect(store.rows[0].employee_id).toBe('e1')
  })

  it('addRow generates unique _id for each row', () => {
    const store = useDraftEntriesStore()
    store.addRow()
    store.addRow()
    expect(store.rows[0]._id).not.toBe(store.rows[1]._id)
  })

  it('duplicate inserts a copy after the target index with new _id', () => {
    const store = useDraftEntriesStore()
    store.addRow({ company_id: 'c1' })
    store.addRow({ company_id: 'c2' })
    store.duplicate(0)
    expect(store.rows).toHaveLength(3)
    expect(store.rows[1].company_id).toBe('c1')
    expect(store.rows[1]._id).not.toBe(store.rows[0]._id)
  })

  it('duplicate is a no-op for out-of-range index', () => {
    const store = useDraftEntriesStore()
    store.addRow()
    store.duplicate(5)
    expect(store.rows).toHaveLength(1)
  })

  it('remove deletes the row at the given index', () => {
    const store = useDraftEntriesStore()
    store.addRow({ company_id: 'c1' })
    store.addRow({ company_id: 'c2' })
    store.remove(0)
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0].company_id).toBe('c2')
  })

  it('clear empties all rows', () => {
    const store = useDraftEntriesStore()
    store.addRow()
    store.addRow()
    store.clear()
    expect(store.rows).toEqual([])
  })

  it('persists rows to localStorage on change', async () => {
    const store = useDraftEntriesStore()
    store.addRow({ company_id: 'c1' })
    await new Promise((r) => setTimeout(r, 0))
    const persisted = JSON.parse(localStorage.getItem('draftEntries') ?? '[]')
    expect(persisted).toHaveLength(1)
    expect(persisted[0].company_id).toBe('c1')
  })

  it('loads rows from localStorage on init', () => {
    const draft = [{ _id: 'existing-id', notes: null, company_id: 'c1' }]
    localStorage.setItem('draftEntries', JSON.stringify(draft))
    // Reset pinia so store re-initializes
    setActivePinia(createPinia())
    const store = useDraftEntriesStore()
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]._id).toBe('existing-id')
  })

  it('returns empty array when localStorage contains invalid JSON', async () => {
    localStorage.setItem('draftEntries', 'not-valid-json{{{')
    // Re-import fresh module so load() runs with corrupted localStorage
    const { useDraftEntriesStore: freshStore } = await import('@/stores/draftEntries')
    setActivePinia(createPinia())
    const store = freshStore()
    expect(store.rows).toEqual([])
  })
})
