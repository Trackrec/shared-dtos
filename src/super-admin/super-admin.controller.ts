// super-admin.controller.ts
import { Body, Controller, Get, Logger, Param, Post, Req } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import {
  AdminBlockRequestDto,
  AllUsersDto,
  CompaniesListDto,
  GetUserDetailsParamDto,
  GetUserDetailsResponseDto,
  ImpersonateUserRequestDto,
  RecruiterUserAuthResponseDto,
} from 'src/shared-dtos/src/user.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import {
  adminBlockRequestSchema,
  getUserDetailsParamSchema,
  impersonateUserRequestSchema,
} from 'src/validations/user.validation';

@Controller()
export class SuperAdminController {
  private readonly logger = new Logger(SuperAdminController.name);

  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('get_all_users')
  getAllUsers(): Promise<AllUsersDto> {
    this.logger.log('Fetching all users');
    return this.superAdminService.getAllUsers();
  }

  @Get('get_user_details/:userId')
  getUserDetails(
    @Param(new ZodValidationPipe(getUserDetailsParamSchema)) param: GetUserDetailsParamDto,
  ): Promise<GetUserDetailsResponseDto> {
    const { userId } = param;
    this.logger.log(`Fetching details for user ID: ${userId}`);
    return this.superAdminService.getUserDetails(userId);
  }

  @Get('get_all_companies')
  getAllCompanies(): Promise<CompaniesListDto> {
    this.logger.log('Fetching all companies');
    return this.superAdminService.getAllCompanies();
  }

  @Post('update_block_user_status')
  blockUser(
    @Req() req: Request,
    @Body(new ZodValidationPipe(adminBlockRequestSchema)) body: AdminBlockRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.log(`Blocking user `);
    return this.superAdminService.updateBlockStatus(body);
  }

  @Post('impersonate_user')
  impersonateUser(
    @Req() req: Request,
    @Body(new ZodValidationPipe(impersonateUserRequestSchema)) body: ImpersonateUserRequestDto,
  ): Promise<RecruiterUserAuthResponseDto> {
    this.logger.log(`Impersonating user`);
    return this.superAdminService.impersonateUser(body);
  }
}
