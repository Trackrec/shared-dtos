// super-admin.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AdminBlockRequestDto, AllUsersDto, CompaniesListDto, GetUserDetailsParamDto, GetUserDetailsResponseDto, ImpersonateUserRequestDto, RecruiterUserAuthResponseDto } from 'src/shared-dtos/src/user.dto';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { adminBlockRequestSchema, getUserDetailsParamSchema, impersonateUserRequestSchema } from 'src/validations/user.validation';

@Controller()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('get_all_users')
  getAllUsers(): Promise<AllUsersDto> {
    return this.superAdminService.getAllUsers();
  }
  
  @Get('get_user_details/:userId')
  getUserDetails(@Param(new ZodValidationPipe(getUserDetailsParamSchema)) param: GetUserDetailsParamDto): Promise<GetUserDetailsResponseDto> {
    const {userId} = param;
    return this.superAdminService.getUserDetails(userId);
  }

  @Get('get_all_companies')
  getAllCompanies(): Promise<CompaniesListDto>{
    return this.superAdminService.getAllCompanies()
  }
  
  @Post('update_block_user_status')
  blockUser(@Req() req: Request, @Body(new ZodValidationPipe(adminBlockRequestSchema)) body: AdminBlockRequestDto): Promise<{error: boolean; message: string}>  {
    return this.superAdminService.updateBlockStatus(body);
  }

  @Post('impersonate_user')
  impersonateUser(@Req() req: Request, @Body(new ZodValidationPipe(impersonateUserRequestSchema)) body: ImpersonateUserRequestDto): Promise<RecruiterUserAuthResponseDto> {
    return this.superAdminService.impersonateUser(body);
  }

}
