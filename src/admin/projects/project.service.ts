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
try{
    let otePoints: any = 0.0;
    let worked_in_points:any=0.0;
    let sold_to_points:any=0.0;
    let segment_points: any=0.0;
    let salescycle_points: any=0.0
    let dealsize_points: any=0.0
    let newbusiness_points: any= 0.0;
    let outbound_points: any=0.0
    let points_for_persona: any=0.0
    let points_for_experience: any=0.0
    if(application.user.positions.length==0){
      return {
        points:{ote_points: 0,
        worked_in_points: 0,
        sold_to_points: 0,
        segment_points: 0,
        salescycle_points: 0, 
        dealsize_points: 0,
        newbusiness_points: 0,
        outbound_points:0, 
        points_for_persona: 0, 
        points_for_experience: 0},
        percentage: 0

      }
    }
    otePoints= this.pointsService.points_for_ote(parseInt(application.user.ote_expectation), parseInt(application.ote)); 
    worked_in_points= this.pointsService.points_for_worked_in(application.user.positions, application.project.Industry_Works_IN)
    sold_to_points= this.pointsService.points_for_sold_to(application.user.positions, application.project.Industry_Sold_To)
    segment_points= this.pointsService.points_for_segment(application.user.positions, application.project)
    salescycle_points= this.pointsService.points_for_sales_cycle(application.user.positions, application.project)
    dealsize_points = this.pointsService.points_for_dealsize(application.user.positions, application.project )
    newbusiness_points= this.pointsService.points_for_new_business(application.user.positions, application.project)
    outbound_points= this.pointsService.points_for_outbound(application.user.positions, application.project)
    points_for_persona= this.pointsService.points_for_persona(application.user.positions, application.project.selectedPersona)
    points_for_experience= this.pointsService.points_for_years(application.user.positions, application.project)
    let points= {
      ote_points: otePoints,
      worked_in_points,
      sold_to_points,
      segment_points,
      salescycle_points,
      dealsize_points, 
      newbusiness_points,
      outbound_points,
      points_for_persona,
      points_for_experience

    };
    let sum=this.sumObjectValues(points)
    const maxPossibleSum = 10 * Object.keys(points).length;
    const percentage = (sum / maxPossibleSum) * 100;
    return {points, percentage};
  }
  catch(e){
    console.log("ERROR")
    console.log(e)
    return {
      points:{ote_points: 0,
      worked_in_points: 0,
      sold_to_points: 0,
      segment_points: 0,
      salescycle_points: 0, 
      dealsize_points: 0,
      newbusiness_points: 0,
      outbound_points:0, 
      points_for_persona: 0, 
      points_for_experience: 0},
      percentage: 0

    }
  }
  };

  sumObjectValues(obj) {
    let sum = 0;
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        sum += obj[key];
      }
    }
    return sum;
  }
  async getRanking(project_id: number, user_id:number){
    try{
      const applications = await this.applicationService
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.project", "project")
      .leftJoinAndSelect("application.user", "user")
      .leftJoinAndSelect("user.positions", "position")
      .leftJoinAndSelect("position.details", "detail")
      .leftJoinAndSelect("position.company", "company")

      .where("project.id = :projectId", { projectId: project_id })
     
      .getMany();
  
    let updatedApplications = applications.map(application => ({
      ...application, 
      user: {
        ...application.user, 
        positions: application.user.positions.filter(position => {
          if (!position.details) {
            return false;
          }
          let completionPercentage = position.details ? this.sharedService.calculateCompletionPercentage(position) : 0.0;
          console.log("completionPercentage",completionPercentage)
          return completionPercentage == 100.0;
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

  let above75Count = 0;
  updatedApplicationsWithUserPoints?.map((item) => {
      if (item?.user?.points?.percentage >= 75) {
        above75Count++;
      }
    });
   
    return {error: false, updatedApplicationsWithUserPoints,above75Count}

       
    }
    catch(e){
      return {error: true, message: "Error for getting ranking, try again."}
    }
  }
}
