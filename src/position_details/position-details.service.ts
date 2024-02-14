import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PositionDetails } from './position_details.entity';
import { Position } from 'src/positions/positions.entity';
import { Company } from 'src/company/company.entity';
import { CompanyService } from 'src/company/company.service';
@Injectable()
export class PositionDetailsService {
  constructor(
    @InjectRepository(PositionDetails)
    private readonly positionDetailsRepository: Repository<PositionDetails>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly companyService: CompanyService

    
  ) {}

  async createOrUpdatePositionDetails(data: { position_id: any, positionData: any, companyData: any, [key: string]: any }): Promise<{ error: boolean, message?: string, data?: any }> {
    try {
        const { position_id, positionData, companyData, ...restData } = data;

        if (!position_id) {
            return { error: true, message: 'Position ID is required.' };
        }

        // Find or create company
        let company
        company = await this.companyRepository.findOne({ where: [{ name: companyData.company_name }, { domain: companyData?.domain }] });

        if (!company) {
            const newCompany = await this.companyService.createCompany({
                name: companyData?.name,
                logo_url: companyData.logo_url ? companyData.logo_url : null,
                domain: companyData.domain ? companyData.domain : null
            });

            if (newCompany.error) {
                return { error: true, message: 'Error creating company.' };
            }

            company = { id: newCompany.createdCompany.id };
        }

        // Find position
        let position = await this.positionRepository.findOne({ where: { id: parseInt(position_id) } });
        if (!position) {
            return { error: true, message: 'Position not found.' };
        }

        // Merge position data
        positionData.company = { id: company.id };
        position = this.positionRepository.merge(position, positionData);
        await this.positionRepository.save(position);

        // Find or create position details
        let positionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

        if (!positionDetails) {
            positionDetails = this.positionDetailsRepository.create({
                position_id: position_id,
                ...restData,
            });
        } else {
            positionDetails = this.positionDetailsRepository.merge(positionDetails, restData);
        }

        await this.positionDetailsRepository.save(positionDetails);

        return { error: false, message: 'Position details saved successfully.' };
    } catch (error) {
        console.error(error);
        return { error: true, message: 'Internal server error.' };
    }
}

  async getPositionDetails(position_id: string): Promise<{ error: boolean, message?: string, data?: PositionDetails }> {
    try {
      const positionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

      if (!positionDetails) {
        return { error: true, message: 'Position details not found.' };
      }

      return { error: false, data: positionDetails, message: 'Position details retrieved successfully.' };
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Internal server error.' };
    }
  }
}
