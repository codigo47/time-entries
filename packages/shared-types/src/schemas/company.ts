import { z } from 'zod'
export const companySchema = z.object({ id: z.string().uuid(), name: z.string() })
