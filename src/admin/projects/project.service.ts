import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountProject } from './project.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { validate } from 'class-validator';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { ApplicationService } from 'src/applications/application.service';
import { ProjectApplication } from 'src/applications/application.entity';
import { SharedService } from 'src/shared/shared.service';
import { PointsService } from './points.service';
@Injectable()
export class AccountProjectService {
  constructor(
    @InjectRepository(AccountProject)
    private readonly accountProjectRepository: Repository<AccountProject>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(ProjectApplication)
    private readonly applicationService: Repository<ProjectApplication>,
    private readonly uploadService: S3UploadService,
    private readonly sharedService: SharedService,
    private readonly pointsService: PointsService

  ) {}

  async findAll(userId): Promise<any> {
    try{
     const projects=await this.accountProjectRepository.find({where:{user:{id:userId}}});
     return {error: false, projects}
    }
    catch(e){
        return {error: true, message: "Projects not found"}
    }
  }

  async findAllUsersProjects(): Promise<any> {
    try{
     const projects=await this.accountProjectRepository.find();
     return {error: false, projects}
    }
    catch(e){
        return {error: true, message: "Projects not found"}
    }
  }

  async findOne(id: number): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id }});
        if (!project) {
             return {error:true, message: 'Project not found.'};
         }  
         return {error: false, project}
     }
    catch(e){
         return {error: true, message: "Project not found."}
      }
}

  async create(accountProjectData: Partial<AccountProject>, userId:number): Promise<any> {
    try{
    const user= await this.userRepository.findOne({where:{id:userId}})
    accountProjectData.user=user
    const project = this.accountProjectRepository.create(accountProjectData);
    const errors = await validate(project);
    console.log(errors)
    if (errors.length > 0) {
       return {error: true, message: "Please send all the required fields."}
      }
    await this.accountProjectRepository.save(project);
    return {error:false, message:"Project created successfully.",project}
    }
    catch(e){
        return {error: true, message:"Project not created!"}
    }
  }

  async update(userId:number, id: number, accountProjectData: Partial<AccountProject>): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id, user:{id :userId }} });
        if (!project) {
          return {error:true, message: 'Project not found or does not belong to the user.'};
        }
      
        await this.accountProjectRepository.update(id, accountProjectData);   
        return {error: false, message: "Project updated successfully."}
    }
    catch(e){
        return {error:true, message:"Project not updated."}
    }
  }

  async remove(id: number, userId:number): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id, user:{id :userId }} });
        if (!project) {
          return {error:true, message: 'Project not found or does not belong to the user.'};
        }
       await this.accountProjectRepository.delete(id);
       return {error: false, message: "Project Deleted Successfully"}
    }
    catch(e){
        return {error: true, message: "Project not deleted."}
    }
   
  }


  async updateProjectPicture(id: number, image, user_id: number): Promise<{ error: boolean, message: string }> {
    try {
    const project = await this.accountProjectRepository.findOne({where:{id, user:{id:user_id}}});
    if (!project) {
      return { error: true, message: 'Project not found or you are not the owner of project.' };
    }
      let storedImage=await this.uploadService.uploadNewImage(image, "project_images")
      if(storedImage)
      project.project_image=storedImage;
      

      await this.accountProjectRepository.save(project);

      return { error: false, message: 'Project Image updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update project image.' };
    }
  }


  calculatePointsForUser = (application) => {

    let otePoints: any = 0.0;
    let worked_in_points:any=0.0;
    let sold_to_points:any=0.0;
    let segment_points: any=0.0;
    
    if(application.user.positions.length==0){
      return {
        ote_points: 0,
        worked_in_points: 0,
        sold_to_points: 0,
        segment_points: 0

      }
    }
    otePoints= this.pointsService.points_for_ote(application.user.ote_expectation, application.ote); 
    worked_in_points= this.pointsService.points_for_worked_in(application.user.positions, application.project.Industry_Works_IN)
    sold_to_points= this.pointsService.points_for_sold_to(application.user.positions, application.project.Industry_Sold_To)
    segment_points= this.pointsService.points_for_segment(application.user.positions, application.project)
  
    return {
      ote_points: otePoints,
      worked_in_points,
      sold_to_points,
      segment_points

    };
  };
  async getRanking(project_id: number, user_id:number){
    try{
      const applications = await this.applicationService
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.project", "project")
      .leftJoinAndSelect("application.user", "user")
      .leftJoinAndSelect("user.positions", "position")
      .leftJoinAndSelect("position.details", "detail")
      .where("project.id = :projectId", { projectId: project_id })
     
      .getMany();
  
    console.log(applications)
    let updatedApplications = applications.map(application => ({
      ...application, 
      user: {
        ...application.user, 
        positions: application.user.positions.filter(position => {
          if (!position.details) {
            return false;
          }
          let completionPercentage = position.details ? this.sharedService.calculateCompletionPercentage(position) : 0.0;
          return completionPercentage === 100.0;
        })

      }
    }));

    const updatedApplicationsWithUserPoints = updatedApplications.map(application => {
      const updatedUser = this.calculatePointsForUser(application);
      return {
        ...application,
        user: {...application.user, points :updatedUser}
      };
    });
    return {error: false, updatedApplicationsWithUserPoints}

       
    }
    catch(e){
      console.log(e)
      return {error: true, message: "Error for getting ranking, try again."}
    }
  }
}
