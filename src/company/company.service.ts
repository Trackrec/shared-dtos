// company.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async createCompany(companyData: Partial<Company>): Promise<{ error: boolean; message?: string; createdCompany?: Company }> {
    try {
      const company = this.companyRepository.create(companyData);
      const createdCompany = await this.companyRepository.save(company);

      return { error: false, createdCompany };
    } catch (error) {
      return { error: true, message: `Error creating company: ${error.message}` };
    }
  }

  async getCompanies(): Promise<{ error: boolean; message?: string; companies?: Company[] }> {
    try {
      const companies = await this.companyRepository.find();
      return { error: false, companies };
    } catch (error) {
      return { error: true, message: `Error getting companies: ${error.message}` };
    }
  }

  async getCompanyById(id: string): Promise<{ error: boolean; message?: string; company?: Company }> {
    try {
      const company = await this.companyRepository.findOne({where:{id}});
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return { error: false, company };
    } catch (error) {
      return { error: true, message: `Error getting company by ID: ${error.message}` };
    }
  }

  async updateCompany(id: string, companyData: Partial<Company>): Promise<{ error: boolean; message?: string; updatedCompany?: Company }> {
    try {
      await this.getCompanyById(id); // Check if the company exists

      await this.companyRepository.update(id, companyData);
      const updatedCompany = await this.companyRepository.findOne({where:{id}});

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
