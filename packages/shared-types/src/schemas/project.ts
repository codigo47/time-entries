import { z } from 'zod'
export const projectSchema = z.object({ id: z.string().uuid(), company_id: z.string().uuid(), name: z.string() })
