import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  fieldErrors: vi.fn(),
}))

import { api } from '@/services/api'
import { useLookupsStore } from '@/stores/lookups'
import AiEntryDialog from '@/components/AiEntryDialog.vue'

const mockPost = vi.mocked(api.post)
const mockGet = vi.mocked(api.get)

// Helpers: query from document.body (needed because Teleport renders outside wrapper root)
function q(selector: string): Element | null {
  return document.body.querySelector(selector)
}
async function setBodyValue(selector: string, value: string) {
  const el = q(selector) as HTMLTextAreaElement | HTMLInputElement | null
  if (!el) throw new Error(`Element not found: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event('input'))
  el.dispatchEvent(new Event('change'))
}
function clickBody(selector: string) {
  const el = q(selector) as HTMLElement | null
  if (!el) throw new Error(`Element not found: ${selector}`)
  el.click()
}

describe('AiEntryDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { data: [] } } as never)
  })

  afterEach(() => {
    document.body.querySelectorAll('[data-test="ai-entry-dialog"]').forEach((el) => el.remove())
  })

  it('renders textarea and submit button when open', () => {
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    expect(q('[data-test="ai-entry-dialog"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-textarea"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-submit"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-cancel"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('does not render dialog content when modelValue is false', () => {
    const wrapper = mount(AiEntryDialog, { props: { modelValue: false }, attachTo: document.body })
    expect(q('[data-test="ai-entry-dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('guardrail blocks submit when text does not look like a time entry', async () => {
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'What is the weather today?')
    clickBody('[data-test="ai-entry-submit"]')
    await wrapper.vm.$nextTick()

    expect(q('[data-test="ai-entry-guardrail"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-guardrail"]')!.textContent).toContain('Please describe a time entry')
    expect(mockPost).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('guardrail passes when text contains hours keyword', async () => {
    mockPost.mockResolvedValueOnce({ data: { rows: [] } } as never)
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Worked 2 hours on a thing')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(q('[data-test="ai-entry-guardrail"]')).toBeNull()
    expect(mockPost).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('guardrail passes when text contains worked keyword', async () => {
    mockPost.mockResolvedValueOnce({ data: { rows: [] } } as never)
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'John worked on a project')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(q('[data-test="ai-entry-guardrail"]')).toBeNull()
    expect(mockPost).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('shows API error when no rows returned', async () => {
    mockPost.mockResolvedValueOnce({ data: { rows: [] } } as never)
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 4 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(q('[data-test="ai-entry-error"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-error"]')!.textContent).toContain('Unable to parse')
    wrapper.unmount()
  })

  it('calls api.post with the text and emits apply with all parsed values', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]
    lookups.employeesByCompany = { c1: [{ id: 'e1', name: 'Alice', email: 'a@test.com' }] }
    lookups.projectsByCompany = { c1: [{ id: 'p1', company_id: 'c1', name: 'Alpha' }] }
    lookups.tasksByCompany = { c1: [{ id: 't1', company_id: 'c1', name: 'Dev' }] }

    const rows = [
      { company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 4, notes: 'some work' },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    const inputText = 'Alice worked 4 hours on Alpha'
    await setBodyValue('[data-test="ai-entry-textarea"]', inputText)
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(mockPost).toHaveBeenCalledWith('/time-entries/parse', { text: inputText })

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].row.company_id).toBe('c1')
    expect(emitted[0][0].row.employee_id).toBe('e1')
    expect(emitted[0][0].row.project_id).toBe('p1')
    expect(emitted[0][0].row.task_id).toBe('t1')
    expect(emitted[0][0].row.date).toBe('2026-05-01')
    expect(emitted[0][0].row.hours).toBe(4)
    expect(emitted[0][0].row.notes).toBe('some work')
    expect(emitted[0][0].unmatched).toEqual([])

    // Dialog closes after apply
    const closeEmit = wrapper.emitted('update:modelValue') as boolean[][]
    expect(closeEmit.some((e) => e[0] === false)).toBe(true)
    wrapper.unmount()
  })

  it('does not set date/hours/notes when returned as null/falsy', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]
    lookups.employeesByCompany = { c1: [] }
    lookups.projectsByCompany = { c1: [] }
    lookups.tasksByCompany = { c1: [] }

    // date null, hours null, notes null
    const rows = [
      { company_id: 'c1', employee_id: null, project_id: null, task_id: null, date: null, hours: null, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 4 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    // date, hours, notes should NOT be set on row
    expect(emitted[0][0].row.date).toBeUndefined()
    expect(emitted[0][0].row.hours).toBeUndefined()
    expect(emitted[0][0].row.notes).toBeUndefined()
    wrapper.unmount()
  })

  it('emits apply with unmatched employee/project/task when no company was resolved', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [] // company not found → compId will be undefined

    // employee_id/project_id/task_id returned but no company_id → all unmatched via empty list
    const rows = [
      { company_id: null, employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 2, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 2 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    // No company_id in row → employee/project/task lists are empty → all unmatched
    expect(emitted[0][0].unmatched).toContain('employee')
    expect(emitted[0][0].unmatched).toContain('project')
    expect(emitted[0][0].unmatched).toContain('task')
    wrapper.unmount()
  })

  it('emits apply with unmatched fields when IDs do not resolve in lookups', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]
    lookups.employeesByCompany = { c1: [] }
    lookups.projectsByCompany = { c1: [] }
    lookups.tasksByCompany = { c1: [] }

    const rows = [
      { company_id: 'c1', employee_id: 'e-unknown', project_id: 'p-unknown', task_id: 't-unknown', date: '2026-05-01', hours: 2, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 2 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].unmatched).toContain('employee')
    expect(emitted[0][0].unmatched).toContain('project')
    expect(emitted[0][0].unmatched).toContain('task')
    expect(emitted[0][0].row.company_id).toBe('c1')
    expect(emitted[0][0].row.employee_id).toBeUndefined()
    wrapper.unmount()
  })

  it('emits apply with unmatched company when company ID not in lookups', async () => {
    const lookups = useLookupsStore()
    lookups.companies = []

    const rows = [
      { company_id: 'c-unknown', employee_id: null, project_id: null, task_id: null, date: '2026-05-01', hours: 3, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 3 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].unmatched).toContain('company')
    wrapper.unmount()
  })

  it('shows error banner on API failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 4 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(q('[data-test="ai-entry-error"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-error"]')!.textContent).toContain('Unable to parse')
    wrapper.unmount()
  })

  it('submit button is disabled while loading', async () => {
    let resolvePost!: (v: unknown) => void
    mockPost.mockReturnValueOnce(new Promise((r) => { resolvePost = r }) as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 4 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await wrapper.vm.$nextTick()

    expect((q('[data-test="ai-entry-submit"]') as HTMLButtonElement).disabled).toBe(true)

    resolvePost({ data: { rows: [] } })
    await new Promise((r) => setTimeout(r, 10))
    wrapper.unmount()
  })

  it('cancel button emits update:modelValue false', async () => {
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    clickBody('[data-test="ai-entry-cancel"]')
    const emitted = wrapper.emitted('update:modelValue') as boolean[][]
    expect(emitted.some((e) => e[0] === false)).toBe(true)
    wrapper.unmount()
  })

  it('clicking backdrop (overlay) closes the dialog', async () => {
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    const overlay = q('[data-test="ai-entry-dialog"]') as HTMLElement
    overlay.click()
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('update:modelValue') as boolean[][]
    expect(emitted.some((e) => e[0] === false)).toBe(true)
    wrapper.unmount()
  })

  it('uses empty fallback when lookup map key absent after load (??[] branch)', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [{ id: 'c1', name: 'Acme' }]
    // Map keys absent — loadEmployees/loadProjects/loadTasks are mocked as no-ops so keys stay absent
    lookups.employeesByCompany = {}
    lookups.projectsByCompany = {}
    lookups.tasksByCompany = {}
    // Make the load functions no-ops so the ?? [] fallback is reached
    vi.spyOn(lookups, 'loadEmployees').mockResolvedValue()
    vi.spyOn(lookups, 'loadProjects').mockResolvedValue()
    vi.spyOn(lookups, 'loadTasks').mockResolvedValue()

    const rows = [
      { company_id: 'c1', employee_id: 'e-x', project_id: 'p-x', task_id: 't-x', date: '2026-05-01', hours: 1, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 1 hour')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    // empList/projList/taskList all use ?? [] since keys absent → all unmatched
    expect(emitted[0][0].unmatched).toContain('employee')
    expect(emitted[0][0].unmatched).toContain('project')
    expect(emitted[0][0].unmatched).toContain('task')
    wrapper.unmount()
  })

  it('handles missing data.rows key gracefully (uses empty array fallback)', async () => {
    // data.rows undefined → ?? [] fallback branch
    mockPost.mockResolvedValueOnce({ data: {} } as never)
    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 4 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    expect(q('[data-test="ai-entry-error"]')).not.toBeNull()
    expect(q('[data-test="ai-entry-error"]')!.textContent).toContain('Unable to parse')
    wrapper.unmount()
  })

  it('handles employee/project/task with no company resolved (uses empty list branch)', async () => {
    const lookups = useLookupsStore()
    lookups.companies = [] // company_id null → company block skipped, row.company_id stays undefined

    // employee/project/task IDs present but no company → row.company_id is undefined → ternary uses []
    const rows = [
      { company_id: null, employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 2, notes: 'x' },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiEntryDialog, { props: { modelValue: true }, attachTo: document.body })
    await setBodyValue('[data-test="ai-entry-textarea"]', 'Alice worked 2 hours')
    clickBody('[data-test="ai-entry-submit"]')
    await new Promise((r) => setTimeout(r, 10))

    const emitted = wrapper.emitted('apply') as Array<[{ row: Record<string, unknown>; unmatched: string[] }]>
    expect(emitted).toBeTruthy()
    expect(emitted[0][0].unmatched).toContain('employee')
    expect(emitted[0][0].unmatched).toContain('project')
    expect(emitted[0][0].unmatched).toContain('task')
    wrapper.unmount()
  })
})
