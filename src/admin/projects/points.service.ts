import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';


@Injectable()
export class PointsService {
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
            return Math.max(0, Math.min(10, points)).toFixed(2);
        }
    }

    points_for_worked_in(positions, Industry_Works_IN) {
        let combinedWorkedIn = [];
    
        positions.forEach(position => {
            combinedWorkedIn.push(...position.details.worked_in);
        });
    
        const uniqueWorkedIn = [...new Set([...combinedWorkedIn, ...Industry_Works_IN])];
    
        const allElementsPresent = Industry_Works_IN.every(element => uniqueWorkedIn.includes(element));
    
        if (allElementsPresent) {
            return 10;
        } else {
            const commonElements = Industry_Works_IN.filter(element => uniqueWorkedIn.includes(element));
            const points = (commonElements.length / Industry_Works_IN.length) * 10;
            return points;
        }
    }

    points_for_sold_to(positions, Industry_Sold_To) {
        let combinedWorkedIn = [];
    
        positions.forEach(position => {
            combinedWorkedIn.push(...position.details.sold_to);
        });
    
        const uniqueWorkedIn = [...new Set([...combinedWorkedIn, ...Industry_Sold_To])];
    
        const allElementsPresent = Industry_Sold_To.every(element => uniqueWorkedIn.includes(element));
    
        if (allElementsPresent) {
            return 10;
        } else {
            const commonElements = Industry_Sold_To.filter(element => uniqueWorkedIn.includes(element));
            const points = (commonElements.length / Industry_Sold_To.length) * 10;
            return points;
        }
    }
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
    

    points_for_sales_cycle( positions, project) {
        return this.points_for_sales_cycle_helper(project, positions, 0);
    }
    
    points_for_sales_cycle_helper(project, positions, score) {
        if (positions.length === 0) {
            return score;
        }
    
        const position = positions[0];
        const rest = positions.slice(1);
    
        // Extracting average sales cycle value and unit from the position object
        const averageSalesCycle = position.details.average_sales_cycle;
        const [value, unit] = averageSalesCycle.split(" ");
        const numericValue = parseInt(value);
    
        let temp_score;
    
        if (project.minimum_salecycle_type === "Week") {
            if (unit === "weeks") {
                if (numericValue >= project.minimum_sale_cycle) {
                    temp_score = 10;
                } else {
                    const ratio = numericValue / project.minimum_sale_cycle;
                    temp_score = Math.round(ratio * 10);
                }
            } else if (unit === "months") {
                const weeks_in_a_month = 4.33;
                const weeks = numericValue * weeks_in_a_month;
                if (weeks >= project.minimum_sale_cycle) {
                    temp_score = 10;
                } else {
                    const ratio = weeks / project.minimum_sale_cycle;
                    temp_score = Math.round(ratio * 10);
                }
            }
        } else {
            if (unit === "weeks") {
                if (numericValue >= project.minimum_sale_cycle) {
                    temp_score = 10;
                } else {
                    const ratio = numericValue / project.minimum_sale_cycle;
                    temp_score = Math.round(ratio * 10);
                }
            } else if (unit === "months") {
                const weeks_in_a_month = 4.33;
                const months = numericValue;
                const weeks = months * weeks_in_a_month;
                if (weeks >= project.minimum_sale_cycle) {
                    temp_score = 10;
                } else {
                    const ratio = weeks / project.minimum_sale_cycle;
                    temp_score = Math.round(ratio * 10);
                }
            }
        }
    
        const updated_score = temp_score > score ? temp_score : score;
    
        return this.points_for_sales_cycle_helper(project, rest, updated_score);
    }
    

    points_for_dealsize(positions, project) {
        return positions.reduce((score, position) => {
            if (position.details && position.details.average_deal_size) {
                let temp_score = 0;
                if (position.details.average_deal_size >= 1) {
                    const dealsize = position.details.average_deal_size
                    if (dealsize >= project.minimum_deal_size) {
                        temp_score = 10;
                    } else {
                        temp_score = Math.ceil(10 * (dealsize / project.minimum_deal_size));
                        temp_score = Math.max(0, temp_score);
                    }
                }
                return temp_score > score ? temp_score : score;
            } else {
                return Math.max(0, score);
            }
        }, 0);
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
    
        // Get current date
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // Add 1 because getMonth() returns 0-based index
    
        // Sort positions by start year and month
        positions.sort((a, b) => {
            if (a.start_year !== b.start_year) {
                return a.start_year - b.start_year;
            } else {
                return a.start_month - b.start_month;
            }
        });
    
        let prevEndYear = -Infinity;
        let prevEndMonth = -Infinity;
    
        positions.forEach(position => {
            const startYear = position.start_year;
            const startMonth = position.start_month;
            let endYear = position.end_year;
            let endMonth = position.end_month;
    
            // If end_month and end_year are null, consider them as current month and year
            if (endYear === null || endMonth === null) {
                endYear = currentYear;
                endMonth = currentMonth;
            }
    
            // Check for overlapping dates
            if (startYear < prevEndYear || (startYear === prevEndYear && startMonth <= prevEndMonth)) {
                // Overlapping period, skip counting
                return;
            }
    
            // Calculate years of employment for this position
            let years = endYear - startYear;
            if (endMonth < startMonth) {
                years--; // Adjust if end month is before start month
            }
    
            // Add years to totalYears
            totalYears += years;
    
            // Update previous end year and month
            prevEndYear = endYear;
            prevEndMonth = endMonth;
        });
    
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