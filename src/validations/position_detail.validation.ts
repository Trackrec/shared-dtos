import { z } from 'zod';

const positionDtoSchema = z.object({
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

const companyDtoSchema = z.object({
  logo_url: z.string().nullable(),
  name: z.string(),
  domain: z.string().nullable(),
  website_url: z.string().nullable(),
  company_id: z.string().nullable(),
});

export const createPositionDetailsSchema = z
  .object({
    id: z.string(),
    position_id: z.string().or(z.number()).nullable(),
    is_leadership: z.boolean().nullable(),
    is_individual_contributor: z.boolean().nullable(),
    segment_id: z.number().nullable(),
    revenue_generated: z.number().nullable(),
    is_booking_meeting: z.boolean().nullable(),
    meeting_booked: z.number().nullable(),
    sold_to_ids: z.array(z.string()).nullable(),
    segment_smb: z.string().or(z.number()).nullable(),
    segment_mid_market: z.string().or(z.number()).nullable(),
    segment_enterprise: z.string().or(z.number()).nullable(),
    worked_in_ids: z.array(z.string()).nullable(),
    short_sales_cycle: z.string().or(z.number()).nullable(),
    average_sales_cycle: z.string().or(z.number()).nullable(),
    long_sales_cycle: z.string().or(z.number()).nullable(),
    short_sales_cycle_duration:z.string().or(z.number()).nullable(),
    average_sales_cycle_duration: z.string().or(z.number()).nullable(),
    long_sales_cycle_duration: z.string().or(z.number()).nullable(),
    disable_prospecting: z.boolean().nullable(),
    notable_clients: z.array(z.object({})).nullable(),
    management: z.array(z.string()).nullable(),
    persona: z.array(z.string()).nullable(),
    achievements: z.array(z.string()).nullable(),
    quota_achievements: z.string().or(z.number()).nullable(),
    people_rolling_up: z.string().or(z.number()).nullable(),
    average_booked_meeting: z.string().or(z.number()).nullable(),
    linkedin_percentage: z.string().or(z.number()).nullable(),
    email_percentage: z.string().or(z.number()).nullable(),
    cold_call_percentage: z.string().or(z.number()).nullable(),
    tradeshow_percentage: z.string().or(z.number()).nullable(),
    is_prospecting_channel_relevant: z.boolean().nullable(),
    refferals_percentage: z.string().or(z.number()).nullable(),
    short_deal_size: z.string().or(z.number()).nullable(),
    average_deal_size: z.string().or(z.number()).nullable(),
    new_business: z.string().or(z.number()).nullable(),
    existing_business: z.string().or(z.number()).nullable(),
    partnership: z.string().or(z.number()).nullable(),
    outbound: z.string().or(z.number()).nullable(),
    inbound: z.string().or(z.number()).nullable(),
    long_deal_size: z.string().or(z.number()).nullable(),
    worked_in: z.array(z.string()).nullable(),
    sold_to: z.array(z.string()).nullable(),
    territories: z.array(z.string()).nullable(),
    created_at: z.date().nullable(),
    updated_at: z.date().nullable(),
    position: positionDtoSchema.optional(),
    company_id: z.string().nullable(),
    company: z.string().nullable(),
    domain: z.string().nullable(),
    logo_url: z.string().nullable(),
    website_url: z.string().nullable(),
    positionData: z
      .object({
        role: z.string(),
        start_month: z.number().nullable(),
        start_year: z.number().nullable(),
        end_month: z.number().nullable(),
        end_year: z.number().nullable(),
        company: companyDtoSchema.optional(),
      })
      .optional(),
    companyData: z
      .object({
        logo_url: z.string().nullable().optional(),
        name: z.string().optional(),
        domain: z.string().nullable().optional(),
        website_url: z.string().nullable().optional(),
        company_id: z.string().nullable().optional(),
      })
      .optional(),
  })
  .partial();


export const positionDetailsByIdSchema = z.object({
  position_id: z
    .string()
    .regex(/^\d+$/, 'Position ID must be a positive integer in string format.')
    .refine((val) => parseInt(val, 10) > 0, {
      message: 'Position ID must be a positive number.',
    }),
});
