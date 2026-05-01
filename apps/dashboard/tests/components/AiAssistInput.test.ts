import { describe, it, expect, vi, beforeEach } from 'vitest'
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
import { useDraftEntriesStore } from '@/stores/draftEntries'
import AiAssistInput from '@/components/AiAssistInput.vue'

const mockPost = vi.mocked(api.post)

describe('AiAssistInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders nothing when enabled prop is false (default in test env)', () => {
    const wrapper = mount(AiAssistInput)
    expect(wrapper.find('[data-test="ai-assist"]').exists()).toBe(false)
  })

  it('renders when enabled prop is true', () => {
    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    expect(wrapper.find('[data-test="ai-assist"]').exists()).toBe(true)
  })

  it('parse button is shown with correct text when not loading', () => {
    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    expect(wrapper.find('[data-test="ai-parse-btn"]').text()).toBe('Parse')
  })

  it('parse() does nothing when text is empty', async () => {
    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('parse() calls api.post with text and populates drafts', async () => {
    const drafts = useDraftEntriesStore()
    const rows = [
      { company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 2, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('Alice worked 2h on project p1')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(mockPost).toHaveBeenCalledWith('/time-entries/parse', { text: 'Alice worked 2h on project p1' })
    expect(drafts.rows).toHaveLength(1)
  })

  it('parse() clears text after successful parse with rows', async () => {
    const rows = [{ company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 2, notes: null }]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('some text')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect((wrapper.find('[data-test="ai-text"]').element as HTMLTextAreaElement).value).toBe('')
  })

  it('parse() shows error message when no rows returned', async () => {
    mockPost.mockResolvedValueOnce({ data: { rows: [] } } as never)

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('nothing useful')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="ai-error"]').text()).toBe('AI could not extract any rows. Add manually.')
  })

  it('parse() shows error on API failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('some text')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="ai-error"]').text()).toBe('AI parsing failed.')
  })

  it('parse() resets loading to false after completion', async () => {
    mockPost.mockResolvedValueOnce({ data: { rows: [] } } as never)

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('text')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    // After completion, button should not be disabled
    expect((wrapper.find('[data-test="ai-parse-btn"]').element as HTMLButtonElement).disabled).toBe(false)
  })

  it('parse() adds multiple rows from AI result', async () => {
    const drafts = useDraftEntriesStore()
    const rows = [
      { company_id: 'c1', employee_id: 'e1', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 2, notes: null },
      { company_id: 'c1', employee_id: 'e2', project_id: 'p1', task_id: 't1', date: '2026-05-01', hours: 3, notes: null },
    ]
    mockPost.mockResolvedValueOnce({ data: { rows } } as never)

    const wrapper = mount(AiAssistInput, { props: { enabled: true } })
    await wrapper.find('[data-test="ai-text"]').setValue('Alice and Bob worked on project')
    await wrapper.find('[data-test="ai-parse-btn"]').trigger('click')
    await new Promise((r) => setTimeout(r, 10))

    expect(drafts.rows).toHaveLength(2)
  })
})
