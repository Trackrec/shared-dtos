// application.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectApplication } from './application.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ProjectApplication)
    private readonly applicationRepository: Repository<ProjectApplication>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(RecruiterProject)
    private readonly projectRepository: Repository<RecruiterProject>,
    @InjectRepository(RecruiterCompanyUser)
    private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>,
  ) {}

  async createApplication(body: any, userId: number): Promise<any> {
    try{
           const {project_id, ote, available}=body;
           if(!project_id || !ote || !available){
            return {error: true, message: "Please send all the required fields."}
           }
           const user=await this.userRepository.findOne({where:{id: userId}})
           if(!user){
            return {error: true, message: "User not found."}
           }
           const project=await this.projectRepository.findOne({where: {id: project_id}})
           if(!project){
            return {error:true, message: "Project not found."}
           }
          // check  if this user has already created application for this project
          const applicationExists=await this.applicationRepository.findOne({where:{user:{id:userId}, project: {id: project_id}}})
          console.log('applicationExists :>> ', applicationExists);
          if(!applicationExists){
            const application = new ProjectApplication();
            application.ote = ote;
            application.available = available;
            application.user=user;
            application.project= project
 
            await this.applicationRepository.save(application);
 
            return {error: false, message: "Application created successfully."}
          }else{
            return {error: true, message: "Application already exists"}
          }
          
    }
    catch(e){
        return {error: true, message: "Application not created."}
    }
    
    
  }

  async getMyApplications(user_id: number){
    try{
      let applications=await this.applicationRepository.find({where:{user:{id:user_id}},relations: ['project']}, )
     
      applications.map(application => ({
        projectTitle: application.project.title
      }));
      return {error: false, applications}

    }
    catch(e){
        return {error: true, message: "Not able to get applications."}
    }
  }

  async deleteApplicationsForUserAndCompany(userId: number, loggedInUser: number): Promise<any> {
    try {
      // Check if the logged-in user is an Admin
      const checkAdmin = await this.userRepository.findOne({
        where: { id: loggedInUser, role: 'Admin' },
      });
  
      if (!checkAdmin) {
        return { error: true, message: 'You are not an admin User.' };
      }

      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
      
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      // Delete applications for the specified user and company
      await this.applicationRepository.createQueryBuilder()
        .delete()
        .from(ProjectApplication)
        .where('userId = :userId', { userId })
        .andWhere('projectId IN (SELECT id FROM recruiter_project WHERE companyId = :companyId)', { companyId:recruiterCompanyUser.company.id })
        .execute();
  
      return { error: false, message: 'Applications deleted successfully.' };
    } catch (e) {
      console.log(e);
      return { error: true, message: 'Something went wrong, please try again.' };
    }
  }
  
}
