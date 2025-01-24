import { z } from 'zod';

export const createProjectVisitorRequestSchema = z.object({
  project_id: z
    .number()
    .int('Project ID must be an integer.')
    .positive('Project ID must be a positive number.'),
});

export const projectVisitorParamSchema = z.object({
  projectId: z
    .number()
    .int('Project ID must be an integer.')
    .positive('Project ID must be a positive number.'),
});

export const projectIdQuerySchema = z.object({
  project_id: z
    .number()
    .int('Project ID must be an integer.')
    .positive('Project ID must be a positive number.'),
});

export const candidatesListQuerySchema = z.object({
  page: z
    .number()
    .int('Page must be an integer.')
    .positive('Page must be a positive number.')
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer.')
    .positive('Limit must be a positive number.')
    .optional(),
});

export const projectListQuerySchema = z.object({
  page: z
    .number()
    .int('Page must be an integer.')
    .positive('Page must be a positive number.')
    .optional()
    .default(1),
  limit: z
    .number()
    .int('Limit must be an integer.')
    .positive('Limit must be a positive number.')
    .optional()
    .default(10),
  title: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .refine((date) => {
      return !date || !isNaN(Date.parse(date));
    }, 'Start date must be a valid date string.'),
  status: z.enum(['published', 'draft']).optional(),
  ref: z
    .number()
    .int('Ref must be an integer.')
    .positive('Ref must be a positive number.')
    .optional(),
});

export const projectViewByUrlParamSchema = z.object({
  project_url: z
    .string()
    .min(1, 'Project URL is required.')
    .max(255, 'Project URL must not exceed 255 characters.'),
});

export const projectByIdParamSchema = z.object({
  id: z.number().int('ID must be an integer.').positive('ID must be a positive number.'),
});

export const recruiterProjectRequestSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  project_title: z.string().min(1, 'Project title is required.'),
  company_name: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  logo_type: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  ote_start: z.string().nullable().optional(),
  ote_end: z.string().nullable().optional(),
  is_ote_visible: z.string().min(1, 'OTE visibility is required.'),
  location_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  experience_type: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  existing_business_range: z.string().nullable().optional(),
  business_range: z.string().nullable().optional(),
  partnership_range: z.string().nullable().optional(),
  inbound_range: z.string().nullable().optional(),
  outbound_range: z.string().nullable().optional(),
  smb: z.string().nullable().optional(),
  midmarket: z.string().nullable().optional(),
  enterprise: z.string().nullable().optional(),
  minimum_deal_size: z.string().nullable().optional(),
  minimum_sale_cycle: z.string().nullable().optional(),
  hybrid_days: z.string().nullable().optional(),
  Industry_Works_IN: z.string().nullable().optional(),
  Industry_Sold_To: z.string().nullable().optional(),
  selectedPersona: z.string().nullable().optional(),
  territory: z.string().nullable().optional(),
  languages: z.string().nullable().optional(),
  linkedin_profile: z.string().nullable().optional(),
  minimum_salecycle_type: z.string().nullable().optional(),
  timeline: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  elevator_pitch: z.string().nullable().optional(),
  office_address: z.string().nullable().optional(),
  travel_requirement_percentage: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  currency_country: z.string().nullable().optional(),
  is_travel_requirements: z.string().nullable().optional(),
  report_to: z.string().nullable().optional(),
  hiring_process: z.string().nullable().optional(),
  growth_opportunities: z.string().nullable().optional(),
  project_custom_url: z.string().nullable().optional(),
  company_id: z.string().nullable().optional(),
  company_elevator_pitch: z.string().nullable().optional(),
  main_problem: z.string().nullable().optional(),

  company: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  company_logo_url: z.string().nullable().optional(),
  company_website_url: z.string().nullable().optional(),
  company_domain: z.string().nullable().optional(),
});

export const projectRankingQuerySchema = z.object({
  min_experience: z.string().optional(),
});
