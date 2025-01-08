// super-admin.controller.ts
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AdminBlockRequestDto, AllUsersDto, CompaniesListDto, GetUserDetailsResponseDto, ImpersonateUserRequestDto, RecruiterUserAuthResponseDto } from 'src/shared-dtos/src/user.dto';

@Controller()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('get_all_users')
  getAllUsers(): Promise<AllUsersDto> {
    return this.superAdminService.getAllUsers();
  }

  @Get('get_user_details/:userId')
  getUserDetails(@Param('userId') userId: number): Promise<GetUserDetailsResponseDto> {
    return this.superAdminService.getUserDetails(userId);
  }

  @Get('get_all_companies')
  getAllCompanies(): Promise<CompaniesListDto>{
    return this.superAdminService.getAllCompanies()
  }

  @Post('update_block_user_status')
  blockUser(@Req() req: Request, @Body() body: AdminBlockRequestDto): Promise<{error: boolean; message: string}>  {
    return this.superAdminService.updateBlockStatus(body);
  }

  @Post('impersonate_user')
  impersonateUser(@Req() req: Request, @Body() body: ImpersonateUserRequestDto): Promise<RecruiterUserAuthResponseDto> {
    return this.superAdminService.impersonateUser(body);
  }

}
