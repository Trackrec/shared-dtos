// super-admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Company } from 'src/company/company.entity';
import { In, Repository } from 'typeorm';
import { SharedService } from 'src/shared/shared.service';
import * as jwt from 'jsonwebtoken';
import { AdminBlockRequestDto, AllUsersDto, CompaniesListDto, ExtendedUserDto, GetUserDetailsResponseDto, ImpersonateUserRequestDto, RecruiterUserAuthResponseDto, UserDto } from 'src/shared-dtos/src/user.dto';
import { CompanyDto } from 'src/shared-dtos/src/company.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly sharedService: SharedService
  ) {}

  async getAllUsers():Promise<AllUsersDto> {
    try {
      const users: UserDto[] = await this.userRepository.find({
        where: {
          role: In(['Applicant', 'Super-Admin'])
        },
        select: ['id', 'full_name', 'email', 'created_at', 'last_accessed_at', 'is_preferences_save']
      });
      if (!users || users.length === 0) {
        return { error: false, data: [] };
      }
      return { error: false,  data: users };
    } catch (error) {
      return { error: true, message: 'Error fetching users: ' + error.message };
    }
  }

  async getUserDetails(user_id: number): Promise<GetUserDetailsResponseDto> {
    try {
      let user: UserDto = await this.userRepository.findOne({
        where: { id: user_id },
        relations: ['positions', 'positions.details', 'positions.company'],
      });
  
      if (!user) {
        return { error: true, message: 'User not found.' };
      }
  
      delete user.password;
  
      const extendedUser: ExtendedUserDto = {
        ...user,
        imported_positions: user.positions.length,
        npm: false,
        total_revenue: 0,
        total_years_experience: this.sharedService.calculateExperience(user.positions),
        total_bdr_experience: this.sharedService.calculateExperience(user.positions, 'bdr'),
        total_leadership_experience: this.sharedService.calculateExperience(user.positions, 'leadership'),
        total_individual_contributor_experience: this.sharedService.calculateExperience(user.positions, 'individual_contributor'),
      };
  
      let totalRevenue = 0;
      const updated_positions = user.positions.map((position) => {
        const completion_percentage = position.details
          ? this.sharedService.calculateCompletionPercentage(position)
          : 0.0;
        const is_completed = completion_percentage === 100.0;
  
        if (is_completed) {
          totalRevenue += +position.details.revenue_generated;
        }
  
        return {
          ...position,
          is_completed,
          completion_percentage,
        };
      });
  
      extendedUser.npm = updated_positions.some((pos) => pos.is_completed);
      extendedUser.total_revenue = totalRevenue;
  
      delete extendedUser.positions;
  
      return { error: false, user: extendedUser };
    } catch (e) {
      return { error: true, message: 'User not found.' };
    }
  }
  

  async impersonateUser(body:ImpersonateUserRequestDto): Promise<RecruiterUserAuthResponseDto>{
    try{
      const {user_id, email, username}: ImpersonateUserRequestDto= body;
      if(!user_id || !email ){
        return {error: true, message: "Please send all the required fields."}
      }
      let user: UserDto= await this.userRepository.findOne({where:{id:user_id}})

      if(!user){
        return {error:true, message: "User not found."}
      }
     
      const payload = {
        id: user_id,
        email,
        username
  
      };
  
      const token: string= jwt.sign(payload, process.env.JWT_SECRET, { expiresIn:'30d' });
      return {error: false, token}

    }
    catch(e){
      return {error: true, message:"Not able to impersonate."}
    }
  }

  async updateBlockStatus( body: AdminBlockRequestDto): Promise<{error: boolean; message: string}> {
    const { block_status, user_id } = body;
    if (block_status === undefined || block_status === null) {
        return { error: true, message: "block_status field is required" };
    }
    try {
        await this.userRepository.update({id:user_id}, { blocked: block_status });
        return { error: false, message: "Block status updated successfully!" };
    } catch (error) {
        return { error: true, message: "Error during updating block status." };
    }
}


  async getAllCompanies(): Promise<CompaniesListDto>{
      try{
        const companies: CompanyDto[]= await this.companyRepository.find()
        if(!companies || companies.length==0){
            return {error: false, data: []}
        }
        return { error: false,  data: companies };

      }
      catch(error){
        return { error: true, message: 'Error fetching companies: ' + error.message };

      }
  }

}
