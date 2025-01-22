import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PositionDto } from 'src/shared-dtos/src/position.dto';
import { RecruiterProjectDto } from 'src/shared-dtos/src/recruiter_project.dto';
import { configurations } from '../../config/env.config';

const { openAiApiKey } = configurations;
@Injectable()
export class RecruiterPointsService {
  private readonly logger = new Logger(RecruiterPointsService.name);

  private openAIClient: OpenAI;

  constructor() {
    // Load environment variables from .env file
    dotenv.config();
    // Initialize the OpenAI client as a class-level property
    this.openAIClient = new OpenAI({
      apiKey: openAiApiKey, // Ensure the API key is loaded from environment variables
    });
  }

  points_for_ote(userOte: number, projectOte: number): number {
    this.logger.log(`Calculating points for user_ote: ${userOte}, project_ote: ${projectOte}`);

    if (!userOte) {
      userOte = 0;
      this.logger.log('user_ote was not provided, defaulting to 0');
    }
    if (!projectOte) {
      projectOte = 0;
      this.logger.log('project_ote was not provided, defaulting to 0');
    }

    // Case when user_ote is less than or equal to project_ote
    if (userOte <= projectOte) {
      this.logger.log('user_ote is less than or equal to project_ote, returning 10 points');
      return 10; // Always return 10 points
    } else {
      // Case when user_ote is greater than project_ote
      const diff = userOte - projectOte;
      this.logger.log(`user_ote is greater than project_ote, difference is: ${diff}`);

      // Calculate points linearly between 0 to 10 based on the difference
      const points: number = 10 - (10 * diff) / userOte;
      this.logger.log(`Calculated points: ${points}`);

      // Ensure points are within the range of 0 to 10
      const finalPoints = parseFloat(Math.max(0, Math.min(10, points)).toFixed(2));
      this.logger.log(`Final points (clamped between 0 and 10): ${finalPoints}`);

      return finalPoints;
    }
  }

  async points_for_worked_in(positions: PositionDto[], industryWorksIn: string[]): Promise<number> {
    const client = this.openAIClient;

    this.logger.log(
      `Starting points calculation for industries worked in. Candidate's industries: ${JSON.stringify(positions)}, Target industries: ${JSON.stringify(industryWorksIn)}`,
    );

    const workedIn = positions.flatMap((position) => position?.details?.worked_in || []);
    this.logger.log(
      `Extracted industries from candidate's experience: ${JSON.stringify(workedIn)}`,
    );

    const prompt = `
          You are an expert at assessing job title matches. I will give you two lists:
          1. A list of industries the candidate has worked in.
          2. A list of industries required for the target role.
      
          Experience Weighting:
          Weight similar past experience more heavily if it aligns closely with the requirements of the job post, even if exact matches are not found.
      
          Your task is to compare the two lists and assign a score from 0 to 10 based on how well the candidate's experience aligns with the target industries:
          - 10: All required industries are covered.
          - 7-9: Most industries match.
          - 4-6: Some industries match.
          - 1-3: Very few industries match.
          - 0: No relevant industries match.
      
          Consider synonyms and similar roles. Provide only the score as the output. You example output will be a number from 0 to 10.
      
          Candidate's industries: ${JSON.stringify(workedIn)}
          Target industries: ${JSON.stringify(industryWorksIn)}
        `;

    this.logger.log('Prompt generated for OpenAI API: ', prompt);

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
    });

    this.logger.log('Received response from OpenAI API.');

    const result = parseInt(chatCompletion.choices[0].message.content);
    this.logger.log(`Calculated score: ${result}`);

    return result;
  }

  async points_for_sold_to(positions: PositionDto[], soldInArray: string[]): Promise<number> {
    const client = this.openAIClient;

    const soldIn = positions.flatMap((position) => position?.details?.sold_to || []);
    const prompt = `
          You are an expert at assessing job title matches. I will give you two lists:
          1. A list of industries the candidate has sold to.
          2. A list of industries required for the target role.

        Experience Weighting:
        Weight similar past experience more heavily if it aligns closely with the requirements of the job post, even if exact matches are not found.

        Recency Weighting: an experience from 1/2/3 years ago is far more significant than something from 10 years ago 

          Your task is to compare the two lists and assign a score from 0 to 10 based on how well the candidate's experience aligns with the target industries:
          - 10: All required industries are covered.
          - 7-9: Most industries match.
          - 4-6: Some industries match.
          - 1-3: Very few industries match.
          - 0: No relevant industries match.

          Consider synonyms and similar roles. Provide only the score as the output. You example output will be a number from 0 to 10.

          Candidate's industries: ${JSON.stringify(soldIn)}
          Target industries: ${JSON.stringify(soldInArray)}
            Position:${JSON.stringify(positions)}
      `;
    console.log(prompt);

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
    });
    const result = parseInt(chatCompletion.choices[0].message.content);
    return result;
  }

  async points_for_sales_cycle(
    positions: PositionDto[],
    project: RecruiterProjectDto,
  ): Promise<number> {
    const client = this.openAIClient;

    // Extract sales cycle data from positions
    const salesCycles = positions.map((position) => ({
      value: position.details.average_sales_cycle,
      // type: position.details.type || 'Unknown'
    }));

    this.logger.log(`Generated sales cycles for positions: ${JSON.stringify(salesCycles)}`);
    this.logger.log(
      `Required minimum sales cycle: ${project.minimum_sale_cycle} ${project.minimum_salecycle_type}`,
    );

    // Create the prompt for OpenAI API
    const prompt = `
            You are an expert at analyzing sales cycle compatibility. Compare:
            1. Candidate's sales cycles: ${JSON.stringify(salesCycles)}
            2. Required minimum cycle: ${project.minimum_sale_cycle} ${project.minimum_salecycle_type}
    
            Score from 0-10 based on:
            - Sales cycle length similarity
            - Business type matching (B2B/B2C)
            - Industry complexity correlation
            - Deal size implications
            
            Consider:
            - Long-cycle B2B (6+ months) vs short-cycle B2C (1-3 months)
            - Enterprise vs SMB sales patterns
            - Industry-specific cycle norms
    
            Output only the numerical score (0-10).
        `;

    this.logger.log(`Generated prompt for OpenAI API: ${prompt}`);

    try {
      // Send the request to OpenAI API
      const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
      });

      const result = parseInt(chatCompletion.choices[0].message.content);
      this.logger.log(`Received response from OpenAI: ${result}`);

      return result;
    } catch (error) {
      this.logger.error('Error calculating sales cycle points:', error);
      return 0; // Return 0 in case of error
    }
  }

  // points_for_sold_to(positions, Industry_Sold_To) {
  //     let combinedWorkedIn = [];
  //
  //     positions.forEach(position => {
  //         combinedWorkedIn.push(...position.details.sold_to);
  //     });
  //
  //     const uniqueWorkedIn = [...new Set([...combinedWorkedIn, ...Industry_Sold_To])];
  //
  //     const allElementsPresent = Industry_Sold_To.every(element => uniqueWorkedIn.includes(element));
  //
  //     if (allElementsPresent) {
  //         return 10;
  //     } else {
  //         const commonElements = Industry_Sold_To.filter(element => uniqueWorkedIn.includes(element));
  //         const points = (commonElements.length / Industry_Sold_To.length) * 10;
  //         return points;
  //     }
  // }
  segment_percent(positions: PositionDto[]) {
    // Filter positions for each segment and calculate total
    const totalSmb = positions
      .filter((p) => p.details && p.details.segment_smb)
      .reduce((acc, p) => acc + p.details.segment_smb, 0);

    const totalMidMarket = positions
      .filter((p) => p.details && p.details.segment_mid_market)
      .reduce((acc, p) => acc + p.details.segment_mid_market, 0);

    const totalEnterprise = positions
      .filter((p) => p.details && p.details.segment_enterprise)
      .reduce((acc, p) => acc + p.details.segment_enterprise, 0);

    const totalSegments = totalSmb + totalMidMarket + totalEnterprise;

    if (totalSegments > 0) {
      // Calculate percentages for each segment
      const smbPercent = Math.round((totalSmb / totalSegments) * 100);
      const midMarketPercent = Math.round((totalMidMarket / totalSegments) * 100);
      const enterprisePercent = Math.round((totalEnterprise / totalSegments) * 100);

      // Return a map with the percentages
      return {
        smb_percent: smbPercent,
        mid_market_percent: midMarketPercent,
        enterprise_percent: enterprisePercent,
      };
    } else {
      // Return a map with zero percentages if no positions exist
      return {
        smb_percent: 0,
        mid_market_percent: 0,
        enterprise_percent: 0,
      };
    }
  }
  points_for_segment(positions: PositionDto[], project: RecruiterProjectDto): number {
    this.logger.log(`Calculating segment points for project`);

    const segmentPercentage = this.segment_percent(positions);
    this.logger.log(
      `Calculated segment percentages: SMB: ${segmentPercentage.smb_percent}, Midmarket: ${segmentPercentage.mid_market_percent}, Enterprise: ${segmentPercentage.enterprise_percent}`,
    );

    // Calculate points for each segment
    const smb =
      segmentPercentage.smb_percent >= project.smb
        ? 10
        : segmentPercentage.smb_percent === 0
          ? 0
          : 10 * (segmentPercentage.smb_percent / project.smb);
    this.logger.log(
      `SMB segment points: ${smb} (Segment Percentage: ${segmentPercentage.smb_percent}, Project Requirement: ${project.smb})`,
    );

    const midmarket =
      segmentPercentage.mid_market_percent >= project.midmarket
        ? 10
        : segmentPercentage.mid_market_percent === 0
          ? 0
          : 10 * (segmentPercentage.mid_market_percent / project.midmarket);
    this.logger.log(
      `Midmarket segment points: ${midmarket} (Segment Percentage: ${segmentPercentage.mid_market_percent}, Project Requirement: ${project.midmarket})`,
    );

    const enterprise =
      segmentPercentage.enterprise_percent >= project.enterprise
        ? 10
        : segmentPercentage.enterprise_percent === 0
          ? 0
          : 10 * (segmentPercentage.enterprise_percent / project.enterprise);
    this.logger.log(
      `Enterprise segment points: ${enterprise} (Segment Percentage: ${segmentPercentage.enterprise_percent}, Project Requirement: ${project.enterprise})`,
    );

    // Calculate the average
    const average = (smb + midmarket + enterprise) / 3;
    this.logger.log(`Average segment points: ${average}`);

    // Round to two decimal places
    const formattedAverage = Math.round(average * 100) / 100;
    this.logger.log(`Formatted average points: ${formattedAverage}`);

    return formattedAverage;
  }

  // points_for_sales_cycle( positions, project) {
  //     return this.points_for_sales_cycle_helper(project, positions, 0);
  // }
  //
  // points_for_sales_cycle_helper(project, positions, score) {
  //     if (positions.length === 0) {
  //         return score;
  //     }
  //
  //     const position = positions[0];
  //     const rest = positions.slice(1);
  //
  //     // Extracting average sales cycle value and unit from the position object
  //     const averageSalesCycle = position.details.average_sales_cycle;
  //     const [value, unit] = averageSalesCycle.split(" ");
  //     const numericValue = parseInt(value);
  //
  //     let temp_score;
  //
  //     if (project.minimum_salecycle_type === "Week") {
  //         if (unit === "weeks") {
  //             if (numericValue >= project.minimum_sale_cycle) {
  //                 temp_score = 10;
  //             } else {
  //                 const ratio = numericValue / project.minimum_sale_cycle;
  //                 temp_score = Math.round(ratio * 10);
  //             }
  //         } else if (unit === "months") {
  //             const weeks_in_a_month = 4.33;
  //             const weeks = numericValue * weeks_in_a_month;
  //             if (weeks >= project.minimum_sale_cycle) {
  //                 temp_score = 10;
  //             } else {
  //                 const ratio = weeks / project.minimum_sale_cycle;
  //                 temp_score = Math.round(ratio * 10);
  //             }
  //         }
  //     } else {
  //         if (unit === "weeks") {
  //             if (numericValue >= project.minimum_sale_cycle) {
  //                 temp_score = 10;
  //             } else {
  //                 const ratio = numericValue / project.minimum_sale_cycle;
  //                 temp_score = Math.round(ratio * 10);
  //             }
  //         } else if (unit === "months") {
  //             const weeks_in_a_month = 4.33;
  //             const months = numericValue;
  //             const weeks = months * weeks_in_a_month;
  //             if (weeks >= project.minimum_sale_cycle) {
  //                 temp_score = 10;
  //             } else {
  //                 const ratio = weeks / project.minimum_sale_cycle;
  //                 temp_score = Math.round(ratio * 10);
  //             }
  //         }
  //     }
  //
  //     const updated_score = temp_score > score ? temp_score : score;
  //
  //     return this.points_for_sales_cycle_helper(project, rest, updated_score);
  // }

  // points_for_dealsize(positions, project) {
  //     return positions.reduce((score, position) => {
  //         if (position.details && position.details.average_deal_size) {
  //             let temp_score = 0;
  //             if (position.details.average_deal_size >= 1) {
  //                 const dealsize = position.details.average_deal_size
  //                 if (dealsize >= project.minimum_deal_size) {
  //                     temp_score = 10;
  //                 } else {
  //                     temp_score = Math.ceil(10 * (dealsize / project.minimum_deal_size));
  //                     temp_score = Math.max(0, temp_score);
  //                 }
  //             }
  //             return temp_score > score ? temp_score : score;
  //         } else {
  //             return Math.max(0, score);
  //         }
  //     }, 0);
  // }
  async points_for_dealsize(
    positions: PositionDto[],
    project: RecruiterProjectDto,
  ): Promise<number> {
    const client = this.openAIClient;

    // Extract the average deal sizes from the positions
    const dealsizes = positions.map((position) => position?.details?.average_deal_size || 0);
    this.logger.log(
      `Candidate's average deal sizes: ${JSON.stringify(dealsizes)}, Required deal size: ${project.minimum_deal_size}`,
    );

    // Generate the prompt for OpenAI API
    const prompt = `
          You are an expert at evaluating sales experience alignment. Compare:
          1. Candidate's average deal size(s): ${JSON.stringify(dealsizes)}
          2. Required deal size: ${project.minimum_deal_size}
      
          Score from 0-10 based on deal size alignment:
          - 10: Equal or higher deal size
          - 7-9: Within 20% lower (shows ability to handle similar scale)
          - 4-6: Within 50% lower (demonstrates growth potential)
          - 1-3: >50% lower but still significant deals
          - 0: Deal size too small to be relevant
      
          Consider: Selling $50K products shows readiness for $60K sales, but $1K to $60K is too big a gap.
          Provide only the numeric score (0-10).
        `;

    this.logger.log(`Generated prompt for OpenAI API: ${prompt}`);

    try {
      // Send the request to OpenAI API
      const response = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
      });

      const result = parseInt(response.choices[0].message.content) || 0;
      this.logger.log(`Received response from OpenAI: ${result}`);

      return result;
    } catch (error) {
      this.logger.error('Error calculating dealsize points:', error);
      return 0;
    }
  }

  points_for_new_business(positions: PositionDto[], project: RecruiterProjectDto): number {
    this.logger.log(`Calculating points for new business based on ${positions.length} positions`);

    // Calculate the total new_business value
    const totalNewBusiness: number = positions.reduce((acc, position) => {
      if (position.details && position.details.new_business) {
        return acc + position.details.new_business;
      }
      return acc;
    }, 0);

    this.logger.log(`Total new business value calculated: ${totalNewBusiness}`);

    // Calculate the average new_business value
    const averageNewBusiness: number = totalNewBusiness / positions.length;
    this.logger.log(`Average new business value: ${averageNewBusiness}`);

    // Compare average value with project.business_range
    if (averageNewBusiness >= project.business_range) {
      this.logger.log(
        `Average new business (${averageNewBusiness}) is greater than or equal to the project business range (${project.business_range}), returning 10 points`,
      );
      return 10;
    } else {
      // Calculate points from 0 to 10 accordingly
      const ratio: number = averageNewBusiness / project.business_range;
      const points = Math.round(ratio * 10);
      this.logger.log(
        `Average new business (${averageNewBusiness}) is less than the project business range (${project.business_range}), returning ${points} points`,
      );
      return points;
    }
  }

  points_for_outbound(positions: PositionDto[], project: RecruiterProjectDto): number {
    this.logger.log(`Calculating points for outbound based on ${positions.length} positions`);

    // Calculate the total outbound value
    const totalOutbound: number = positions.reduce((acc, position) => {
      if (position.details && position.details.outbound) {
        return acc + position.details.outbound;
      }
      return acc;
    }, 0);

    this.logger.log(`Total outbound value calculated: ${totalOutbound}`);

    // Calculate the average outbound value
    const averageOutbound: number = totalOutbound / positions.length;
    this.logger.log(`Average outbound value: ${averageOutbound}`);

    // Compare average value with project.outbound_range
    if (averageOutbound >= project.outbound_range) {
      this.logger.log(
        `Average outbound (${averageOutbound}) is greater than or equal to the project outbound range (${project.outbound_range}), returning 10 points`,
      );
      return 10;
    } else {
      // Calculate points from 0 to 10 accordingly
      const ratio: number = averageOutbound / project.outbound_range;
      const points = Math.round(ratio * 10);
      this.logger.log(
        `Average outbound (${averageOutbound}) is less than the project outbound range (${project.outbound_range}), returning ${points} points`,
      );
      return points;
    }
  }

  points_for_persona(positions: PositionDto[], selectedPersona: string[]): number {
    this.logger.log(
      `Calculating points for persona based on ${positions.length} positions and selected persona: ${JSON.stringify(selectedPersona)}`,
    );

    const combinedPersonas: string[] = [];

    // Combine all personas from positions
    positions.forEach((position) => {
      this.logger.log(`Adding personas from position: ${position.details.persona}`);
      combinedPersonas.push(...position.details.persona);
    });

    this.logger.log(`Combined personas from all positions: ${JSON.stringify(combinedPersonas)}`);

    const uniqueWorkedIn: string[] = [...new Set([...combinedPersonas, ...selectedPersona])];
    this.logger.log(`Unique personas after combining: ${JSON.stringify(uniqueWorkedIn)}`);

    const allElementsPresent: boolean = selectedPersona.every((element) =>
      uniqueWorkedIn.includes(element),
    );
    this.logger.log(`Are all selected personas present: ${allElementsPresent}`);

    if (allElementsPresent) {
      this.logger.log('All selected personas are present, returning 10 points');
      return 10;
    } else {
      const commonElements = selectedPersona.filter((element) => uniqueWorkedIn.includes(element));
      this.logger.log(
        `Common personas between selected and combined: ${JSON.stringify(commonElements)}`,
      );

      const points = (commonElements.length / selectedPersona.length) * 10;
      this.logger.log(`Calculated points: ${points}`);

      return points;
    }
  }

  calculateTotalYears(positions: PositionDto[]): number {
    this.logger.log(`Calculating total years from ${positions.length} positions`);

    let totalYears = 0;
    const uniquePeriods = {};

    positions.forEach((position) => {
      const startYear: number = position.start_year;
      const startMonth: number = position.start_month;
      let endYear: number = position.end_year;
      let endMonth: number = position.end_month;

      this.logger.log(
        `Processing position: Start Year: ${startYear}, Start Month: ${startMonth}, End Year: ${endYear}, End Month: ${endMonth}`,
      );

      // If end_month and end_year are null, consider them as current month and year
      const currentDate: Date = new Date();
      const currentYear: number = currentDate.getFullYear();
      const currentMonth: number = currentDate.getMonth() + 1;
      if (endYear === null || endMonth === null) {
        endYear = currentYear;
        endMonth = currentMonth;
        this.logger.log(
          `End date was null, using current year and month: End Year: ${endYear}, End Month: ${endMonth}`,
        );
      }

      // Merge overlapping periods
      const startStr = startYear + '-' + startMonth;
      const endStr = endYear + '-' + endMonth;
      this.logger.log(`Merging periods from ${startStr} to ${endStr}`);

      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? startMonth : 1;
        const monthEnd = year === endYear ? endMonth : 12;

        for (let month = monthStart; month <= monthEnd; month++) {
          const periodStr = year + '-' + month;
          if (!uniquePeriods[periodStr]) {
            this.logger.log(`Adding new period: ${periodStr}`);
            uniquePeriods[periodStr] = true;
          }
        }
      }
    });

    // Calculate total years based on distinct periods
    totalYears = Object.keys(uniquePeriods).length / 12;
    this.logger.log(
      `Total unique periods: ${Object.keys(uniquePeriods).length}, Calculated total years: ${totalYears}`,
    );

    return totalYears;
  }

  points_for_years(positions: PositionDto[], project: RecruiterProjectDto): number {
    this.logger.log(
      `Calculating points for years of experience based on ${positions.length} positions and project experience: ${project.experience}`,
    );

    const totalYears: number = this.calculateTotalYears(positions);
    this.logger.log(`Total years of experience calculated: ${totalYears}`);

    if (totalYears >= project.experience) {
      this.logger.log(
        `Total years of experience (${totalYears}) is greater than or equal to the required project experience (${project.experience}), returning 10 points`,
      );
      return 10;
    } else {
      // Calculate points from 0 to 10 accordingly
      const ratio: number = totalYears / project.experience;
      const points = Math.round(ratio * 10);
      this.logger.log(
        `Total years of experience (${totalYears}) is less than the required project experience (${project.experience}), returning ${points} points`,
      );
      return points;
    }
  }
}
