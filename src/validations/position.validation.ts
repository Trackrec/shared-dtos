import { z } from 'zod';

export const createPositionRequestSchema = z.object({
  company_id: z.string().nonempty('Company ID is required.'),
  company_name: z.string().nonempty('Company name is required.'),
  end_month: z
    .number()
    .int()
    .min(1, 'End month must be between 1 and 12.')
    .max(12, 'End month must be between 1 and 12.').nullable(),
  end_year: z.number().int().min(1900, 'End year must be a valid year.').nullable(),
  start_month: z
    .number()
    .int()
    .min(1, 'Start month must be between 1 and 12.')
    .max(12, 'Start month must be between 1 and 12.'),
  start_year: z.number().int().min(1900, 'Start year must be a valid year.'),
  logo_url: z.string().url('Logo URL must be a valid URL.').nullable().optional(),
  role: z.string().nonempty('Role is required.'),
  website_url: z.string().url('Website URL must be a valid URL.').nullable().optional(),
  working_here: z.boolean(),
  domain: z.string().nullable().optional(),
});

export const positionByIdSchema = z.object({
  id: z
    .number()
    .int('Position ID must be an integer.')
    .positive('Position ID must be a positive number.'),
});

export const updatePositionSchema = createPositionRequestSchema.partial();

export const verifyPositionRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address.'),
  first_name: z
    .string()
    .min(1, 'First name is required.')
    .max(50, 'First name must not exceed 50 characters.'),
  last_name: z
    .string()
    .min(1, 'Last name is required.')
    .max(50, 'Last name must not exceed 50 characters.'),
  positionId: z.string().or(z.number()),
  requestBy: z.string().or(z.number()),
  role: z.string().min(1, 'Role is required.').max(50, 'Role must not exceed 50 characters.'),
});

export const resendPositionVerificationEmailRequestSchema = z.object({
  requestId: z.union([z.string(), z.number()]),
});

export const changeVerificationRequestSchema = z.object({
  request_id: z.union([z.string(), z.number()]),
  status: z.string().min(1, 'Status is required.').max(50, 'Status must not exceed 50 characters.'),
});

export const updateUserIdRequestSchema = z.object({
  request_token: z
    .string()
    .min(1, 'Request token is required.')
    .max(255, 'Request token must not exceed 255 characters.'),
});

export const deleteVerificationSchema = z.object({
  request_id: z.union([z.string(), z.number()]),
});
