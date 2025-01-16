// company.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import axios from 'axios';
import { CompaniesListDto, CompanyDto, CompanyCreateResponseDto, CompanyUpdateResponseDto, CompanyByIdDto } from 'src/shared-dtos/src/company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async createCompany(companyData: Partial<Company>): Promise<CompanyCreateResponseDto> {
    try {
      const company: CompanyDto = this.companyRepository.create(companyData);
      const createdCompany = await this.companyRepository.save(company);

      return { error: false, createdCompany };
    } catch (error) {
      return { error: true, message: `Error creating company: ${error.message}` };
    }
  }

  async getCompanies(): Promise<CompaniesListDto> {
    try {
      const companies: CompanyDto[] = await this.companyRepository.find();
      return { error: false, companies };
    } catch (error) {
      return { error: true, message: `Error getting companies: ${error.message}` };
    }
  }

  async getCompanyById(id: string): Promise<CompanyByIdDto> {
    try {
      const company: CompanyDto = await this.companyRepository.findOne({where:{id}});
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return { error: false, company };
    } catch (error) {
      return { error: true, message: `Error getting company by ID: ${error.message}` };
    }
  }

  async searchCompany(company_name: string) {
    try {
        if (!company_name) {
            return {
                error: true,
                message: "company_name is required."
            }
        }
        const resp = await axios.get(
            `https://api.apollo.io/api/v1/mixed_companies/search?api_key=${"OxlHrj_L0t16QUJvC-7nrA"}&q_organization_name=${company_name}`
        );

        return {
            error: false,
            data: resp.data
        };
    } catch (e) {
        return {
            error: true,
            message: "Not able to search companies."
        }
    }
}

  async updateCompany(id: string, companyData: Partial<CompanyDto>): Promise<CompanyUpdateResponseDto> {
    try {
      await this.getCompanyById(id); // Check if the company exists

      await this.companyRepository.update(id, companyData);
      const updatedCompany: CompanyDto = await this.companyRepository.findOne({where:{id}});

      return { error: false, updatedCompany };
    } catch (error) {
      return { error: true, message: `Error updating company: ${error.message}` };
    }
  }

  async deleteCompany(id: string): Promise<{ error: boolean; message?: string }> {
    try {
      await this.getCompanyById(id); // Check if the company exists

      await this.companyRepository.delete(id);
      return { error: false, message: 'Company deleted successfully' };
    } catch (error) {
      return { error: true, message: `Error deleting company: ${error.message}` };
    }
  }
}
