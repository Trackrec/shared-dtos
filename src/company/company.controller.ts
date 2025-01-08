// company.controller.ts
import { Controller, Post, Get, Body, Param, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { CompaniesListDto, CompanyDto, CompanyCreateResponseDto, CompanyUpdateResponseDto, CompanyByIdDto } from 'src/shared-dtos/src/company.dto';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async createCompany(@Body() companyData: Partial<Company>): Promise<CompanyCreateResponseDto> {
    return await this.companyService.createCompany(companyData);
  }

  @Get()
  async getCompanies(): Promise<CompaniesListDto> {
    return await this.companyService.getCompanies();
  }

  @Get(':id')
  async getCompanyById(@Param('id') id: string): Promise<CompanyByIdDto> {
    return await this.companyService.getCompanyById(id);
  }

  @Put(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body() companyData: Partial<CompanyDto>,
  ): Promise<CompanyUpdateResponseDto> {
    return await this.companyService.updateCompany(id, companyData);
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string): Promise<{ error: boolean; message?: string }> {
    return await this.companyService.deleteCompany(id);
  }

  @Post('search')
  searchCompany( @Body('company_name') company_name: string) {
    return this.companyService.searchCompany(company_name);
  }
}
