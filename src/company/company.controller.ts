// company.controller.ts
import { Controller, Post, Get, Body, Param, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async createCompany(@Body() companyData: Partial<Company>): Promise<{ error: boolean; message?: string; createdCompany?: Company }> {
    return await this.companyService.createCompany(companyData);
  }

  @Get()
  async getCompanies(): Promise<{ error: boolean; message?: string; companies?: Company[] }> {
    return await this.companyService.getCompanies();
  }

  @Get(':id')
  async getCompanyById(@Param('id') id: string): Promise<{ error: boolean; message?: string; company?: Company }> {
    return await this.companyService.getCompanyById(id);
  }

  @Put(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body() companyData: Partial<Company>,
  ): Promise<{ error: boolean; message?: string; updatedCompany?: Company }> {
    return await this.companyService.updateCompany(id, companyData);
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string): Promise<{ error: boolean; message?: string }> {
    return await this.companyService.deleteCompany(id);
  }
}
