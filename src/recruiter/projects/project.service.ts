import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterProject } from './project.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { validate } from 'class-validator';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { ApplicationService } from 'src/applications/application.service';
import { ProjectApplication } from 'src/applications/application.entity';
import { SharedService } from 'src/shared/shared.service';
import { RecruiterPointsService } from './points.service';
import { ProjectVisitors } from 'src/project_visits/project_visits.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
@Injectable()
export class RecruiterProjectService {
  constructor(
    @InjectRepository(RecruiterProject)
    private readonly recruiterProjectRepository: Repository<RecruiterProject>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(ProjectApplication)
    private readonly applicationService: Repository<ProjectApplication>,
    @InjectRepository(ProjectVisitors)
    private readonly visitorRepository: Repository<ProjectVisitors>,
    private readonly uploadService: S3UploadService,
    private readonly sharedService: SharedService,
    private readonly pointsService: RecruiterPointsService,
    @InjectRepository(RecruiterCompanyUser)
    private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>,
    @InjectRepository(ProjectVisitors)
    private projectVisitorsRepository: Repository<ProjectVisitors>
  ) {}

  async findAll(userId): Promise<any> {
    try {
      const user= await this.userRepository.findOne({where:{id:userId}})
      if(!user){
        return {error: true, message: "You are not authorized to make this request."}
     }
      let projects;

     if (user.role === "Admin") {
           projects = await this.recruiterProjectRepository.find();
     } else {
         projects = await this.recruiterProjectRepository.find({
           where: { user: { id: userId } },
           });
       }

      
      return { error: false, projects };
    } catch (e) {
      return { error: true, message: 'Projects not found' };
    }
  }

  async checkApplied(projectId: number, userId: number): Promise<any> {
    try {
      const application = await this.applicationService.findOne({
        where: { user: { id: userId }, project: { id: projectId } },
      });

      if (application) {
        return { error: false, Applied: true };
      } else {
        return { error: false, Applied: false };
      }
    } catch (e) {
      return { error: true, message: 'Projects not found' };
    }
  }

  async findAllUsersProjects(user_id): Promise<any> {
    try {
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: user_id } },
        relations: ['company'],
      });
    
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
    
      }
    
      const projects = await this.recruiterProjectRepository.find({
        where:{
           company: recruiterCompanyUser.company
        }
      });
      return { error: false, projects };
    } catch (e) {
      return { error: true, message: 'Projects not found' };
    }
  }

  async findOne(id: number, checkPublished: any = false): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id },
        relations: ['company']
      });
      // const applicationExists=await this.applicationRepository.findOne({where:{user:{id:userId}, project: {id: project_id}}})

      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
      if(checkPublished && !project.published){
        return { error: true, message: 'Project not published.' };

      }
      return { error: false, project };
    } catch (e) {
      return { error: true, message: 'Project not found.' };
    }
  }

  async createAndPublish(accountProjectData: RecruiterProject, userId: number): Promise<any> {
    try {
      // Find the user by userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      // Set the associated company in the project data
      accountProjectData.company = recruiterCompanyUser.company;
  
      // Validate required fields
      if (this.hasRequiredFields(accountProjectData)) {
        accountProjectData.draft = false;
        accountProjectData.published = true;
  
        // Create and validate the project
        const project = this.recruiterProjectRepository.create(accountProjectData);
        // const errors = await validate(project);
  
        // if (errors.length > 0) {
        //   return { error: true, message: 'Please send all the required fields.' };
        // }
  
        // Save the project to the database
        await this.recruiterProjectRepository.save(project);
        return {
          error: false,
          message: 'Project created successfully.',
          project,
        };
      } else {
        return {
          error: true,
          message: 'Please fill all the required fields.',
        };
      }
    } catch (e) {
      return {
        error: true,
        message: 'Project not created.',
      };
    }
  }
  
  async updateAndPublish(accountProjectData: RecruiterProject, userId: number, project_id: any): Promise<any> {
    try {
      // Find the user by userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      var project = await this.recruiterProjectRepository.findOne({
        where: { id: project_id },
      });
  
      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
  
      project={...accountProjectData}
      // Set the associated company in the project data
      project.company = recruiterCompanyUser.company;
  
      // Validate required fields
      if (this.hasRequiredFields(project)) {
        project.draft = false;
        project.published = true;
  
        // Create and validate the project
        //const project = this.recruiterProjectRepository.create(accountProjectData);
        // const errors = await validate(project);
  
        // if (errors.length > 0) {
        //   return { error: true, message: 'Please send all the required fields.' };
        // }
  
        // Save the project to the database
        await this.recruiterProjectRepository.save(project);
        return {
          error: false,
          message: 'Project updated and published successfully.',
          project,
        };
      } else {
        return {
          error: true,
          message: 'Please fill all the required fields.',
        };
      }
    } catch (e) {
      return {
        error: true,
        message: 'Project not updated.',
      };
    }
  }
  async create(
    accountProjectData: Partial<RecruiterProject>,
    userId: number,
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      accountProjectData.user = user;


      // Check if the user is associated with a company
  const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
    where: { user: { id: userId } },
    relations: ['company'],
  });

  if (!recruiterCompanyUser) {
    return { error: true, message: 'User is not associated with any recruiter company.' };

  }

  // Set the user in the project data
  accountProjectData.company = recruiterCompanyUser.company;

  accountProjectData.user = user;
      const project = this.recruiterProjectRepository.create(accountProjectData);
      const errors = await validate(project);
      console.log(errors);
      if (errors.length > 0) {
        return { error: true, message: 'Please send all the required fields.' };
      }
      await this.recruiterProjectRepository.save(project);
      return {
        error: false,
        message: 'Project created successfully.',
        project,
      };
    } catch (e) {
      console.log(e)
      return { error: true, message: 'Project not created!' };
    }
  }
  async publishProject(
    projectId: number,
    userId: number,
  ): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id: projectId, user: { id: userId } },
      });
  
      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
  
      if (project.published) {
        return { error: true, message: 'Project is already published.' };
      }
  
      // Check if required fields are filled
      if (this.hasRequiredFields(project)) {
        // Set draft to false and published to true
        project.draft = false;
        project.published = true;
  
        await this.recruiterProjectRepository.save(project);
  
        return {
          error: false,
          message: 'Project published successfully.',
          project,
        };
      } else {
        return { error: true, message: 'Please fill in all required fields.' };
      }
    } catch (e) {
      return { error: true, message: e.message || 'Failed to publish project.' };
    }
  }

  async unpublishProject(
    projectId: number,
    userId: number,
  ): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id: projectId},
      });
  
      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
  
      if (!project.published) {
        return { error: true, message: 'Project is already unpublished.' };
      }
  
      // Set published to false and draft to true (optional depending on logic)
      project.published = false;
      project.draft = true;
  
      await this.recruiterProjectRepository.save(project);
  
      return {
        error: false,
        message: 'Project unpublished successfully.',
        project,
      };
    } catch (e) {
      return { error: true, message: e.message || 'Failed to unpublish project.' };
    }
  }
  
  
  // Helper method to check if required fields are filled
  private hasRequiredFields(project: RecruiterProject): boolean {
    return !!(
      project.title &&
      project.experience !== null &&
      project.ote_start !== null &&
      project.ote_end !== null &&
      project.location_type &&
      project.description &&
      (project.location_type !== 'hybrid' || project.hybrid_days !== null) &&
      project.existing_business_range !== null &&
      project.partnership_range !==null &&
      project.business_range !== null &&
      project.inbound_range !== null &&
      project.outbound_range !== null &&
      project.smb !== null &&
      project.midmarket !== null &&
      project.enterprise !== null &&
      project.minimum_deal_size !== null &&
      project.minimum_sale_cycle !== null &&
      project.hybrid_days !== null &&
      project.Industry_Works_IN &&
      project.Industry_Sold_To &&
      project.selectedPersona &&
      project.territory &&
      project.languages &&
      project.linkedin_profile &&
      project.minimum_salecycle_type &&
      project.start_date
    );
  }
  async update(
    userId: number,
    id: number,
    accountProjectData: Partial<RecruiterProject>,
  ): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id, user: { id: userId } },
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found or does not belong to the user.',
        };
      }

      if(project.published && !this.hasRequiredFields(accountProjectData as RecruiterProject)){
        accountProjectData.published=false;
        accountProjectData.draft=true;
      }

      await this.recruiterProjectRepository.update(id, accountProjectData);
      return { error: false, message: 'Project updated successfully.' };
    } catch (e) {
      return { error: true, message: 'Project not updated.' };
    }
  }

  async remove(id: number, userId: number): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id, user: { id: userId } },
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found or does not belong to the user.',
        };
      }
      const applications = await this.applicationService.find({
        where: { project: { id: id } },
      });
      await this.applicationService.remove(applications);

      const visitors = await this.visitorRepository.find({
        where: { project: { id: id } },
      });
      await this.visitorRepository.remove(visitors);
      await this.recruiterProjectRepository.delete(id);

      return { error: false, message: 'Project Deleted Successfully' };
    } catch (e) {
      console.log(e);
      return { error: true, message: 'Project not deleted.' };
    }
  }

  async updateProjectPicture(
    id: number,
    image,
    user_id: number,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { id, user: { id: user_id } },
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found or you are not the owner of project.',
        };
      }
      let storedImage = await this.uploadService.uploadNewImage(
        image,
        'project_images',
      );
   //   if (storedImage) project.project_image = storedImage;

      await this.recruiterProjectRepository.save(project);

      return { error: false, message: 'Project Image updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update project image.' };
    }
  }

  calculatePointsForUser = (application) => {
    try {
      let otePoints: any = 0.0;
      let worked_in_points: any = 0.0;
      let sold_to_points: any = 0.0;
      let segment_points: any = 0.0;
      let salescycle_points: any = 0.0;
      let dealsize_points: any = 0.0;
      let newbusiness_points: any = 0.0;
      let outbound_points: any = 0.0;
      let points_for_persona: any = 0.0;
      let points_for_experience: any = 0.0;
      if (application.user.positions.length == 0) {
        return {
          points: {
            ote_points: 0,
            worked_in_points: 0,
            sold_to_points: 0,
            segment_points: 0,
            salescycle_points: 0,
            dealsize_points: 0,
            newbusiness_points: 0,
            outbound_points: 0,
            points_for_persona: 0,
            points_for_experience: 0,
          },
          percentage: 0,
        };
      }
      otePoints = this.pointsService.points_for_ote(
        parseInt(application.user.ote_expectation),
        parseInt(application.ote),
      );
      worked_in_points = this.pointsService.points_for_worked_in(
        application.user.positions,
        application.project.Industry_Works_IN,
      );
      sold_to_points = this.pointsService.points_for_sold_to(
        application.user.positions,
        application.project.Industry_Sold_To,
      );
      segment_points = this.pointsService.points_for_segment(
        application.user.positions,
        application.project,
      );
      salescycle_points = this.pointsService.points_for_sales_cycle(
        application.user.positions,
        application.project,
      );
      dealsize_points = this.pointsService.points_for_dealsize(
        application.user.positions,
        application.project,
      );
      newbusiness_points = this.pointsService.points_for_new_business(
        application.user.positions,
        application.project,
      );
      outbound_points = this.pointsService.points_for_outbound(
        application.user.positions,
        application.project,
      );
      points_for_persona = this.pointsService.points_for_persona(
        application.user.positions,
        application.project.selectedPersona,
      );
      points_for_experience = this.pointsService.points_for_years(
        application.user.positions,
        application.project,
      );
      let points = {
        ote_points: otePoints,
        worked_in_points,
        sold_to_points,
        segment_points,
        salescycle_points,
        dealsize_points,
        newbusiness_points,
        outbound_points,
        points_for_persona,
        points_for_experience,
      };
      let sum = this.sumObjectValues(points);
      const maxPossibleSum = 10 * Object.keys(points).length;
      const percentage = (sum / maxPossibleSum) * 100;
      return { points, percentage };
    } catch (e) {
      console.log('ERROR');
      console.log(e);
      return {
        points: {
          ote_points: 0,
          worked_in_points: 0,
          sold_to_points: 0,
          segment_points: 0,
          salescycle_points: 0,
          dealsize_points: 0,
          newbusiness_points: 0,
          outbound_points: 0,
          points_for_persona: 0,
          points_for_experience: 0,
        },
        percentage: 0,
      };
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
  async getRanking(project_id: number, user_id: number) {
    try {
      const applications = await this.applicationService
        .createQueryBuilder('application')
        .leftJoinAndSelect('application.project', 'project')
        .leftJoinAndSelect('application.user', 'user')
        .leftJoinAndSelect('user.positions', 'position')
        .leftJoinAndSelect('position.details', 'detail')
        .leftJoinAndSelect('position.company', 'company')

        .where('project.id = :projectId', { projectId: project_id })

        .getMany();

      let updatedApplications = applications.map((application) => ({
        ...application,
        user: {
          ...application.user,
          positions: application.user.positions.filter((position) => {
            if (!position.details) {
              return false;
            }
            let completionPercentage = position.details
              ? this.sharedService.calculateCompletionPercentage(position)
              : 0.0;
            console.log('completionPercentage', completionPercentage);
            return completionPercentage == 100.0;
          }),
        },
      }));

      const updatedApplicationsWithUserPoints = updatedApplications.map(
        (application) => {
          const updatedUser = this.calculatePointsForUser(application);
          return {
            ...application,
            user: { ...application.user, points: updatedUser },
          };
        },
      );

      let above75Count = 0;
      updatedApplicationsWithUserPoints?.map((item) => {
        if (item?.user?.points?.percentage >= 75) {
          above75Count++;
        }
      });

      const visitorCount = await this.projectVisitorsRepository.count({
        where: { project: { id: project_id } },
      });

      return { error: false, updatedApplicationsWithUserPoints, above75Count, visitorCount };
    } catch (e) {
      return { error: true, message: 'Error for getting ranking, try again.' };
    }
  }
}
