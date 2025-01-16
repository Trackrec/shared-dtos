import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PositionDetails } from './position_details.entity';
import { Position } from 'src/positions/positions.entity';
import { Company } from 'src/company/company.entity';
import { CompanyService } from 'src/company/company.service';
import { PositionDto } from 'src/shared-dtos/src/Position.dto';
import { PositionDetailsDto, PositionDetailsRequestDto, PositionDetailsResponseDto } from 'src/shared-dtos/src/position_detail.dto';
import { CompanyCreateResponseDto, CompanyDto } from 'src/shared-dtos/src/company.dto';
@Injectable()
export class PositionDetailsService {
    private readonly logger = new Logger(PositionDetailsService.name);
  
  constructor(
    @InjectRepository(PositionDetails)
    private readonly positionDetailsRepository: Repository<PositionDetails>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly companyService: CompanyService

    
  ) {}


  async createOrUpdatePositionDetails(data: PositionDetailsRequestDto): Promise<{ error: boolean, message: string }> {
      const logger = new Logger('PositionDetailsService');
  
      try {
          const { position_id, positionData, companyData, ...restData } = data;
  
          logger.log(`Received request to create or update position details for position ID: ${position_id}`);
  
          if (!position_id) {
              logger.warn('Position ID is missing in the request payload.');
              return { error: true, message: 'Position ID is required.' };
          }
  
          let company: CompanyDto;
          if (companyData) {
              logger.log(`Looking for existing company with ID: ${data.company_id}`);
              
              company = await this.companyRepository.findOne({ where: { company_id: data?.company_id } });
  
              if (!company) {
                  logger.log(`Company not found. Creating a new company with name: ${companyData.name}`);
  
                  const newCompany: CompanyCreateResponseDto = await this.companyService.createCompany({
                      company_id: data?.company_id,
                      name: companyData?.name,
                      logo_url: data.logo_url ? data.logo_url : null,
                      domain: data.domain ? data.domain : null,
                      website_url: data.website_url ? data.website_url : null,
                  });
  
                  if (newCompany.error) {
                      logger.error('Error occurred while creating the company.');
                      return { error: true, message: 'Error creating company.' };
                  }
  
                  company = newCompany.createdCompany;
                  logger.log(`New company created with ID: ${company.company_id}`);
              } else {
                  logger.log(`Company found with ID: ${company.company_id}`);
              }
          }
  
          logger.log(`Searching for position with ID: ${position_id}`);
          let position: Position = await this.positionRepository.findOne({ where: { id: parseInt(position_id) } });
  
          if (!position) {
              logger.warn(`Position not found with ID: ${position_id}`);
              return { error: true, message: 'Position not found.' };
          }
          logger.log(`Position found with ID: ${position_id}`);
  
          if (companyData && positionData) {
              positionData.company = company;
              logger.log(`Assigned company ID: ${company.company_id} to position data`);
          }
  
          logger.log(`Checking for existing position details for position ID: ${position_id}`);
          let positionDetails: PositionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });
  
          if (!positionDetails) {
              logger.log(`No existing position details found. Creating new details for position ID: ${position_id}`);
              positionDetails = this.positionDetailsRepository.create({
                  position_id: position_id,
                  ...restData,
              });
          } else {
              logger.log(`Existing position details found. Updating details for position ID: ${position_id}`);
              positionDetails = this.positionDetailsRepository.merge(positionDetails, restData);
          }
  
          const updatedPositionDetails = await this.positionDetailsRepository.save(positionDetails);
          logger.log(`Position details saved for position ID: ${position_id}`);
  
          let positionUpdate = { details: null, company: null };
  
          if (positionData) {
              if (companyData) positionData.company = company;
              positionData.details = updatedPositionDetails;
          } else {
              if (companyData) positionUpdate.company = { id: company.company_id };
              positionUpdate.details = { id: updatedPositionDetails.id };
          }
  
          position = this.positionRepository.merge(position, positionData ? positionData : positionUpdate);
          await this.positionRepository.save(position);
  
          logger.log(`Position with ID: ${position_id} updated successfully.`);
          return { error: false, message: 'Position details saved successfully.' };
      } catch (error) {
          logger.error(`Error in createOrUpdatePositionDetails: ${error.message}`, error.stack);
          return { error: true, message: 'Missing details please try again.' };
      }
  }
  

  async getPositionDetails(position_id: string): Promise<PositionDetailsResponseDto> {
    try {
        this.logger.log(`Fetching position details for position ID: ${position_id}`);

        const positionDetails: PositionDetailsDto = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

        if (!positionDetails) {
            this.logger.warn(`No position details found for position ID: ${position_id}`);
            return { error: true, message: 'Position details not found.' };
        }

        this.logger.log(`Successfully retrieved position details for position ID: ${position_id}`);
        return { error: false, data: positionDetails, message: 'Position details retrieved successfully.' };
    } catch (error) {
        this.logger.error(`Error fetching position details for position ID: ${position_id} - ${error.message}`, error.stack);
        return { error: true, message: 'Position details not found.' };
    }
}

}
