import { z } from "zod";

const PositionDtoSchema = z.object({
  role: z.string(),
  start_month: z.number().nullable(),
  start_year: z.number().nullable(),
  end_month: z.number().nullable(),
  end_year: z.number().nullable(),
  company: z.object({
    logo_url: z.string().nullable(),
    name: z.string(),
    domain: z.string().nullable(),
    website_url: z.string().nullable(),
    company_id: z.string().nullable(),
  }),
});

const CompanyDtoSchema = z.object({
  logo_url: z.string().nullable(),
  name: z.string(),
  domain: z.string().nullable(),
  website_url: z.string().nullable(),
  company_id: z.string().nullable(),
});

export const createPositionDetailsSchema = z.object({
  id: z.string(),
  position_id: z.string().nullable(),
  is_leadership: z.boolean().nullable(),
  is_individual_contributor: z.boolean().nullable(),
  segment_id: z.number().nullable(),
  revenue_generated: z.number().nullable(),
  is_booking_meeting: z.boolean().nullable(),
  meeting_booked: z.number().nullable(),
  sold_to_ids: z.array(z.string()).nullable(),
  segment_smb: z.number().nullable(),
  segment_mid_market: z.number().nullable(),
  segment_enterprise: z.number().nullable(),
  worked_in_ids: z.array(z.string()).nullable(),
  short_sales_cycle: z.string().nullable(),
  average_sales_cycle: z.string().nullable(),
  long_sales_cycle: z.string().nullable(),
  short_sales_cycle_duration: z.string().nullable(),
  average_sales_cycle_duration: z.string().nullable(),
  long_sales_cycle_duration: z.string().nullable(),
  disable_prospecting: z.boolean().nullable(),
  notable_clients: z.array(z.object({})).nullable(), 
  management: z.array(z.string()).nullable(),
  persona: z.array(z.string()).nullable(),
  achievements: z.array(z.string()).nullable(),
  quota_achievements: z.number().nullable(),
  people_rolling_up: z.number().nullable(),
  average_booked_meeting: z.number().nullable(),
  linkedin_percentage: z.number().nullable(),
  email_percentage: z.number().nullable(),
  cold_call_percentage: z.number().nullable(),
  tradeshow_percentage: z.number().nullable(),
  is_prospecting_channel_relevant: z.boolean(),
  refferals_percentage: z.number().nullable(),
  short_deal_size: z.number().nullable(),
  average_deal_size: z.number().nullable(),
  new_business: z.number().nullable(),
  existing_business: z.number().nullable(),
  partnership: z.number().nullable(),
  outbound: z.number().nullable(),
  inbound: z.number().nullable(),
  long_deal_size: z.number().nullable(),
  worked_in: z.array(z.string()).nullable(),
  sold_to: z.array(z.string()).nullable(),
  territories: z.array(z.string()).nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  position: PositionDtoSchema,
  company_id: z.string(),
  company: z.string(),
  domain: z.string(),
  logo_url: z.string(),
  website_url: z.string(),
  positionData: z
    .object({
      role: z.string(),
      start_month: z.number().nullable(),
      start_year: z.number().nullable(),
      end_month: z.number().nullable(),
      end_year: z.number().nullable(),
      company: CompanyDtoSchema,
    })
    .optional(),
  companyData: z
    .object({
      logo_url: z.string().nullable(),
      name: z.string(),
      domain: z.string().nullable(),
      website_url: z.string().nullable(),
      company_id: z.string().nullable(),
    })
    .optional(),
});


export const positionDetailsByIdSchema = z.object({
    position_id: z
      .string()
      .regex(/^\d+$/, "Position ID must be a positive integer in string format.")
      .refine((val) => parseInt(val, 10) > 0, {
        message: "Position ID must be a positive number.",
      }),
  });
  