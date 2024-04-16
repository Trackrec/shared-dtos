// publish-profile.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { SharedService } from 'src/shared/shared.service';
@Injectable()
export class PublishProfileService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(AccountsVisitors)
    private readonly visitorRepository: Repository<AccountsVisitors>,
    @InjectRepository(AnalyticsAccess)
    private readonly analyticsRepository: Repository<AnalyticsAccess>,
    private readonly sharedService: SharedService
  ) {}

  async publishProfile(userId: number): Promise<{ error: boolean, message: string }> {
    try {
      const user = await this.userRepository.findOne({where:{id:userId}});

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      user.published_at = new Date();
      await this.userRepository.save(user);

      return { error: false, message: 'Profile published successfully' };
    } catch (error) {
      console.error('Error publishing profile:', error);
      return { error: true, message: 'Internal server error' };
    }
  }

  async getProfileViews(user_id) {
    try {
      const analyticsAccessRecords = await this.analyticsRepository.find({
        where: {
          user: {
            id: user_id
          }
        },
        relations: ['accountVisitor'], 
        order: {
          created_at: 'DESC' 
        }
      });
  
      return {error:false, views: analyticsAccessRecords};
    } catch (error) {
      console.error('Error fetching profile views:', error);
      return {error: true, message:"views not found."}
    }
  }
  

  async track_view(userId: number, visitor_id: number): Promise<void> {
    try {
      // Find the visitor by id
      const visitor = await this.userRepository.findOne({where:{id:visitor_id}});
  
      // If visitor exists, create a new visitor and save it
      if (visitor) {
        const newVisitor = this.visitorRepository.create({
          email: visitor.email,
          full_name: visitor.full_name,
          linkedin_access_token: visitor.linkedin_access_token,
        });
        const createdVisitor = await this.visitorRepository.save(newVisitor);
  
        // Create new analytics entry
        const newAnalytics = this.analyticsRepository.create({
          type: 'view',
          accountVisitor: { id: createdVisitor.id },
          user: { id: userId },
        });
  
        await this.analyticsRepository.save(newAnalytics);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }
  
  async findUserByIdAndName(userId: number, userName: string, visitor_id: number): Promise<UserAccounts | null> {
    const formattedName = userName.replace(/-/g, ' ').toLowerCase();

    if(visitor_id && visitor_id!=userId){
        this.track_view(userId, visitor_id)
    }
    let user = await this.userRepository.findOne({ where: { id: userId } ,  relations: ['positions', 'positions.details', 'positions.company','positions.verify_request'],});
    if (!user || user.full_name.toLowerCase() !== formattedName) {
      return null;
    }
    delete user.password;
    delete user.linkedin_access_token;
    if(user && user.positions && user.positions.length>0){
      let updated_positions=[]
      let totalRevenue=0;
      
      for(let i=0;i<user.positions.length;i++){
        let completion_percentage=(user.positions[i] && user.positions[i]?.details) ? this.sharedService.calculateCompletionPercentage(user.positions[i]) : 0.0

        let is_completed: boolean= completion_percentage==100.0? true : false
        updated_positions.push({
          ...user.positions[i],
          is_completed: is_completed,
          completion_percentage
        })
        if(is_completed){
          totalRevenue+=+user.positions[i].details.revenue_generated;
        }
      }
      (user as any).total_revenue=totalRevenue;
      (user as any).total_years_experience=this.sharedService.calculateExperience(user.positions)
      const {existing_business_average, new_business_average}= this.sharedService.calculateWeightedAverageForBusiness(user.positions);
      const {outbound_average, inbound_average}= this.sharedService.calculateWeightedAverageForOutbound(user.positions);
      const {smb_average, midmarket_average, enterprise_average}= this.sharedService.calculateWeightedAverageForSegment(user.positions);
      (user as any).weightedAverageExistingBusiness=existing_business_average;
      (user as any).weightedAverageNewBusiness=new_business_average;
      (user as any).outbound_average=outbound_average;
      (user as any).inbound_average=inbound_average;
      (user as any).smb_average=smb_average;
      (user as any).midmarket_average=midmarket_average;
      (user as any).enterprise_average=enterprise_average;


      user.positions=updated_positions
    }


    (user as any).total_years_experience=this.sharedService.calculateExperience(user.positions)
     user.positions=user.positions.filter((position)=>(position as any).is_completed)
    return user;
  }
}
