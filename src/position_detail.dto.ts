import { CompanyDto } from "./company.dto";
import { PositionDto } from "./Position.dto";

export interface PositionDetailsDto {
    id: string;
    position_id: string | null;
    is_leadership: boolean | null;
    is_individual_contributor: boolean | null;
    segment_id: number | null;
    revenue_generated: number | null;
    is_booking_meeting: boolean | null;
    meeting_booked: number | null;
    sold_to_ids: string[] | null;
    segment_smb: number | null;
    segment_mid_market: number | null;
    segment_enterprise: number | null;
    worked_in_ids: string[] | null;
    short_sales_cycle: string | null;
    average_sales_cycle: string | null;
    long_sales_cycle: string | null;
    short_sales_cycle_duration: string | null;
    average_sales_cycle_duration: string | null;
    long_sales_cycle_duration: string | null;
    disable_prospecting: boolean | null;
    notable_clients: Object[] | null; 
    management: string[] | null;
    persona: string[] | null;
    achievements: string[] | null;
    quota_achievements: number | null;
    people_rolling_up: number | null;
    average_booked_meeting: number | null;
    linkedin_percentage: number | null;
    email_percentage: number | null;
    cold_call_percentage: number | null;
    tradeshow_percentage: number | null;
    is_prospecting_channel_relevant: boolean;
    refferals_percentage: number | null;
    short_deal_size: number | null;
    average_deal_size: number | null;
    new_business: number | null;
    existing_business: number | null;
    partnership: number | null;
    outbound: number | null;
    inbound: number | null;
    long_deal_size: number | null;
    worked_in: string[] | null;
    sold_to: string[] | null;
    territories: string[] | null;
    created_at: Date;
    updated_at: Date;
    position: PositionDto; 
  }
  


  export interface PositionDetailsRequestDto  {
    id: string;
    position_id: string | null;
    is_leadership: boolean | null;
    is_individual_contributor: boolean | null;
    segment_id: number | null;
    revenue_generated: number | null;
    is_booking_meeting: boolean | null;
    meeting_booked: number | null;
    sold_to_ids: string[] | null;
    segment_smb: number | null;
    segment_mid_market: number | null;
    segment_enterprise: number | null;
    worked_in_ids: string[] | null;
    short_sales_cycle: string | null;
    average_sales_cycle: string | null;
    long_sales_cycle: string | null;
    short_sales_cycle_duration: string | null;
    average_sales_cycle_duration: string | null;
    long_sales_cycle_duration: string | null;
    disable_prospecting: boolean | null;
    notable_clients: Object[] | null; 
    management: string[] | null;
    persona: string[] | null;
    achievements: string[] | null;
    quota_achievements: number | null;
    people_rolling_up: number | null;
    average_booked_meeting: number | null;
    linkedin_percentage: number | null;
    email_percentage: number | null;
    cold_call_percentage: number | null;
    tradeshow_percentage: number | null;
    is_prospecting_channel_relevant: boolean;
    refferals_percentage: number | null;
    short_deal_size: number | null;
    average_deal_size: number | null;
    new_business: number | null;
    existing_business: number | null;
    partnership: number | null;
    outbound: number | null;
    inbound: number | null;
    long_deal_size: number | null;
    worked_in: string[] | null;
    sold_to: string[] | null;
    territories: string[] | null;
    created_at: Date;
    updated_at: Date;
    position: PositionDto; 

    company_id: string;
    company: string;
    domain: string;
    logo_url: string;
    website_url: string;

    positionData?:{
      role: string,
      start_month: number | null,
      start_year: number | null,
      end_month: number | null,
      end_year: number | null,
      company: CompanyDto,
      details: PositionDetailsDto
    },

    companyData?:{
      logo_url: string | null,
      name: string,
      domain?: string | null,
      website_url?: string | null,
      company_id?: string | null
    }


  }
  
  export interface PositionDetailsResponseDto{
    error: boolean; 
    message?: string; 
    data?: PositionDetailsDto; 
  }