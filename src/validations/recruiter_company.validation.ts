import { z } from "zod";

export const recruiterCompanyRequestSchema = z.object({
  company_name: z
    .string()
    .min(1, "Company name is required.")
    .max(100, "Company name must not exceed 100 characters."),
});


export const updateRecruiterCompanyRequestSchema = z.object({
    company_name: z
      .string()
      .min(1, "Company name must not be empty.")
      .max(100, "Company name must not exceed 100 characters.")
      .optional(),
  });

export const recruiterCompanyParamSchema = z.object({
    id: z
      .number()
      .int("ID must be an integer.")
      .positive("ID must be a positive number."),
  });