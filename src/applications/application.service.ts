// application.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectApplication } from './application.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ProjectApplication)
    private readonly applicationRepository: Repository<ProjectApplication>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(AccountProject)
    private readonly projectRepository
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
           const application = new ProjectApplication();
           application.ote = ote;
           application.available = available;
           application.user=user;
           application.project= project

           await this.applicationRepository.save(application);

           return {error: false, message: "Application created successfully."}
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
}
