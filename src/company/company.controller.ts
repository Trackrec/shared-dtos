import { Controller, Post, Get, Body, Param, Put, Delete, Logger } from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CompaniesListDto,
  CompanyDto,
  CompanyCreateResponseDto,
  CompanyUpdateResponseDto,
  CompanyByIdDto,
  CompanyByIdParamDto,
  SearchCompanyParamDto,
} from 'src/shared-dtos/src/company.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import {
  companyByIdSchema,
  companyUpdateSchema,
  createCompanySchema,
  searchCompanyParamSchema,
} from 'src/validations/company.validation';

@Controller('companies')
export class CompanyController {
  private readonly logger = new Logger(CompanyController.name);

  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async createCompany(
    @Body(new ZodValidationPipe(createCompanySchema)) companyData: Partial<CompanyDto>,
  ): Promise<CompanyCreateResponseDto> {
    this.logger.log(`Creating company with data: ${JSON.stringify(companyData)}`);

    try {
      const result = await this.companyService.createCompany(companyData);
      return result;
    } catch (error) {
      this.logger.error(`Error creating company: ${error.message}`, error.stack);
      return { error: true, message: 'Failed to create company' };
    }
  }

  @Get()
  async getCompanies(): Promise<CompaniesListDto> {
    this.logger.log('Fetching all companies');

    try {
      const result = await this.companyService.getCompanies();
      return result;
    } catch (error) {
      this.logger.error(`Error fetching companies: ${error.message}`, error.stack);
      return { error: true, message: 'Failed to fetch companies' };
    }
  }

  @Get(':id')
  async getCompanyById(
    @Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto,
  ): Promise<CompanyByIdDto> {
    const { id } = param;
    this.logger.log(`Fetching company with ID: ${id}`);

    try {
      const result = await this.companyService.getCompanyById(id);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: 'Failed to fetch company' };
    }
  }

  @Put(':id')
  async updateCompany(
    @Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto,
    @Body(new ZodValidationPipe(companyUpdateSchema)) companyData: Partial<CompanyDto>,
  ): Promise<CompanyUpdateResponseDto> {
    const { id } = param;
    this.logger.log(`Updating company with ID: ${id}`);

    try {
      const result = await this.companyService.updateCompany(id, companyData);
      return result;
    } catch (error) {
      this.logger.error(`Error updating company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: 'Failed to update company' };
    }
  }

  @Delete(':id')
  async deleteCompany(
    @Param(new ZodValidationPipe(companyByIdSchema)) param: CompanyByIdParamDto,
  ): Promise<{ error: boolean; message?: string }> {
    const { id } = param;
    this.logger.log(`Deleting company with ID: ${id}`);

    try {
      const result = await this.companyService.deleteCompany(id);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting company with ID: ${id} - ${error.message}`, error.stack);
      return { error: true, message: 'Failed to delete company' };
    }
  }

  @Post('search')
  async searchCompany(
    @Body(new ZodValidationPipe(searchCompanyParamSchema)) body: SearchCompanyParamDto,
  ) {
    const { company_name: companyName } = body;
    this.logger.log(`Searching for company: ${companyName}`);

    try {
      const result = await this.companyService.searchCompany(companyName);
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching for company: ${companyName} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to search for company' };
    }
  }
}
