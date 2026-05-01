import { z } from 'zod'
export const employeeSchema = z.object({ id: z.string().uuid(), name: z.string(), email: z.string().email() })
