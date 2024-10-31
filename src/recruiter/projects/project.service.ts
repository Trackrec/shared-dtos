import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async findAll(
    userId: number,
    page: number,
    limit: number,
    title?: string, // Project title
    startDate?: Date,
    status?: 'published' | 'draft',
    ref?: number // Project ID
  ): Promise<any> {
    try {
      // Check if the user exists and has the correct role
      const user = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });
  
      if (!user) {
        return { error: true, message: 'You are not authorized to make this request.' };
      }
  
      // Find the recruiter company user
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      // Build the query dynamically based on filters
      const queryBuilder = this.recruiterProjectRepository.createQueryBuilder('project')
        .where('project.company.id = :companyId', { companyId: recruiterCompanyUser.company.id });
  
      // Apply filters if provided
      if (title) {
        queryBuilder.andWhere('project.title LIKE :title', { title: `%${title}%` });
      }
      
      if (startDate) {
        queryBuilder.andWhere('project.start_date = :startDate', { startDate });
      }
  
      if (status) {
        if (status === 'published') {
          queryBuilder.andWhere('project.published = true');
        } else if (status === 'draft') {
          queryBuilder.andWhere('project.draft = true');
        }
      }
  
      if (ref) {
        queryBuilder.andWhere('project.id = :ref', { ref });
      }
  
      // Add pagination
      // const [projects, total] = await queryBuilder
      //   .skip((page - 1) * limit) // Skip the previous pages
      //   .take(limit) // Limit the number of records per page
      //   .getManyAndCount(); // Get both data and total count

       const projects = await queryBuilder.getMany();
  
      return {
        error: false,
        projects,
        // total, // Total number of projects
        // page, // Current page number
        // limit // Number of projects per page
      };
  
    } catch (e) {
      return { error: true, message: 'Projects not found' };
    }
  }
  
  

  async getCandidates(userId: number, page: number, limit: number): Promise<any> {
    try {
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
      
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      const [candidates, total] = await this.userRepository.createQueryBuilder("user")
        .select([
          "user.id", 
          "user.full_name", 
          "user.public_profile_username", 
          "user.custom_current_role", 
          "application", 
          "project"
        ])
        .leftJoin("user.applications", "application")
        .leftJoin("application.project", "project")
        .leftJoin("project.company", "company")
        .where("company.id = :companyId", { companyId: recruiterCompanyUser.company.id })
        .skip((page - 1) * limit) // Skip the previous pages
        .take(limit) // Limit the number of records per page
        .getManyAndCount(); // Get both data and total count
  
      return {
        error: false,
        candidates,
        total, // Total number of candidates
        page, // Current page number
        limit // Number of candidates per page
      };
  
    } catch (e) {
      return { error: true, message: "Unable to get candidates, please try again." };
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

  async findOneByUrl(project_url: string): Promise<any> {
    try {
      const project = await this.recruiterProjectRepository.findOne({
        where: { project_custom_url: project_url },
        relations: ['company']
      });
      // const applicationExists=await this.applicationRepository.findOne({where:{user:{id:userId}, project: {id: project_id}}})
      if (!project || !project.published) {
        return { error: true, message: 'Project not found.' };
      }
      // if(!project.published){
      //   return { error: true, message: 'Project not published.' };
      // }
      return { error: false, project };
    } catch (e) {
      return { error: true, message: 'Project not found.' };
    }
  }

  async createAndPublish(accountProjectData: RecruiterProject, userId: number, buffer: any, imageType:any): Promise<any> {
    try {
      // Find the user by userId
      accountProjectData = this.parseRecruiterProjectData(accountProjectData);

      const user = await this.userRepository.findOne({ where: { id: userId, role: In(['User', 'Admin']) } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      if(!accountProjectData.project_custom_url)
        accountProjectData.project_custom_url= await this.generateUniqueProjectUrl(accountProjectData.title)
      else{
        const urlExist = await this.recruiterProjectRepository.findOne({
          where: {
             project_custom_url: accountProjectData.project_custom_url,
           },
         });
    
      if (urlExist) {
          return {
             error: true,
             message: 'This job custom url already exists.',
          };
        }
      } 
  
      if(imageType){
           // Upload the new image for the company
          let storedImage = await this.uploadService.uploadNewImage(
             buffer,
            'recruiter_project_images',
             imageType
           );

         if(storedImage){
              accountProjectData.logo=storedImage;
             accountProjectData.logo_type=imageType;
        }

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
  
  async updateAndPublish(accountProjectData: RecruiterProject, userId: number, project_id: any, buffer: any, imageType): Promise<any> {
    try {
      // Find the user by userId

      accountProjectData = this.parseRecruiterProjectData(accountProjectData);

      const user = await this.userRepository.findOne({ where: { id: userId, role: In(['User', 'Admin']) } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      let project = await this.recruiterProjectRepository.findOne({
        where: { id: project_id },
      });
  
      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
  
      if(accountProjectData.project_custom_url){
        const urlExist = await this.recruiterProjectRepository.findOne({
            where: {
               project_custom_url: accountProjectData.project_custom_url,
             },
           });
     
        if (urlExist && urlExist.id != project.id) {
            return {
               error: true,
               message: 'This job custom url already exists.',
            };
        }
      }
     
  
      if(imageType){
        // Upload the new image for the company
       let storedImage = await this.uploadService.uploadNewImage(
          buffer,
         'recruiter_project_images',
          imageType
        );

        console.log(storedImage)
      if(storedImage){
        accountProjectData.logo=storedImage;
        accountProjectData.logo_type=imageType;
        await this.uploadService.deleteImage(project.logo,'recruiter_project_images' )   
     }

   }

   project={...accountProjectData}
   // Set the associated company in the project data
   project.company = recruiterCompanyUser.company;
      // Validate required fields

      await this.recruiterProjectRepository.update(project_id,project);

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
        await this.recruiterProjectRepository.update(project_id,project);
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
    buffer: any,
    imageType: any
  ): Promise<any> {
    try {

      accountProjectData = this.parseRecruiterProjectData(accountProjectData);
      console.log(accountProjectData)
      const user = await this.userRepository.findOne({ where: { id: userId,  role: In(['User', 'Admin']) } });
      accountProjectData.user = user;


      // Check if the user is associated with a company
  const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
    where: { user: { id: userId } },
    relations: ['company'],
  });

  if (!recruiterCompanyUser) {
    return { error: true, message: 'User is not associated with any recruiter company.' };

  }

  if(!accountProjectData.project_custom_url)
    accountProjectData.project_custom_url= await this.generateUniqueProjectUrl(accountProjectData.title)
  else{
    const urlExist = await this.recruiterProjectRepository.findOne({
      where: {
         project_custom_url: accountProjectData.project_custom_url,
       },
     });
  if (urlExist) {
      return {
         error: true,
         message: 'This job custom url already exists.',
      };
    }
  } 


  if(imageType){
   // Upload the new image for the company
   let storedImage = await this.uploadService.uploadNewImage(
    buffer,
    'recruiter_project_images',
    imageType
  );

  if(storedImage){
    accountProjectData.logo=storedImage;
    accountProjectData.logo_type=imageType;
  }
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
      project.company_name && 
      project.logo &&
      project.experience !== null &&
      project.ote_start !== null &&
      project.ote_end !== null &&
      project.location !=null &&
      project.location_type &&
      project.description &&
       (project.location_type !== 'hybrid' || project.hybrid_days !== null) &&
       ((project.business_range ?? 0) + 
       (project.existing_business_range ?? 0) + 
       (project.partnership_range ?? 0) === 100) &&
       ((project.inbound_range ?? 0) + (project.outbound_range ?? 0) === 100) &&
       ((project.smb ?? 0) + (project.midmarket ?? 0) + (project.enterprise ?? 0) === 100) &&
      project.minimum_deal_size !== null &&
      project.minimum_sale_cycle !== null &&
      project.Industry_Works_IN &&
      project.Industry_Sold_To &&
      project.selectedPersona &&
      project.territory &&
      project.languages &&
      project.minimum_salecycle_type
    );
  }
  async update(
    userId: number,
    id: number,
    accountProjectData: Partial<RecruiterProject>,
    buffer:any,
    imageType: any
  ): Promise<any> {
    try {
      accountProjectData = this.parseRecruiterProjectData(accountProjectData);
      const project = await this.recruiterProjectRepository.findOne({
        where: { id},
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found.',
        };
      }

      if(accountProjectData.project_custom_url){
        const urlExist = await this.recruiterProjectRepository.findOne({
            where: {
               project_custom_url: accountProjectData.project_custom_url,
             },
           });
     
        if (urlExist && urlExist.id != project.id) {
            return {
               error: true,
               message: 'This job custom url already exists.',
            };
        }
      }


      if(imageType){
        // Upload the new image for the company
        let storedImage = await this.uploadService.uploadNewImage(
         buffer,
         'recruiter_project_images',
         imageType
       );
     
       if(storedImage){
        accountProjectData.logo=storedImage;
        accountProjectData.logo_type=imageType;

        await this.uploadService.deleteImage(project.logo,'recruiter_project_images' )   

       }
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
        where: { id},
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found.',
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
      await this.uploadService.deleteImage(project.logo,'recruiter_project_images' )   
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
        where: { id},
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found.',
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
      let percentage = (sum / maxPossibleSum) * 100;
      // Round off the value to a whole number
      percentage = Math.round(percentage);

      // Ensure the percentage doesn't exceed 100
      if (percentage > 100) {
          percentage = 100;
       }
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
        // Check if the user is associated with a company
       const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: user_id } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      const project = await this.recruiterProjectRepository.findOne({
        where: { id: project_id },
        relations: ['company']
      });

      console.log(project)
      if(!project || project.company.id!=recruiterCompanyUser.company.id){
        return {error: true, message: "Project not found."}
      }
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

      return { error: false, updatedApplicationsWithUserPoints, above75Count, visitorCount, project };
    } catch (e) {
      return { error: true, message: 'Error for getting ranking, try again.' };
    }
  }


   parseRecruiterProjectData(data: any): RecruiterProject {
    const parsedData = new RecruiterProject();
  
    // Parse numeric fields
    parsedData.experience = data.experience ? parseInt(data.experience) : null;
    parsedData.ote_start = data.ote_start ? parseInt(data.ote_start) : null;
    parsedData.ote_end = data.ote_end ? parseInt(data.ote_end) : null;
    parsedData.existing_business_range = data.existing_business_range ? parseInt(data.existing_business_range) : null;
    parsedData.business_range = data.business_range ? parseInt(data.business_range) : null;
    parsedData.partnership_range = data.partnership_range ? parseInt(data.partnership_range) : null;
    parsedData.inbound_range = data.inbound_range ? parseInt(data.inbound_range) : null;
    parsedData.outbound_range = data.outbound_range ? parseInt(data.outbound_range) : null;
    parsedData.smb = data.smb ? parseInt(data.smb) : null;
    parsedData.midmarket = data.midmarket ? parseInt(data.midmarket) : null;
    parsedData.enterprise = data.enterprise ? parseInt(data.enterprise) : null;
    parsedData.minimum_deal_size = data.minimum_deal_size ? parseInt(data.minimum_deal_size) : null;
    parsedData.minimum_sale_cycle = data.minimum_sale_cycle ? parseInt(data.minimum_sale_cycle) : null;
    parsedData.hybrid_days = data.hybrid_days ? parseInt(data.hybrid_days) : null;
  
    // Parse boolean fields
    parsedData.is_travel_requirements = data.is_travel_requirements == 'Yes';
  
    // Parse date fields
    parsedData.start_date = data.start_date ? new Date(data.start_date) : null;
  
    // Parse simple-array fields
    parsedData.Industry_Works_IN = data.Industry_Works_IN 
    ? data.Industry_Works_IN.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;

// Handle other fields which might need splitting and joining as comma-separated strings
parsedData.Industry_Sold_To = data.Industry_Sold_To 
    ? data.Industry_Sold_To.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;

parsedData.selectedPersona = data.selectedPersona 
    ? data.selectedPersona.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;

parsedData.territory = data.territory 
    ? data.territory.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;

parsedData.languages = data.languages 
    ? data.languages.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;
  
    // Parse string fields
    parsedData.title = data.title || null;
    parsedData.company_name = data.company_name || null;
    parsedData.logo = data.logo || null;
    parsedData.location_type = data.location_type || null;
    parsedData.description = data.description || null;
    parsedData.location = data.location 
    ? data.location.replace(/[\[\]']+/g, '').split(',').join(',') 
    : null;
    parsedData.linkedin_profile = data.linkedin_profile || null;
    parsedData.minimum_salecycle_type = data.minimum_salecycle_type || null;
    parsedData.timeline = data.timeline || null;
    parsedData.benefits = data.benefits || null;
    parsedData.elevator_pitch = data.elevator_pitch || null;
    parsedData.travel_requirement_percentage = data.travel_requirement_percentage || null;
    parsedData.report_to = data.report_to || null;
    parsedData.hiring_process = data.hiring_process || null;
    parsedData.growth_opportunities = data.growth_opportunities || null;
  
    // Parse other fields
    parsedData.visits_count = data.visits_count ? parseInt(data.visits_count) : 0;
    parsedData.currency = data.currency || '$';
    parsedData.currency_country = data.currency_country || 'United States Dollar (USD)';
  
    return parsedData;
  }

  private async generateUniqueProjectUrl(projectName: string): Promise<string> {
    let baseProjectName = projectName.toLowerCase().replace(/\s+/g, '-');
    let project_name = baseProjectName;
    let counter = 2;
    while (
      await this.recruiterProjectRepository.findOne({
        where: { project_custom_url: project_name },
      })
    ) {
      project_name = `${baseProjectName}-${counter}`;
      counter++;
    }
    return project_name;
  }
}
