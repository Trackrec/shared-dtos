import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import dotenv from 'dotenv';



@Injectable()
export class RecruiterPointsService {
    private openAIClient: OpenAI;

    constructor() {
        // Load environment variables from .env file
        dotenv.config();
        // Initialize the OpenAI client as a class-level property
        this.openAIClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is loaded from environment variables
        });
    }

    points_for_ote(user_ote, project_ote) {
        if (!user_ote) {
            user_ote = 0;
        }
        if (!project_ote) {
            project_ote = 0;
        }
    
        // Case when user_ote is less than or equal to project_ote
        if (user_ote <= project_ote) {
            return 10; // Always return 10 points
        } else {
            // Case when user_ote is greater than project_ote
            let diff = user_ote - project_ote;
            // Calculate points linearly between 0 to 10 based on the difference
            let points = 10 - (10 * diff) / user_ote;
            // Ensure points are within the range of 0 to 10
            return parseFloat(Math.max(0, Math.min(10, points)).toFixed(2));
        }
    }

    async points_for_worked_in(positions, Industry_Works_IN) {
      const client = this.openAIClient;

      const workedIn = positions.flatMap(position => position?.details?.worked_in || []);
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
          Target industries: ${JSON.stringify(Industry_Works_IN)}
      `;

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o-mini',
        });
        const result = parseInt(chatCompletion.choices[0].message.content);
        return result;
    }

    async points_for_sold_to(positions, Sold_In) {
      const client = this.openAIClient

      const soldIn = positions.flatMap(position => position?.details?.sold_to || []);
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
          Target industries: ${JSON.stringify(Sold_In)}
            Position:${JSON.stringify(positions)}
      `;
        console.log(prompt)

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o-mini',
        });
        const result = parseInt(chatCompletion.choices[0].message.content);
        return result;
    }

async points_for_sales_cycle(positions, project) {
    const client = this.openAIClient

    const salesCycles = positions.map(position => ({
        value: position.details.average_sales_cycle,
        type: position.details.type || 'Unknown'
    }));

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

        Output only the numerical score (0-10).`;

    const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
    });

    return parseInt(chatCompletion.choices[0].message.content);
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
    segment_percent(positions) {
        // Filter positions for each segment and calculate total
        const total_smb = positions
            .filter(p => p.details && p.details.segment_smb)
            .reduce((acc, p) => acc + p.details.segment_smb, 0);
    
        const total_mid_market = positions
            .filter(p => p.details && p.details.segment_mid_market)
            .reduce((acc, p) => acc + p.details.segment_mid_market, 0);
    
        const total_enterprise = positions
            .filter(p => p.details && p.details.segment_enterprise)
            .reduce((acc, p) => acc + p.details.segment_enterprise, 0);
    
        const total_segments = total_smb + total_mid_market + total_enterprise;
    
        if (total_segments > 0) {
            // Calculate percentages for each segment
            const smb_percent = Math.round((total_smb / total_segments) * 100);
            const mid_market_percent = Math.round((total_mid_market / total_segments) * 100);
            const enterprise_percent = Math.round((total_enterprise / total_segments) * 100);
    
            // Return a map with the percentages
            return {
                smb_percent: smb_percent,
                mid_market_percent: mid_market_percent,
                enterprise_percent: enterprise_percent
            };
        } else {
            // Return a map with zero percentages if no positions exist
            return {
                smb_percent: 0,
                mid_market_percent: 0,
                enterprise_percent: 0
            };
        }
    }
    points_for_segment(positions, project) {
        const segment_percentage = this.segment_percent(positions);
    
        // Calculate points for each segment
        const smb = segment_percentage.smb_percent >= project.smb ? 10 :
                    segment_percentage.smb_percent === 0 ? 0 :
                    10 * (segment_percentage.smb_percent / project.smb);
    
        const midmarket = segment_percentage.mid_market_percent >= project.midmarket ? 10 :
                          segment_percentage.mid_market_percent === 0 ? 0 :
                          10 * (segment_percentage.mid_market_percent / project.midmarket);
    
        const enterprise = segment_percentage.enterprise_percent >= project.enterprise ? 10 :
                           segment_percentage.enterprise_percent === 0 ? 0 :
                           10 * (segment_percentage.enterprise_percent / project.enterprise);
    
        // Calculate the average
        const average = (smb + midmarket + enterprise) / 3;
    
        // Round to two decimal places
        const formatted_average = Math.round(average * 100) / 100;
    
        return formatted_average;
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
    async points_for_dealsize(positions, project) {
        const client = this.openAIClient
    
        const dealsizes = positions.map(position => position?.details?.average_deal_size || 0);
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
    
        try {
            const response = await client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o-mini',
            });
            
            return parseInt(response.choices[0].message.content) || 0;
        } catch (error) {
            console.error('Error calculating dealsize points:', error);
            return 0;
        }
    }

    points_for_new_business(positions, project) {
        // Calculate the total new_business value
        const total_new_business = positions.reduce((acc, position) => {
            if (position.details && position.details.new_business) {
                return acc + position.details.new_business;
            }
            return acc;
        }, 0);
    
        // Calculate the average new_business value
        const average_new_business = total_new_business / positions.length;
    
        // Compare average value with project.business_range
        if (average_new_business >= project.business_range) {
            return 10;
        } else {
            // Calculate points from 0 to 10 accordingly
            const ratio = average_new_business / project.business_range;
            return Math.round(ratio * 10);
        }
    }
    

    points_for_outbound(positions, project) {
        // Calculate the total new_business value
        const total_new_business = positions.reduce((acc, position) => {
            if (position.details && position.details.outbound) {
                return acc + position.details.outbound;
            }
            return acc;
        }, 0);
    
        // Calculate the average new_business value
        const average_new_business = total_new_business / positions.length;
    
        // Compare average value with project.business_range
        if (average_new_business >= project.outbound_range) {
            return 10;
        } else {
            // Calculate points from 0 to 10 accordingly
            const ratio = average_new_business / project.outbound_range;
            return Math.round(ratio * 10);
        }
    }

    points_for_persona(positions, selectedPersona) {
        let combinedPersonas = [];
    
        positions.forEach(position => {
            combinedPersonas.push(...position.details.persona);
        });
    
        const uniqueWorkedIn = [...new Set([...combinedPersonas, ...selectedPersona])];
    
        const allElementsPresent = selectedPersona.every(element => uniqueWorkedIn.includes(element));
    
        if (allElementsPresent) {
            return 10;
        } else {
            const commonElements = selectedPersona.filter(element => uniqueWorkedIn.includes(element));
            const points = (commonElements.length / selectedPersona.length) * 10;
            return points;
        }
    }
    

    calculateTotalYears(positions) {
        let totalYears = 0;
        let uniquePeriods = {};
    
        positions.forEach(position => {
            const startYear = position.start_year;
            const startMonth = position.start_month;
            let endYear = position.end_year;
            let endMonth = position.end_month;
    
            // If end_month and end_year are null, consider them as current month and year
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            if (endYear === null || endMonth === null) {
                endYear = currentYear;
                endMonth = currentMonth;
            }
    
            // Merge overlapping periods
            const startStr = startYear + "-" + startMonth;
            const endStr = endYear + "-" + endMonth;
            for (let year = startYear; year <= endYear; year++) {
                const monthStart = year === startYear ? startMonth : 1;
                const monthEnd = year === endYear ? endMonth : 12;
    
                for (let month = monthStart; month <= monthEnd; month++) {
                    const periodStr = year + "-" + month;
                    if (!uniquePeriods[periodStr]) {
                        uniquePeriods[periodStr] = true;
                    }
                }
            }
        });
    
        // Calculate total years based on distinct periods
        totalYears = Object.keys(uniquePeriods).length / 12;
        return totalYears;
    }

    points_for_years(positions, project) {
        const totalYears = this.calculateTotalYears(positions);
    
        if (totalYears >= project.experience) {
            return 10;
        } else {
            // Calculate points from 0 to 10 accordingly
            const ratio = totalYears / project.experience;
            return Math.round(ratio * 10);
        }
    }
}
