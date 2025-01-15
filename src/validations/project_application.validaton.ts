import { z } from 'zod';

export const projectApplicationRequestSchema = z.object({
  project_id: z
    .number()
    .int('Project ID must be an integer.')
    .positive('Project ID must be a positive number.'),
  ote: z.number().positive('OTE must be a positive number.'),
  available: z.boolean(),
  position_id: z
    .number()
    .int('Position ID must be an integer.')
    .positive('Position ID must be a positive number.'),
  city: z.string().min(1, 'City is required.'),
  custom_current_role: z.string().min(1, 'Custom current role is required.'),
});
