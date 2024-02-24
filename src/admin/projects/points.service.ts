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
    
    

}