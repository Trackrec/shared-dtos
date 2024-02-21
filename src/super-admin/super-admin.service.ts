// super-admin.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Company } from 'src/company/company.entity';
import { Repository } from 'typeorm';
import { SharedService } from 'src/shared/shared.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly sharedService: SharedService
  ) {}

  async getAllUsers() {
    try {
        const users = await this.userRepository.find({where:{role:'Applicant'},  select: ['id', 'full_name', 'email', 'created_at', 'last_accessed_at', 'is_preferences_save'] });
        if (!users || users.length === 0) {
        return { error: false, data: [] };
      }
      return { error: false,  data: users };
    } catch (error) {
      return { error: true, message: 'Error fetching users: ' + error.message };
    }
  }

  async getUserDetails(user_id:any){
    try{
    let user= await this.userRepository.findOne({where:{id:user_id},  relations: ["keywords",'positions', 'positions.details']})
     if(!user){
        return { error: true, message: 'User not found.' };
     }
     delete user.password;

     (user as any).imported_positions = user.positions.length;

     let is_completed: boolean=false;
     let totalRevenue=0;

     for(let i=0;i<user.positions.length;i++){
         let completion_percentage=(user.positions[i] && user.positions[i]?.details) ? this.sharedService.calculateCompletionPercentage(user.positions[i]) : 0.0
         is_completed= completion_percentage==100.0? true : false

         if(is_completed){
            totalRevenue+=+user.positions[i].details.revenue_generated;
         }
     }
     (user as any).completed_positions= is_completed;
     (user as any).total_revenue_generated = totalRevenue;
     (user as any).total_years_experience=this.sharedService.calculateExperience(user.positions)

     delete user.positions;
     return {error: false, user}

    }
    catch(e){
        return { error: true, message: 'User not found.' };

    }

  }

  async impersonateUser(body:any){
    try{
      const {user_id, email}= body;
      if(!user_id || !email ){
        return {error: true, message: "Please send all the required fields."}
      }
      let user= await this.userRepository.findOne({where:{id:user_id, email}})

      if(!user){
        return {error:true, message: "User not found."}
      }
     
      const payload = {
        user_id,
        email,
  
      };
  
      const token= jwt.sign(payload, process.env.JWT_SECRET, { expiresIn:'24h' });
      return {error: false, token}

    }
    catch(e){
      return {error: true, message:"Not able to impersonate."}
    }
  }

  async updateBlockStatus( body: any) {
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


  async getAllCompanies(){
      try{
        const companies= await this.companyRepository.find()
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
