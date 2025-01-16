// company.controller.ts
import { Controller, Post, Get, Body, Param, Put, Delete } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { CompaniesListDto, CompanyDto, CompanyCreateResponseDto, CompanyUpdateResponseDto, CompanyByIdDto, CompanyByIdParamDto, SearchCompanyParamDto } from 'src/shared-dtos/src/company.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { companyByIdSchema, companyUpdateSchema, createCompanySchema, searchCompanyParamSchema } from 'src/validations/company.validation';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  
  @Post()
  async createCompany(@Body(new ZodValidationPipe(createCompanySchema)) companyData: Partial<CompanyDto>): Promise<CompanyCreateResponseDto> {
    return await this.companyService.createCompany(companyData);
  }

  @Get()
  async getCompanies(): Promise<CompaniesListDto> {
    return await this.companyService.getCompanies();
  }
  
  @Get(':id')
  async getCompanyById(@Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto): Promise<CompanyByIdDto> {
    const {id}=param
    return await this.companyService.getCompanyById(id);
  }

  @Put(':id')
  
  async updateCompany(
    @Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto,
    @Body(new ZodValidationPipe(companyUpdateSchema)) companyData: Partial<CompanyDto>,
  ): Promise<CompanyUpdateResponseDto> {
    const {id}=param;
    return await this.companyService.updateCompany(id, companyData);
  }

  @Delete(':id')
  async deleteCompany(@Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto): Promise<{ error: boolean; message?: string }> {
    const {id}=param;
    return await this.companyService.deleteCompany(id);
  }

  @Post('search')
  searchCompany( @Body(new ZodValidationPipe(searchCompanyParamSchema)) body: SearchCompanyParamDto) {
    const {company_name}= body;
    return this.companyService.searchCompany(company_name);
  }
}
