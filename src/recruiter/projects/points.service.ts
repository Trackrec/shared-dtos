import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Position } from 'src/positions/positions.entity';

async function getChatCompletion(client, prompt, model) {
    try {
        const response = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
        });
        return parseInt(response.choices[0].message.content.trim(), 10);
    } catch (error) {
        if (error.response) {
            console.error('OpenAI API Error:', error.response.data);
        } else {
            console.error('Unexpected Error:', error.message);
        }
        return 0;
    }
}

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


    async points_for_worked_in(
        positions: any[],
        Industry_Works_IN: string[]
    ): Promise<number> {
        const client = this.openAIClient;
        
        // Define workedIn outside try block so it's accessible in catch block
        let workedIn: string[] = [];
        let expandedWorkedIn: string[] = [];
        let expandedTargetIndustries: string[] = [];
    
        // Early validation
        if (!positions || !Industry_Works_IN || !Array.isArray(positions) || !Array.isArray(Industry_Works_IN)) {
            console.log('Invalid input data');
            return 0;
        }
    
        // Extract worked in data before try block
        workedIn = positions.flatMap(
            (position) => position?.details?.worked_in ?? []
        );
    
        try {
            console.log('Initial industry data:', {
                candidateIndustries: workedIn,
                targetIndustries: Industry_Works_IN
            });
    
            // Early validation
            if (!workedIn.length || !Industry_Works_IN.length) {
                console.log('No industry data to compare');
                return 0;
            }
    
            // Industry synonyms (keeping your existing mapping)
            const industrySynonyms: Record<string, string[]> = {
                "Software": ["SaaS", "Tech Platforms", "Application Development"],
                "Service": ["Consulting", "Customer Support", "Professional Services"],
                "Manufacturing": ["3D Printing", "Automotive", "Electronics"],
                // ... rest of your synonyms
            };
    
            // Expand industries
            const expandIndustries = (industries: string[]): string[] =>
                industries.flatMap((industry) => [
                    industry,
                    ...(industrySynonyms[industry] || []),
                ]);
    
            expandedWorkedIn = expandIndustries(workedIn);
            expandedTargetIndustries = expandIndustries(Industry_Works_IN);
    
            // Rest of your GPT scoring logic...
            const scoringPrompt = `
                You are an expert at analyzing industry experience matches.
                
                Compare these industries and provide only a numerical score between 0 and 10:
                
                Candidate has worked in: ${JSON.stringify(expandedWorkedIn)}
                Role requires experience in: ${JSON.stringify(expandedTargetIndustries)}
                
                Consider:
                - Direct industry matches are highest value
                - Related industry experience is valuable
                - Recent experience is more relevant
                - Core industry requirements must be met
                
                Scoring guide:
                10: Perfect alignment in core industries
                7-9: Strong alignment with some variation
                4-6: Moderate alignment or relevant transferable experience
                1-3: Minor alignment or distant related experience
                0: No relevant alignment
                
                Respond with only a number between 0 and 10, no additional text.
            `;
    
            const response = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: scoringPrompt }],
                temperature: 0.1
            });
    
            const rawScore = response.choices[0].message.content.trim();
            const score = parseFloat(rawScore);
    
            if (isNaN(score) || score < 0 || score > 10) {
                console.error('Invalid GPT score:', {
                    rawResponse: rawScore,
                    parsedScore: score
                });
                throw new Error('Invalid score received from GPT');
            }
    
            console.log('Industry match result:', {
                score,
                expandedWorkedIn,
                expandedTargetIndustries
            });
    
            return Math.round(score);
    
        } catch (error) {
            console.error('Error in points_for_worked_in:', {
                error: error.message,
                candidateIndustries: workedIn.length,
                targetIndustries: Industry_Works_IN.length,
                expandedWorkedIn: expandedWorkedIn.length,
                expandedTargetIndustries: expandedTargetIndustries.length
            });
    
            // Fallback to simple matching using expanded industries if available
            const matchingIndustries = expandedTargetIndustries.length > 0 
                ? expandedTargetIndustries.filter(industry => expandedWorkedIn.includes(industry))
                : Industry_Works_IN.filter(industry => workedIn.includes(industry));
    
            const totalIndustries = expandedTargetIndustries.length > 0 
                ? expandedTargetIndustries.length 
                : Industry_Works_IN.length;
    
            return Math.round((matchingIndustries.length / totalIndustries) * 10);
        }
    }
    
    async points_for_sold_to(positions: any[], Sold_In: string[]): Promise<number> {
        const client = this.openAIClient;
        
        try {
            // Extract sold_to data from positions
            const soldIn: string[] = positions.flatMap(
                (position) => position?.details?.sold_to ?? []
            );
    
            // Early validation
            if (!soldIn.length || !Sold_In.length) {
                console.log('No sold_to data to compare');
                return 0;
            }
    
            // Log initial data
            console.log('Initial data:', {
                candidateSoldTo: soldIn,
                requiredSoldTo: Sold_In
            });
    
            // Industry synonyms (existing mapping remains the same)
            const industrySynonyms: Record<string, string[]> = {
                "Tech": ["IT", "Software", "Technology"],
                "Healthcare": ["Medical", "Pharma", "Health"],
                // ... rest of your synonyms
            };
    
            // Expand industries (existing function remains the same)
            const expandIndustries = (industries: string[]): string[] =>
                industries.flatMap((industry) => [
                    industry,
                    ...(industrySynonyms[industry] || []),
                ]);
    
            const expandedSoldIn = expandIndustries(soldIn);
            const expandedTargetIndustries = expandIndustries(Sold_In);
    
            // Simplified prompt for scoring
            const matchingPrompt = `
                You are an expert at analyzing industry sales experience matches.
                
                Compare these industries and provide only a numerical score between 0 and 10:
                
                Candidate has sold to: ${JSON.stringify(expandedSoldIn)}
                Role requires selling to: ${JSON.stringify(expandedTargetIndustries)}
                
                Scoring criteria:
                10: Direct matches in primary industries
                8-9: Matches in related/similar industries
                5-7: Some overlapping industry experience
                1-4: Minimal relevant industry experience
                0: No relevant industry overlap
                
                Respond with only a number between 0 and 10, no additional text.
            `;
    
            // Get score from GPT
            const response = await client.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: matchingPrompt }],
                temperature: 0.1 // Lower temperature for more consistent scoring
            });
    
            // Process GPT response
            const rawScore = response.choices[0].message.content.trim();
            const score = parseFloat(rawScore);
    
            // Validate score
            if (isNaN(score) || score < 0 || score > 10) {
                console.error('Invalid GPT score:', {
                    rawResponse: rawScore,
                    parsedScore: score
                });
                
                // Fallback scoring logic
                const directMatches = expandedTargetIndustries.filter(industry => 
                    expandedSoldIn.includes(industry)
                ).length;
                
                return Math.round((directMatches / expandedTargetIndustries.length) * 10);
            }
    
            console.log('Sold_to calculation result:', {
                score,
                expandedSoldIn,
                expandedTargetIndustries
            });
    
            return Math.round(score);
    
        } catch (error) {
            console.error('Error in points_for_sold_to calculation:', {
                error: error.message,
                soldIn: positions?.length ? 'has positions' : 'no positions',
                targetIndustries: Sold_In?.length ? 'has targets' : 'no targets'
            });
            
            // Fallback to simple matching if GPT fails
            const directMatches = Sold_In.filter(industry => 
                Sold_In.includes(industry)
            ).length;
            
            return Math.round((directMatches / Sold_In.length) * 10);
        }
    }
    
       
    
    async points_for_sales_cycle(positions, project) {
        const client = this.openAIClient;
        const salesCycles = positions.map(position => ({
            value: position.details.average_sales_cycle,
            type: position.details.type || 'Unknown',
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
            Output only the numerical score (0-10).
        `;
        return await getChatCompletion(client, prompt, 'gpt-4o-mini');
    }


    async points_for_territory(positions: any[], project: any): Promise<number> {
        // Early validation
        if (!project || !positions || !Array.isArray(positions)) {
            console.log('Invalid input data');
            return 0;
        }
    
        try {
            // Validate territory requirements
            if (!project.territory || !Array.isArray(project.territory)) {
                console.log('No territory requirements for project:', project.id);
                return 0;
            }
    
            // Get all territories from positions
            const candidateTerritories = positions.reduce((territories, position) => {
                if (position.details?.territories) {
                    territories.push(...position.details.territories);
                }
                return territories;
            }, []);
    
            if (candidateTerritories.length === 0) {
                console.log('No candidate territories found');
                return 0;
            }
    
            // Simplified prompt that explicitly requests clean JSON
            const prompt = `
                Compare these territories and assign a score based on these rules:
                - Country to country match: 10 points
                - Country to province/city (same country): 9 points
                - Province/city to province/city: 10 points
                - No geographic overlap: 0 points
    
                Required territories: ${JSON.stringify(project.territory)}
                Candidate territories: ${JSON.stringify(candidateTerritories)}
    
                Respond with only a number between 0 and 10, with no additional text or formatting.
            `;
    
            // Get score from GPT
            const response = await this.openAIClient.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
            });
    
            // Get the raw score from GPT response
            const rawScore = response.choices[0].message.content.trim();
            
            // Parse the score and validate
            const score = parseFloat(rawScore);
            
            // Validate the score
            if (isNaN(score) || score < 0 || score > 10) {
                console.error('Invalid score from GPT:', rawScore);
                return 0;
            }
    
            console.log('Territory match result:', {
                score,
                projectId: project.id,
                requiredTerritories: project.territory,
                candidateTerritories
            });
    
            return score;
    
        } catch (error) {
            console.error('Error in points_for_territory:', {
                error: error.message,
                projectId: project?.id
            });
            return 0;
        }
    }
    
     
   
   
    async points_for_company_overlap(position: any[], project: any): Promise<number> {
        const client = this.openAIClient;
    
        try {
            // Extract domains from positions
            const domains: string[] = position
                .map((pos) => {
                    if (pos?.company?.website_url) {
                        return pos.company.website_url;
                    } else if (pos?.company?.domain) {
                        return `http://www.${pos.company.domain}`;
                    }
                    return null; // Handle cases where neither property is available
                })
                .filter(Boolean)
                .slice(-2); // Keep only the last two entries
    
            if (!domains.length) {
                console.error("No domains found for the candidate's companies.");
                return 0; // No data to calculate
            }
    
            console.log("Candidate's company domains:", domains);
    
            // Refined prompt for GPT
            const prompt = `
                Analyze the alignment of the candidate's last two companies (${domains.join(", ")}) with the hiring project's company profile.
                Consider:
                - Market position and reputation.
                - Industry overlap and synergy with the project's domain.
                - Relevance of business size, operations, or goals.
                
                Assign a cumulative score from 0 to 10 based on how well these companies align with the hiring project's requirements.
                - 10: Perfect alignment.
                - 7-9: Strong overlap.
                - 4-6: Partial overlap.
                - 1-3: Minimal overlap.
                - 0: No alignment.
    
                Candidate's companies: ${JSON.stringify(domains)}
                Project hiring data: ${JSON.stringify(project)}
                
                Provide only the numeric score (0-10) in your response.
            `;
    
            // Fetch response from GPT
            const response: string = await client.chat.completions
                .create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                })
                .then((res) => res.choices[0].message?.content || '');
    
            console.log("GPT Response for Company Overlap:", response);
    
            // Parse and validate the response
            const score = parseFloat(response);
            if (isNaN(score) || score < 0 || score > 10) {
                console.error("Invalid score received from GPT:", response);
                return 0; // Fallback score in case of invalid GPT response
            }
    
            return score;
        } catch (error) {
            console.error("Error in points_for_company_overlap:", error.message);
            return 0; // Fallback to 0 in case of errors
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
    
    async points_for_dealsize(positions, project) {
        const client = this.openAIClient;
    
        // Extract deal sizes from positions
        const dealsizes = positions.map(position => position?.details?.average_deal_size || 0);
    
        // Construct the prompt
        const prompt = `
            You are an expert at evaluating sales experience alignment. Compare:
            1. Candidate's average deal size(s): ${JSON.stringify(dealsizes)}
            2. Required deal size: ${project.minimum_deal_size}
    
            Score from 0-10 based on deal size alignment:
               - 10: Within 20% higher or lower of required deal size (optimal range)
               - 7-9: Within 50% higher or lower (good alignment)
               - 4-6: Within 75% lower OR up to 2x higher (moderate alignment)
               - 1-3: >75% lower OR 2-3x higher (significant mismatch)
               - 0: Deal size <10% of requirement OR >3x higher (too different in scale)
    
            Consider: Selling $50K products shows readiness for $60K sales, but $1K to $60K is too big a gap.
            Provide only the numeric score (0-10).
        `;
    
        // Use the modularized API call function
        return await getChatCompletion(client, prompt, 'gpt-4o-mini');
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
    

    points_for_outbound(positions, project, type = "outbound") {
        // Validate input
        if (!positions || positions.length === 0 || !project[`${type}_range`]) {
            return 0; // Return 0 if no positions or project data is missing
        }
    
        // Recency weighting logic
        const weightByRecency = (yearsAgo) => {
            if (yearsAgo <= 3) return 3; // High priority for recent experience
            if (yearsAgo <= 5) return 2; // Medium priority
            return 1; // Lower priority for older experience
        };
    
        // Calculate weighted contributions based on type (inbound or outbound)
        const weightedContributions = positions.reduce((acc, position) => {
            if (position.details && position.details[type]) {
                const recencyWeight = weightByRecency(position.details.years_ago || 10); // Default to 10 years ago
                return acc + position.details[type] * recencyWeight;
            }
            return acc;
        }, 0);
    
        // Calculate total weight
        const totalWeight = positions.reduce((acc, position) => {
            const recencyWeight = weightByRecency(position.details?.years_ago || 10); // Default to 10 years ago
            return acc + recencyWeight;
        }, 0);
    
        // Calculate the weighted average
        const averageContributions = totalWeight > 0 ? weightedContributions / totalWeight : 0;
    
        // Compare the average with the project's range for the given type
        const range = project[`${type}_range`];
        if (averageContributions >= range) {
            return 10; // Perfect match or exceeds the target
        } else {
            // Calculate normalized points
            const ratio = averageContributions / range;
            return Math.round(ratio * 10);
        }
    }
    
    async points_for_persona(positions: any[], selectedPersona: string[], projectRole: any): Promise<number> {
        const client = this.openAIClient;
    
        // Extract candidate personas
        const candidatePersonas = positions.flatMap(position => position?.details?.persona || []);
    
        // Error handling for missing data
        if (!candidatePersonas.length || !selectedPersona.length) {
            return 0; // No match possible
        }
    
        // OpenAI Prompt
        const prompt = `
            You are an expert in job role evaluation. Assess the similarity between a candidate's listed personas and the personas required for a job role. Consider the following:
            1. Contextual relevance: How closely the candidate's personas align with the job personas.
            2. Synonyms and related roles: Consider synonymous or closely related roles (e.g., "Developer" and "Engineer").
            3. Role-specific expectations: For leadership roles, prioritize personas indicating senior-level experience (e.g., "Director," "VP").
    
            Assign a score from 0 to 10:
            - 10: Perfect alignment (all required personas covered or strongly related).
            - 7-9: High alignment (most personas align closely).
            - 4-6: Partial alignment (some overlap but significant gaps).
            - 1-3: Minimal alignment (few or loosely related matches).
            - 0: No relevant alignment.
    
            Candidate Personas: ${JSON.stringify(candidatePersonas)}
            Job Required Personas: ${JSON.stringify(selectedPersona)}
            Project Role: ${projectRole}
    
            Provide only the numeric score as output.
        `;
    
        try {
            const response: any = await getChatCompletion(client, prompt, 'gpt-4o');
            const score = parseFloat(response);
    
            // Validate and return the score
            if (isNaN(score) || score < 0 || score > 10) {
                console.error("Invalid score from GPT:", response);
                return 0; // Fallback score
            }
            return score;
        } catch (error) {
            console.error("Error in points_for_persona:", error.message);
            throw new Error("Failed to calculate points for persona.");
        }
    }
       

    calculateTotalYears(positions) {
        if (!positions || positions.length === 0) {
            return 0; // No positions to calculate
        }
    
        let uniquePeriods = new Set();
    
        positions.forEach(position => {
            const startYear = position.start_year;
            const startMonth = position.start_month;
            let endYear = position.end_year;
            let endMonth = position.end_month;
    
            // Use current date for ongoing roles
            const currentDate = new Date();
            if (endYear === null || endMonth === null) {
                endYear = currentDate.getFullYear();
                endMonth = currentDate.getMonth() + 1;
            }
    
            // Add all months within the start and end period
            for (let year = startYear; year <= endYear; year++) {
                const monthStart = year === startYear ? startMonth : 1;
                const monthEnd = year === endYear ? endMonth : 12;
    
                for (let month = monthStart; month <= monthEnd; month++) {
                    uniquePeriods.add(`${year}-${month}`);
                }
            }
        });
    
        // Calculate total years from unique periods
        const totalMonths = uniquePeriods.size;
        const totalYears = totalMonths / 12;
        return parseFloat(totalYears.toFixed(2)); // Round to 2 decimal places
    }


    // Points for Location:

    async points_for_location(candidateLocation: any, jobLocation: any): Promise<number> {
        const client = this.openAIClient;
    
        const locationPrompt = `
            You are an expert in geographic location matching for hiring. Assign a score (0-10) based on how well the candidate's location matches the job location.
    
            Scoring Rules:
            - If candidate and job are in the same **city** → 10
            - If candidate and job are in the same **province/state** but different cities → 10
            - If candidate and job are in the same **country** but different provinces/states → 9
            - If candidate and job are in **different countries** → 0
    
            Candidate Location: "${candidateLocation}"
            Job Location: "${jobLocation}"
    
            Output only a single numerical score (0-10).
        `;
    
        try {
            const gptResponse: string = await client.chat.completions
                .create({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: locationPrompt }],
                })
                .then((res) => res.choices[0].message?.content || '');
    
            const score = parseInt(gptResponse.trim());
            return isNaN(score) ? 0 : score; // Fallback to 0 if the response is invalid
        } catch (error) {
            console.error("Error fetching location score from GPT:", error.message);
            return 0; // Default to 0 in case of API failure
        }
    }
    
    

    points_for_years(positions, project) {
        if (!positions || positions.length === 0 || !project.experience) {
            return 0; // No data to compare
        }
    
        const totalYears = this.calculateTotalYears(positions);
    
        if (totalYears >= project.experience) {
            return 10; // Perfect match or exceeds target
        } else {
            // Calculate proportional score
            const ratio = totalYears / project.experience;
            return Math.round(ratio * 10);
        }
    }
    
}
