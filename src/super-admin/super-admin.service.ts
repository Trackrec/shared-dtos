// super-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Company } from 'src/company/company.entity';
import { In, Repository } from 'typeorm';
import { SharedService } from 'src/shared/shared.service';
import * as jwt from 'jsonwebtoken';
import {
  AdminBlockRequestDto,
  AllUsersDto,
  CompaniesListDto,
  ExtendedUserDto,
  GetUserDetailsResponseDto,
  ImpersonateUserRequestDto,
  RecruiterUserAuthResponseDto,
  UserDto,
} from 'src/shared-dtos/src/user.dto';
import { CompanyDto } from 'src/shared-dtos/src/company.dto';
import { configurations } from '../config/env.config';

const { jwtSecret } = configurations;
@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly sharedService: SharedService,
  ) {}

  async getAllUsers(): Promise<AllUsersDto> {
    try {
      this.logger.log('info', 'Fetching all users with role "Applicant" or "Super-Admin"');

      const users: UserDto[] = await this.userRepository.find({
        where: {
          role: In(['Applicant', 'Super-Admin']),
        },
        select: [
          'id',
          'full_name',
          'email',
          'created_at',
          'last_accessed_at',
          'is_preferences_save',
        ],
      });

      if (!users || users.length === 0) {
        this.logger.log('warn', 'No users found with role "Applicant" or "Super-Admin"');
        return { error: false, data: [] };
      }

      this.logger.log('info', `Successfully fetched ${users.length} users`);
      return { error: false, data: users };
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      return { error: true, message: 'Error fetching users: ' + error.message };
    }
  }

  async getUserDetails(userId: number): Promise<GetUserDetailsResponseDto> {
    try {
      this.logger.log(`Fetching details for user ID: ${userId}`);

      const user: UserDto = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['positions', 'positions.details', 'positions.company'],
      });

      if (!user) {
        this.logger.log('warn', `User not found with ID: ${userId}`);
        return { error: true, message: 'User not found.' };
      }

      this.logger.log(`Successfully fetched user details for user ID: ${userId}`);

      delete user.password;

      const extendedUser: ExtendedUserDto = {
        ...user,
        imported_positions: user.positions.length,
        npm: false,
        total_revenue: 0,
        total_years_experience: this.sharedService.calculateExperience(user.positions),
        total_bdr_experience: this.sharedService.calculateExperience(user.positions, 'bdr'),
        total_leadership_experience: this.sharedService.calculateExperience(
          user.positions,
          'leadership',
        ),
        total_individual_contributor_experience: this.sharedService.calculateExperience(
          user.positions,
          'individual_contributor',
        ),
      };

      this.logger.log(`Calculating total revenue and experience for user ID: ${userId}`);

      let totalRevenue = 0;
      const updatedPositions = user.positions.map((position) => {
        const completionPercentage = position.details
          ? this.sharedService.calculateCompletionPercentage(position)
          : 0.0;
        const isCompleted = completionPercentage === 100.0;

        if (isCompleted) {
          totalRevenue += +position.details.revenue_generated;
        }

        return {
          ...position,
          is_completed: isCompleted,
          completion_percentage: completionPercentage,
        };
      });

      extendedUser.npm = updatedPositions.some((pos) => pos.is_completed);
      extendedUser.total_revenue = totalRevenue;

      delete extendedUser.positions;

      this.logger.log(`Returning extended user details for user ID: ${userId}`);

      return { error: false, user: extendedUser };
    } catch (e) {
      this.logger.error(`Error fetching user details for user ID: ${userId}: ${e.message}`);
      return { error: true, message: 'User not found.' };
    }
  }

  async impersonateUser(body: ImpersonateUserRequestDto): Promise<RecruiterUserAuthResponseDto> {
    try {
      const { user_id: userId, email, username }: ImpersonateUserRequestDto = body;

      this.logger.log(`Attempting to impersonate user with ID: ${userId}`);

      if (!userId || !email) {
        this.logger.warn('Required fields missing: user_id or email');
        return { error: true, message: 'Please send all the required fields.' };
      }

      const user: UserDto = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        return { error: true, message: 'User not found.' };
      }

      this.logger.log(`User found with ID: ${userId}, proceeding with impersonation`);

      const payload = {
        id: userId,
        email,
        username,
      };

      const token: string = jwt.sign(payload, jwtSecret, { expiresIn: '30d' });

      this.logger.log(`Impersonation successful for user ID: ${userId}`);

      return { error: false, token };
    } catch (e) {
      this.logger.error(`Error during impersonation process: ${e.message}`);
      return { error: true, message: 'Not able to impersonate.' };
    }
  }

  async updateBlockStatus(
    body: AdminBlockRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    const { block_status: blockStatus, user_id: userId } = body;

    if (blockStatus === undefined || blockStatus === null) {
      this.logger.warn('block_status field is required');
      return { error: true, message: 'block_status field is required' };
    }

    try {
      this.logger.log(
        `Updating block status for user ID: ${userId} to ${blockStatus ? 'Blocked' : 'Unblocked'}`,
      );

      await this.userRepository.update({ id: userId }, { blocked: blockStatus });

      this.logger.log(`Successfully updated block status for user ID: ${userId}`);
      return { error: false, message: 'Block status updated successfully!' };
    } catch (error) {
      this.logger.error(
        `Error during updating block status for user ID: ${userId}: ${error.message}`,
      );
      return { error: true, message: 'Error during updating block status.' };
    }
  }

  async getAllCompanies(): Promise<CompaniesListDto> {
    try {
      this.logger.log('Fetching all companies');

      const companies: CompanyDto[] = await this.companyRepository.find();

      if (!companies || companies.length === 0) {
        this.logger.log('warn', 'No companies found');
        return { error: false, data: [] };
      }

      this.logger.log(`Successfully fetched ${companies.length} companies`);
      return { error: false, data: companies };
    } catch (error) {
      this.logger.error(`Error fetching companies: ${error.message}`);
      return { error: true, message: 'Error fetching companies: ' + error.message };
    }
  }
}
