import { z } from 'zod'

export const timeEntryRowSchema = z.object({
  company_id: z.string().uuid({ message: 'Select a company' }),
  employee_id: z.string().uuid({ message: 'Select an employee' }),
  project_id: z.string().uuid({ message: 'Select a project' }),
  task_id: z.string().uuid({ message: 'Select a task' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Pick a date (YYYY-MM-DD)' }),
  hours: z
    .number({ invalid_type_error: 'Enter the number of hours worked' })
    .min(0.25, { message: 'Hours must be at least 0.25 (15 minutes)' })
    .max(24, { message: 'Hours cannot exceed 24 in a single entry' })
    .refine((v) => Number.isInteger(v * 4), {
      message: 'Hours must be in 15-minute increments (e.g. 0.25, 0.50, 0.75)',
    }),
  notes: z.string().max(1000).nullable(),
})

export type TimeEntryRow = z.infer<typeof timeEntryRowSchema>

export const timeEntryDraftSchema = timeEntryRowSchema.partial().extend({
  _id: z.string(),
})
export type TimeEntryDraft = z.infer<typeof timeEntryDraftSchema>
