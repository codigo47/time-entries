import { z } from 'zod'

export const timeEntryRowSchema = z.object({
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hours: z.number().min(0.25).max(24).refine((v) => Number.isInteger(v * 4), {
    message: 'Hours must be in 0.25 increments',
  }),
  notes: z.string().max(1000).nullable(),
})

export type TimeEntryRow = z.infer<typeof timeEntryRowSchema>

export const timeEntryDraftSchema = timeEntryRowSchema.partial().extend({
  _id: z.string(),
})
export type TimeEntryDraft = z.infer<typeof timeEntryDraftSchema>
