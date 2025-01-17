import { z } from 'zod';

export const projectApplicationRequestSchema = z.object({
  project_id: z.union([z.string(), z.number()]),
  ote: z.number().positive('OTE must be a positive number.'),
  available: z.boolean(),
  position_id: z.union([z.string(), z.number()]),
  city: z.string().min(1, 'City is required.'),
  custom_current_role: z.string().min(1, 'Custom current role is required.'),
});
