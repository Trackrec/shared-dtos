import { Injectable, Logger } from '@nestjs/common';
import { ExtendedPositionDto } from 'src/shared-dtos/src/user.dto';

@Injectable()
export class SharedService {
  private readonly logger = new Logger(SharedService.name);

  calculateExperience(
    positions: ExtendedPositionDto[],
    type: string = 'all',
    findCompleted: boolean = true,
  ) {
    this.logger.log(`Calculating experience for ${positions.length} positions with type: ${type}`);

    if (positions.length === 0) {
      this.logger.log('No positions found, returning "N/A"');
      return 'N/A';
    }

    // Sort positions by start_date before processing
    this.logger.log('Sorting positions by start date');
    positions.sort((a, b) => {
      const dateA = new Date(a.start_year, a.start_month - 1).getTime();
      const dateB = new Date(b.start_year, b.start_month - 1).getTime();
      return dateA - dateB;
    });

    let completedPositions: ExtendedPositionDto[] = findCompleted
      ? positions.filter((position) => {
          const completionPercentage = position.details
            ? this.calculateCompletionPercentage(position)
            : 0.0;
          return completionPercentage == 100.0;
        })
      : positions;

    this.logger.log(`Found ${completedPositions.length} completed positions`);

    if (type !== 'all') {
      this.logger.log(`Filtering completed positions by type: ${type}`);
      completedPositions = completedPositions.filter((position) => {
        switch (type) {
          case 'bdr':
            return position.details?.is_booking_meeting === true;
          case 'individual_contributor':
            return position.details?.is_individual_contributor === true;
          case 'leadership':
            return position.details?.is_leadership === true;
          default:
            return false;
        }
      });
      this.logger.log(
        `After filtering, ${completedPositions.length} positions match type: ${type}`,
      );
    }

    const result: { totalDays: number; maxEndDate: Date } = completedPositions.reduce(
      (acc, position) => this.calculatePositionDays(position, acc),
      { totalDays: 0, maxEndDate: null },
    );

    this.logger.log(`Total experience calculated: ${result.totalDays} days`);

    return this.calculateYearsAndMonths(result.totalDays);
  }

  calculatePositionDays(
    position: ExtendedPositionDto,
    { totalDays, maxEndDate }: { totalDays: number; maxEndDate: Date | null },
  ): { totalDays: number; maxEndDate: Date } {
    const startDate: Date = new Date(position.start_year, position.start_month - 1, 1);

    const endDate: Date =
      position.end_year && position.end_month
        ? new Date(position.end_year, position.end_month - 1, 1)
        : new Date();

    this.logger.log(
      `Calculating days for position with start date: ${startDate.toISOString()} and end date: ${endDate.toISOString()}`,
    );

    let daysToAdd: number;

    if (maxEndDate === null || startDate >= maxEndDate) {
      // Include all days for the position
      daysToAdd = Math.max(
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        0,
      );
      this.logger.log(`No max end date, adding ${daysToAdd} days for position.`);
    } else {
      // Include only days after the previous max end date
      const maxEndDateDiff = Math.max(
        Math.ceil((startDate.getTime() - maxEndDate.getTime()) / (1000 * 60 * 60 * 24)),
        0,
      );
      daysToAdd = Math.max(
        Math.ceil((endDate.getTime() - maxEndDate.getTime()) / (1000 * 60 * 60 * 24)) -
          maxEndDateDiff +
          1,
        0,
      );
      this.logger.log(`Adding ${daysToAdd} days for position based on max end date.`);
    }

    const newTotalDays = totalDays + daysToAdd;
    this.logger.log(
      `Updated total days: ${newTotalDays}, with new max end date: ${endDate.toISOString()}`,
    );

    return { totalDays: newTotalDays, maxEndDate: endDate };
  }

  calculateYearsAndMonths(diff: number): string {
    this.logger.log(`Calculating years and months from diff: ${diff} days`);

    const years = Math.floor(diff / 365);
    const remainingDays = diff % 365;

    const months = Math.floor(remainingDays / 30.44); // Average number of days in a month

    this.logger.log(`Calculated years: ${years}, months: ${months}`);

    if (years > 0 && months === 0) {
      this.logger.log(`Returning: ${years} yrs`);
      return `${years} yrs`;
    } else if (years > 0 && months > 0) {
      this.logger.log(`Returning: ${years} yrs, ${months} mo`);
      return `${years} yrs, ${months} mo`;
    } else if (months > 0) {
      this.logger.log(`Returning: ${months} mo`);
      return `${months} mo`;
    } else {
      this.logger.log(`Returning: N/A`);
      return 'N/A';
    }
  }

  calculateCompletionPercentage(position: ExtendedPositionDto): number {
    this.logger.log(`Calculating completion percentage for position with ID: ${position.id}`);

    let totalFields = 0;
    let filledFields = 0;

    if (position.details.is_leadership) {
      this.logger.log('Position is leadership role, setting totalFields to 21');
      totalFields = 21;
      filledFields = this.calculateIsLeadershipFields(position);
    } else if (position.details.is_individual_contributor) {
      this.logger.log('Position is individual contributor role, setting totalFields to 20');
      totalFields = 20;
      filledFields = this.calculateIsIndividualContributerFields(position);
    } else if (position.details.is_booking_meeting) {
      this.logger.log('Position is booking meeting role, setting totalFields to 15');
      totalFields = 15;
      filledFields = this.calculateIsBookingMeetingFields(position);
    }

    this.logger.log(`Total fields: ${totalFields}, Filled fields: ${filledFields}`);

    const completionPercentage: number =
      filledFields == 0 ? 0.0 : parseFloat(((filledFields * 100) / totalFields).toFixed(2));

    this.logger.log(`Calculated completion percentage: ${completionPercentage}%`);

    return completionPercentage;
  }

  calculateIsBookingMeetingFields(position: ExtendedPositionDto): number {
    let totalFilled = 1;

    const positionFields: string[] = ['company', 'role'];

    positionFields.forEach((field) => {
      if (position[field]) {
        totalFilled++;
      }
    });

    // Define fields that contribute 1 to the count
    const fieldsToCount1 = ['quota_achievements', 'average_booked_meeting', 'revenue_generated'];

    const arrayFields = ['worked_in', 'sold_to', 'persona', 'territories'];

    arrayFields.forEach((field) => {
      if (position.details[field] && position.details[field].length > 0) {
        totalFilled++;
      }
    });

    // Count fields that contribute 1 to the total filled count
    fieldsToCount1.forEach((field) => {
      if (position.details[field]) {
        totalFilled++;
      }
    });

    // Check additional conditions

    if (
      Number(position.details.segment_smb) ||
      Number(position.details.segment_mid_market) ||
      Number(position.details.segment_enterprise)
    ) {
      totalFilled++;
    }

    if (Number(position.details.existing_business) || Number(position.details.new_business)) {
      totalFilled++;
    }

    if (Number(position.start_month) && Number(position.start_year)) {
      totalFilled++;
    }

    if (Number(position.details.outbound) || Number(position.details.inbound)) {
      totalFilled++;
    }

    if (
      !position.details.is_prospecting_channel_relevant &&
      (Number(position.details.linkedin_percentage) ||
        Number(position.details.email_percentage) ||
        Number(position.details.cold_call_percentage) ||
        Number(position.details.tradeshow_percentage) ||
        Number(position.details.refferals_percentage))
    ) {
      totalFilled++;
    } else if (position.details.is_prospecting_channel_relevant) {
      totalFilled++;
    }

    return totalFilled;
  }

  calculateIsIndividualContributerFields(position: ExtendedPositionDto): number {
    let totalFilled = 1;

    const positionFields: string[] = ['company', 'role'];

    positionFields.forEach((field) => {
      if (position[field]) {
        totalFilled++;
      }
    });

    // Define fields that contribute 1 to the count
    const fieldsToCount1 = [
      'quota_achievements',
      'short_deal_size',
      'average_deal_size',
      'long_deal_size',
      'short_sales_cycle',
      'average_sales_cycle',
      'long_sales_cycle',
      'revenue_generated',
    ];

    const arrayFields = ['worked_in', 'sold_to', 'persona', 'territories'];

    // Count fields that contribute 1 to the total filled count
    fieldsToCount1.forEach((field) => {
      if (position.details[field]) {
        totalFilled++;
      }
    });

    arrayFields.forEach((field) => {
      if (position.details[field] && position.details[field].length > 0) {
        totalFilled++;
      }
    });

    // Check additional conditions
    if (
      Number(position.details.segment_smb) ||
      Number(position.details.segment_mid_market) ||
      Number(position.details.segment_enterprise)
    ) {
      totalFilled++;
    }

    if (Number(position.details.existing_business) || Number(position.details.new_business)) {
      totalFilled++;
    }

    if (Number(position.start_month) && Number(position.start_year)) {
      totalFilled++;
    }

    if (Number(position.details.outbound) || Number(position.details.inbound)) {
      totalFilled++;
    }

    if (
      !position.details.is_prospecting_channel_relevant &&
      (Number(position.details.linkedin_percentage) ||
        Number(position.details.email_percentage) ||
        Number(position.details.cold_call_percentage) ||
        Number(position.details.tradeshow_percentage) ||
        Number(position.details.refferals_percentage))
    ) {
      totalFilled++;
    } else if (position.details.is_prospecting_channel_relevant) {
      totalFilled++;
    }

    return totalFilled;
  }

  calculateIsLeadershipFields(position: ExtendedPositionDto): number {
    let totalFilled = 1;
    const positionFields: string[] = ['company', 'role'];

    positionFields.forEach((field) => {
      if (position[field]) {
        totalFilled++;
      }
    });

    // Define fields that contribute 1 to the count
    const detailFields = [
      'quota_achievements',
      'short_deal_size',
      'average_deal_size',
      'long_deal_size',
      'short_sales_cycle',
      'average_sales_cycle',
      'long_sales_cycle',
      'people_rolling_up',
      'revenue_generated',
    ];

    const arrayFields = ['worked_in', 'sold_to', 'persona', 'territories', 'management'];

    // Count fields that contribute 1 to the total filled count
    detailFields.forEach((field) => {
      if (position.details[field]) {
        totalFilled++;
      }
    });

    arrayFields.forEach((field) => {
      if (position.details[field] && position.details[field].length > 0) {
        totalFilled++;
      }
    });

    // Check additional conditions
    if (
      Number(position.details.segment_smb) ||
      Number(position.details.segment_mid_market) ||
      Number(position.details.segment_enterprise)
    ) {
      totalFilled++;
    }

    if (Number(position.details.existing_business) || Number(position.details.new_business)) {
      totalFilled++;
    }

    if (Number(position.start_month) && Number(position.start_year)) {
      totalFilled++;
    }

    if (Number(position.details.outbound) || Number(position.details.inbound)) {
      totalFilled++;
    }

    return totalFilled;
  }

  calculateWeightedAverageForBusiness(positions: ExtendedPositionDto[]): {
    existing_business_average: number;
    new_business_average: number;
    partnership_average: number;
  } {
    let totalWeightedExistingBusiness = 0;
    let totalWeightedNewBusiness = 0;
    let totalWeightedPartnershipBusiness = 0;
    let totalDuration = 0;

    if (!positions || positions.length === 0) {
      return { existing_business_average: 0, new_business_average: 0, partnership_average: 0 };
    }

    positions.forEach((position) => {
      const completionPercentage = position.details
        ? this.calculateCompletionPercentage(position)
        : 0.0;
      const isCompleted: boolean = completionPercentage == 100.0 ? true : false;

      if (!position.details || !isCompleted) {
        return;
      }

      const startMonth = position.start_month;
      const startYear = position.start_year;
      const endMonth = position.end_month;
      const endYear = position.end_year;
      const existingBusinessPercentage = position.details.existing_business;
      const newBusinessPercentage = position.details.new_business;
      const partnershipBusinessPercentage = position.details.partnership;

      const duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;

      const weightedExistingBusiness = existingBusinessPercentage * duration;
      const weightedNewBusiness = newBusinessPercentage * duration;
      const weightedPartnershipBusiness = partnershipBusinessPercentage * duration;

      totalWeightedExistingBusiness += weightedExistingBusiness;
      totalWeightedNewBusiness += weightedNewBusiness;
      totalWeightedPartnershipBusiness += weightedPartnershipBusiness;
    });

    if (totalDuration === 0) {
      return { existing_business_average: 0, new_business_average: 0, partnership_average: 0 };
    }

    // Calculate weighted averages
    const weightedAverageExistingBusiness = totalWeightedExistingBusiness / totalDuration;
    const weightedAverageNewBusiness = totalWeightedNewBusiness / totalDuration;
    const weightedAveragePartnershipBusiness = totalWeightedPartnershipBusiness / totalDuration;

    // Round the averages
    let existingBusinessAverage = Math.round(weightedAverageExistingBusiness);
    let newBusinessAverage = Math.round(weightedAverageNewBusiness);
    let partnershipAverage = Math.round(weightedAveragePartnershipBusiness);

    // Ensure the sum of averages is exactly 100
    const totalAverage = existingBusinessAverage + newBusinessAverage + partnershipAverage;

    // Adjust values if the sum is not 100
    const difference = 100 - totalAverage;

    // Distribute the difference to the segment with the largest average
    if (difference !== 0) {
      if (
        existingBusinessAverage >= newBusinessAverage &&
        existingBusinessAverage >= partnershipAverage
      ) {
        existingBusinessAverage += difference;
      } else if (
        newBusinessAverage >= existingBusinessAverage &&
        newBusinessAverage >= partnershipAverage
      ) {
        newBusinessAverage += difference;
      } else {
        partnershipAverage += difference;
      }
    }

    return {
      existing_business_average: existingBusinessAverage,
      new_business_average: newBusinessAverage,
      partnership_average: partnershipAverage,
    };
  }

  calculateDuration(
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
  ): number {
    const startDate = new Date(startYear, startMonth - 1);
    let endDate: Date;
    if (endMonth === null || endYear === null) {
      endDate = new Date();
    } else {
      endDate = new Date(endYear, endMonth - 1);
    }
    const durationInMilliseconds = endDate.getTime() - startDate.getTime();
    const durationInMonths = durationInMilliseconds / (1000 * 60 * 60 * 24 * 30);
    return durationInMonths;
  }

  calculateWeightedAverageForOutbound(positions: ExtendedPositionDto[]) {
    let totalWeightedOutbound = 0;
    let totalWeightedInbound = 0;
    let totalDuration = 0;

    if (!positions || positions.length === 0) {
      return { outbound_average: 0, inbound_average: 0 };
    }

    positions.forEach((position) => {
      const completionPercentage = position.details
        ? this.calculateCompletionPercentage(position)
        : 0.0;
      const isCompleted: boolean = completionPercentage == 100.0 ? true : false;

      if (!position.details || !isCompleted) {
        return;
      }

      const startMonth = position.start_month;
      const startYear = position.start_year;
      const endMonth = position.end_month;
      const endYear = position.end_year;
      const outboundPercentage = position.details.outbound;
      const inboundPercentage = position.details.inbound;

      const duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;

      const weightedOutbound = outboundPercentage * duration;
      const weightedInbound = inboundPercentage * duration;

      totalWeightedOutbound += weightedOutbound;
      totalWeightedInbound += weightedInbound;
    });

    if (totalDuration === 0) {
      return { outbound_average: 0, inbound_average: 0 };
    }

    // Calculate weighted averages
    const weightedAverageOutbound = totalWeightedOutbound / totalDuration;
    const weightedAverageInbound = totalWeightedInbound / totalDuration;

    // Round the averages
    let outboundAverage = Math.round(weightedAverageOutbound);
    let inboundAverage = Math.round(weightedAverageInbound);

    // Ensure the sum of averages is exactly 100
    const totalAverage = outboundAverage + inboundAverage;

    // Adjust values if the sum is not 100
    const difference = 100 - totalAverage;

    // Distribute the difference to the larger average
    if (difference !== 0) {
      if (outboundAverage >= inboundAverage) {
        outboundAverage += difference;
      } else {
        inboundAverage += difference;
      }
    }

    return {
      outbound_average: outboundAverage,
      inbound_average: inboundAverage,
    };
  }

  calculateWeightedAverageForSegment(positions: ExtendedPositionDto[]): {
    smb_average: number;
    midmarket_average: number;
    enterprise_average: number;
  } {
    let totalSmb = 0;
    let totalMidmarket = 0;
    let totalEnterprise = 0;
    let totalDuration = 0;

    if (!positions || positions.length === 0) {
      return { smb_average: 0, midmarket_average: 0, enterprise_average: 0 };
    }

    positions.forEach((position) => {
      const completionPercentage = position.details
        ? this.calculateCompletionPercentage(position)
        : 0.0;
      const isCompleted: boolean = completionPercentage == 100.0 ? true : false;

      if (!position.details || !isCompleted) {
        return;
      }

      const startMonth = position.start_month;
      const startYear = position.start_year;
      const endMonth = position.end_month;
      const endYear = position.end_year;
      const smbPercentage = position.details.segment_smb;
      const midmarketPercentage = position.details.segment_mid_market;
      const enterprisePercentage = position.details.segment_enterprise;

      const duration = this.calculateDuration(startMonth, startYear, endMonth, endYear);
      totalDuration += duration;

      const weightedSmb = smbPercentage * duration;
      const weightedMidmarket = midmarketPercentage * duration;
      const weightedEnterprise = enterprisePercentage * duration;

      // Accumulate weighted values
      totalSmb += weightedSmb;
      totalMidmarket += weightedMidmarket;
      totalEnterprise += weightedEnterprise;
    });

    if (totalDuration === 0) {
      return { smb_average: 0, midmarket_average: 0, enterprise_average: 0 };
    }

    // Calculate weighted averages
    const weightedAverageSmb = totalSmb / totalDuration;
    const weightedAverageMidmarket = totalMidmarket / totalDuration;
    const weightedAverageEnterprise = totalEnterprise / totalDuration;

    // Round the averages
    let smbAverage = Math.round(weightedAverageSmb);
    let midMarketAverage = Math.round(weightedAverageMidmarket);
    let enterpriseAverage = Math.round(weightedAverageEnterprise);

    // Ensure the sum of averages is exactly 100
    const totalAverage = smbAverage + midMarketAverage + enterpriseAverage;

    // Adjust values if the sum is not 100
    const difference = 100 - totalAverage;

    // Distribute the difference to the segment with the largest average
    if (difference !== 0) {
      if (smbAverage >= midMarketAverage && smbAverage >= enterpriseAverage) {
        smbAverage += difference;
      } else if (midMarketAverage >= smbAverage && midMarketAverage >= enterpriseAverage) {
        midMarketAverage += difference;
      } else {
        enterpriseAverage += difference;
      }
    }

    return {
      smb_average: smbAverage,
      midmarket_average: midMarketAverage,
      enterprise_average: enterpriseAverage,
    };
  }

  groupAndSortPositions(positions: ExtendedPositionDto[]) {
    this.logger.log(`Starting to group and sort ${positions.length} positions`);

    // Step 1: Group by company object
    const groupedByCompany = new Map();

    positions.forEach((position) => {
      const company = position.company;
      const companyKey = JSON.stringify(company); // Create a unique key for the company object

      if (!groupedByCompany.has(companyKey)) {
        this.logger.log(`Grouping position for company: ${company.name}`);
        groupedByCompany.set(companyKey, { company, positions: [] });
      }

      groupedByCompany.get(companyKey).positions.push(position);
    });

    this.logger.log(`Grouped positions by company, total groups: ${groupedByCompany.size}`);

    // Step 2: Sort positions within each company by start date (descending)
    for (const group of groupedByCompany.values()) {
      group.totalExperience = this.calculateExperience(group.positions, 'all', false);
      this.logger.log(`Sorting positions for company: ${group.company.name}`);
      group.positions.sort((a, b) => {
        const isACurrent = a.end_year === null || a.end_month === null;
        const isBCurrent = b.end_year === null || b.end_month === null;

        if (isACurrent && !isBCurrent) return -1; // Current positions come first
        if (!isACurrent && isBCurrent) return 1; // Completed positions come later

        // If both are current or both are completed, sort by start date descending
        const aStartDate = new Date(a.start_year, (a.start_month || 0) - 1).getTime();
        const bStartDate = new Date(b.start_year, (b.start_month || 0) - 1).getTime();
        return bStartDate - aStartDate;
      });
    }

    this.logger.log('Positions sorted within each company');

    // Step 3: Convert Map to array and sort companies by the latest position's start date
    this.logger.log('Sorting companies by the latest position start date');
    const sortedAndGrouped = Array.from(groupedByCompany.values()).sort((a, b) => {
      const aLatestDate = new Date(
        a.positions[0].start_year,
        a.positions[0].start_month || 0,
      ).getTime();
      const bLatestDate = new Date(
        b.positions[0].start_year,
        b.positions[0].start_month || 0,
      ).getTime();
      return bLatestDate - aLatestDate;
    });

    this.logger.log(
      `Returning sorted and grouped positions for ${sortedAndGrouped.length} companies`,
    );

    return sortedAndGrouped;
  }
}
