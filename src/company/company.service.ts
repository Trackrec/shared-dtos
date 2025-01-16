import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import axios from 'axios';
import { CompaniesListDto, CompanyDto, CompanyCreateResponseDto, CompanyUpdateResponseDto, CompanyByIdDto } from 'src/shared-dtos/src/company.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async createCompany(companyData: Partial<CompanyDto>): Promise<CompanyCreateResponseDto> {
    this.logger.debug(`Creating a new company with data: ${JSON.stringify(companyData)}`);
    try {
      const company: CompanyDto = this.companyRepository.create(companyData);
      const createdCompany = await this.companyRepository.save(company);
      this.logger.log(`Company created successfully with ID: ${createdCompany.id}`);
      return { error: false, createdCompany };
    } catch (error) {
      this.logger.error(`Error creating company: ${error.message}`, error.stack);
      return { error: true, message: `Error creating company: ${error.message}` };
    }
  }

  async getCompanies(): Promise<CompaniesListDto> {
    this.logger.debug('Fetching all companies');
    try {
      const companies: CompanyDto[] = await this.companyRepository.find();
      this.logger.log(`Fetched ${companies.length} companies`);
      return { error: false, companies };
    } catch (error) {
      this.logger.error(`Error fetching companies: ${error.message}`, error.stack);
      return { error: true, message: `Error getting companies: ${error.message}` };
    }
  }

  async getCompanyById(id: string): Promise<CompanyByIdDto> {
    this.logger.debug(`Fetching company with ID: ${id}`);
    try {
      const company: CompanyDto = await this.companyRepository.findOne({ where: { id } });
      if (!company) {
        this.logger.warn(`Company not found with ID: ${id}`);
        throw new NotFoundException('Company not found');
      }
      this.logger.log(`Company fetched successfully with ID: ${id}`);
      return { error: false, company };
    } catch (error) {
      this.logger.error(`Error fetching company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: `Error getting company by ID: ${error.message}` };
    }
  }

  async searchCompany(company_name: string) {
    this.logger.debug(`Searching for company: ${company_name}`);
    try {
      if (!company_name) {
        this.logger.warn(`Search failed: company_name is required`);
        return { error: true, message: "company_name is required." };
      }

      const resp = await axios.get(
        `https://api.apollo.io/api/v1/mixed_companies/search?api_key=${"OxlHrj_L0t16QUJvC-7nrA"}&q_organization_name=${company_name}`
      );

      this.logger.log(`Search completed for company: ${company_name}`);
      return { error: false, data: resp.data };
    } catch (e) {
      this.logger.error(`Error searching company: ${company_name} - ${e.message}`, e.stack);
      return { error: true, message: "Not able to search companies." };
    }
  }

  async updateCompany(id: string, companyData: Partial<CompanyDto>): Promise<CompanyUpdateResponseDto> {
    this.logger.debug(`Updating company with ID: ${id}`);
    try {
      await this.getCompanyById(id); // Validate existence

      await this.companyRepository.update(id, companyData);
      const updatedCompany: CompanyDto = await this.companyRepository.findOne({ where: { id } });

      this.logger.log(`Company updated successfully with ID: ${id}`);
      return { error: false, updatedCompany };
    } catch (error) {
      this.logger.error(`Error updating company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: `Error updating company: ${error.message}` };
    }
  }

  async deleteCompany(id: string): Promise<{ error: boolean; message?: string }> {
    this.logger.debug(`Deleting company with ID: ${id}`);
    try {
      await this.getCompanyById(id); // Validate existence

      await this.companyRepository.delete(id);
      this.logger.log(`Company deleted successfully with ID: ${id}`);
      return { error: false, message: 'Company deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: `Error deleting company: ${error.message}` };
    }
  }
}
