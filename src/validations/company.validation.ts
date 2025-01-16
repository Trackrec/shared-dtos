import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required.")
    .max(100, "Company name must not exceed 100 characters."),
  company_id: z
    .string()
    .nullable()
    .optional(),
  domain: z
    .string()
    .nullable()
    .optional(),
  logo_url: z
    .string()
    .url("Logo URL must be a valid URL.")
    .nullable()
    .optional(),
  website_url: z
    .string()
    .url("Website URL must be a valid URL.")
    .nullable()
    .optional(),
});


export const companyUpdateSchema = createCompanySchema.optional()
export const companyByIdSchema = z.object({
    id: z
      .string()
      .min(1, "ID is required.")
      .max(50, "ID must not exceed 50 characters."),
  });

export const searchCompanyParamSchema = z.object({
    company_name: z
      .string()
      .min(1, "Company name is required.")
      .max(100, "Company name must not exceed 100 characters."),
  });