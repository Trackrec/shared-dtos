import { z } from "zod";

export const createPositionRequestSchema = z.object({
  company_id: z.string().nonempty("Company ID is required."),
  company_name: z.string().nonempty("Company name is required."),
  end_month: z
    .number()
    .int()
    .min(1, "End month must be between 1 and 12.")
    .max(12, "End month must be between 1 and 12."),
  end_year: z.number().int().min(1900, "End year must be a valid year."),
  start_month: z
    .number()
    .int()
    .min(1, "Start month must be between 1 and 12.")
    .max(12, "Start month must be between 1 and 12."),
  start_year: z.number().int().min(1900, "Start year must be a valid year."),
  logo_url: z.string().url("Logo URL must be a valid URL.").nullable().optional(),
  role: z.string().nonempty("Role is required."),
  website_url: z.string().url("Website URL must be a valid URL.").nullable().optional(),
  working_here: z.boolean(),
  domain: z.string().nullable().optional(),
});


export const getPositionByIdSchema = z.object({
  id: z
    .number()
    .int("Position ID must be an integer.")
    .positive("Position ID must be a positive number."),
});

export const updatePositionSchema = createPositionRequestSchema.partial();