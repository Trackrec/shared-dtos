import { CompanyDto } from './company.dto';
import { PositionDto } from './position.dto';

export interface PositionDetailsDto {
  id: string;
  positionId: string | null;
  isLeadership: boolean | null;
  isNonSales: boolean | null;
  isIndividualContributor: boolean | null;
  segmentId: number | null;
  revenueGenerated: number | null;
  isBookingMeeting: boolean | null;
  meetingBooked: number | null;
  segmentSmb: number | null;
  segmentMidMarket: number | null;
  segmentEnterprise: number | null;
  shortSalesCycle: string | null;
  averageSalesCycle: string | null;
  longSalesCycle: string | null;
  shortSalesCycleDuration: string | null;
  averageSalesCycleDuration: string | null;
  longSalesCycleDuration: string | null;
  disableProspecting: boolean | null;
  notableClients: object[] | null;
  management: string[] | null;
  persona: string[] | null;
  achievements: string[] | null;
  quotaAchievements: number | null;
  peopleRollingUp: number | null;
  peopleReportingMe: number | null;
  averageBookedMeeting: number | null;
  linkedinPercentage: number | null;
  emailPercentage: number | null;
  coldCallPercentage: number | null;
  tradeshowPercentage: number | null;
  isProspectingChannelRelevant: boolean;
  refferalsPercentage: number | null;
  shortDealSize: number | null;
  averageDealSize: number | null;
  newBusiness: number | null;
  existingBusiness: number | null;
  partnership: number | null;
  softwareProductType: number | null;
  hardwareProductType: number | null;
  serviceProductType: number | null;
  outbound: number | null;
  inbound: number | null;
  longDealSize: number | null;
  workedIn: string[] | null;
  soldTo: string[] | null;
  territories: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  position: PositionDto;
  location: string | null;
  locationPlaceId: string | null,
  locationCityId: number | null
  /**
   * The currency this role's money fields are recorded in, spelled out.
   *
   * ADDED BECAUSE THE DEAL-SIZE COHORT NEEDED IT. That query pooled every
   * currency, so a 50,000 deal ranked against 50,000 of anything. The entity
   * has carried this column all along and PositionDetailsRequestDto below
   * already declares it; this interface simply did not, so the one caller that
   * needed it could not see it.
   *
   * Prefer this over `currency`, which holds a SYMBOL and defaults to $. USD
   * and CAD both print $ and differ by about a third, and they are the two
   * geographies the product targets, so the symbol cannot separate them.
   */
  currencyCountry: string | null;
}

interface NotableClient {
  id: string | null;
  logoUrl: string | null;
  label: string | null;
  value: string | null;
  websiteUrl: string | null;
}

export interface PositionDetailsRequestDto {
  id: string;
  positionId: string | null;
  isLeadership: boolean | null;
  isNonSales: boolean | null;
  isIndividualContributor: boolean | null;
  currency: string | null;
  currencyCountry: string | null;
  segmentId: number | null;
  revenueGenerated: number | null;
  isBookingMeeting: boolean | null;
  meetingBooked: number | null;
  segmentSmb: number | null;
  segmentMidMarket: number | null;
  segmentEnterprise: number | null;
  shortSalesCycle: string | null;
  averageSalesCycle: string | null;
  longSalesCycle: string | null;
  shortSalesCycleDuration: string | null;
  averageSalesCycleDuration: string | null;
  longSalesCycleDuration: string | null;
  disableProspecting: boolean | null;
  notableClients: NotableClient[] | null;
  management: string[] | null;
  persona: string[] | null;
  achievements: string[] | null;
  quotaAchievements: number | null;
  peopleRollingUp: number | null;
  peopleReportingMe: number | null;
  averageBookedMeeting: number | null;
  linkedinPercentage: number | null;
  emailPercentage: number | null;
  coldCallPercentage: number | null;
  tradeshowPercentage: number | null;
  isProspectingChannelRelevant: boolean;
  refferalsPercentage: number | null;
  shortDealSize: number | null;
  averageDealSize: number | null;
  newBusiness: number | null;
  existingBusiness: number | null;
  partnership: number | null;
  softwareProductType: number | null;
  hardwareProductType: number | null;
  serviceProductType: number | null;
  outbound: number | null;
  inbound: number | null;
  longDealSize: number | null;
  workedIn: string[] | null;
  soldTo: string[] | null;
  territories: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  position: PositionDto;

  companyId: string;
  company: string;
  domain: string;
  logoUrl: string;
  websiteUrl: string;
  linkedinUrl: string;

  positionData?: {
    role: string;
    startMonth: number | null;
    startYear: number | null;
    endMonth: number | null;
    endYear: number | null;
    company: CompanyDto;
    details: PositionDetailsDto;
  };

  companyData?: {
    logoUrl: string | null;
    name: string;
    domain?: string | null;
    websiteUrl?: string | null;
    companyId?: string | null;
  };

  location: string | null;
  locationPlaceId: string | null;
}

export interface PositionDetailsResponseDto {
  error: boolean;
  message?: string;
  data?: PositionDetailsDto;
}

export interface PositionDetailParamDto {
  positionId: string;
}
