import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { RecruiterProject } from './project.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { validate, ValidationError } from 'class-validator';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { ApplicationService } from 'src/applications/application.service';
import { ProjectApplication } from 'src/applications/application.entity';
import { SharedService } from 'src/shared/shared.service';
import { RecruiterPointsService } from './points.service';
import { ProjectVisitors } from 'src/project_visits/project_visits.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
import { Company } from 'src/company/company.entity';
import { CompanyService } from 'src/company/company.service';
import { ApplicationRankingListResponseDto, PointsCalculationDto, PointsDto, ProjectApplicationDto, ProjectApplicationWithPostions, ProjectApplicationWithUserPointsDto } from 'src/shared-dtos/src/project_application.dto';
import { AllUsersProjectsResponseDto, CheckAppliedResponseDto, GetCandidatesResponseDto, ProjectResponseDto, ProjectListResponseDto, RecruiterProjectDto, RecruiterProjectRequestDto } from 'src/shared-dtos/src/recruiter_project.dto';
import { RecruiterCompanyDto, RecruiterCompanyUserDto } from 'src/shared-dtos/src/recruiter_company';
import { UserDto } from 'src/shared-dtos/src/user.dto';
import { CompanyDataDto } from 'src/shared-dtos/src/company.dto';
import { PositionDto, RecentYearPositionFilterDto } from 'src/shared-dtos/src/Position.dto';

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
    private projectVisitorsRepository: Repository<ProjectVisitors>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
      private readonly companyService: CompanyService,
  ) {}

  async findAll(
    userId: number,
    page: number,
    limit: number,
    title?: string, // Project title
    startDate?: Date,
    status?: 'published' | 'draft',
    ref?: number // Project ID
  ): Promise<ProjectListResponseDto> {
    try {
      // Check if the user exists and has the correct role
      const user: UserDto = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });
  
      if (!user) {
        return { error: true, message: 'You are not authorized to make this request.' };
      }
  
      // Find the recruiter company user
      const recruiterCompanyUser: RecruiterCompanyUserDto = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      // Build the query dynamically based on filters
      const queryBuilder : SelectQueryBuilder<RecruiterProject>= this.recruiterProjectRepository.createQueryBuilder('project')
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

       const projects: RecruiterProjectDto[] = await queryBuilder.getMany();
  
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
  
  

  async getCandidates(userId: number, page: number, limit: number): Promise<GetCandidatesResponseDto> {
    try {
      const recruiterCompanyUser: RecruiterCompanyUserDto = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
      
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }
  
      const [candidates, total]: [UserDto[], number] = await this.userRepository.createQueryBuilder("user")
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
  
  

  async checkApplied(projectId: number, userId: number): Promise<CheckAppliedResponseDto> {
    try {
      const application: ProjectApplicationDto = await this.applicationService.findOne({
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

  async findAllUsersProjects(user_id: number): Promise<AllUsersProjectsResponseDto> {
    try {
      const recruiterCompanyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: user_id } },
        relations: ['company'],
      });
    
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
    
      }
    
      const projects: RecruiterProjectDto[] = await this.recruiterProjectRepository.find({
        where:{
           company: recruiterCompanyUser.company
        }
      });
      return { error: false, projects };
    } catch (e) {
      return { error: true, message: 'Projects not found' };
    }
  }

  async findOne(id: number, checkPublished: any = false): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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

  async findOneByUrl(project_url: string): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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

  async getCompanyInfo(companyData: { company_id: string; company_name: string; logo_url?: string; domain?: string; website_url?: string }) {
    if (companyData && companyData.company_id) {
      try {
        let company = await this.companyRepository.findOne({
          where: { company_id: companyData.company_id },
        });
  
        if (company) {
          return company.logo_url;
        } else {
          const newCompany = await this.companyService.createCompany({
            company_id: companyData.company_id,
            name: companyData.company_name,
            logo_url: companyData.logo_url || null,
            domain: companyData.domain || null,
            website_url: companyData.website_url || null,
          });
  
          if (newCompany && !newCompany.error) {
            return newCompany.createdCompany.logo_url;
          } else {
            return null; 
          }
        }
      } catch (error) {
        console.error("Error in getCompanyInfo:", error);
        return null; 
      }
    }
    return null; 
  }
  

  async createAndPublish(body: RecruiterProjectRequestDto, userId: number, buffer: Buffer, imageType:string | null, companyData: CompanyDataDto): Promise<ProjectResponseDto> {
    try {
      // Find the user by userId
      let accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);

      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId, role: In(['User', 'Admin']) } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      if(!accountProjectData.project_custom_url)
        accountProjectData.project_custom_url= await this.generateUniqueProjectUrl(accountProjectData.title)
      else{
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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
          let storedImage: string = await this.uploadService.uploadNewImage(
             buffer,
            'recruiter_project_images',
             imageType
           );

         if(storedImage){
              accountProjectData.logo=storedImage;
             accountProjectData.logo_type=imageType;
        }

      }

      if(companyData && companyData.company_id && companyData.company_name && companyData.logo_url){
        accountProjectData.logo = await this.getCompanyInfo(companyData)
        accountProjectData.logo_type = "url";
        accountProjectData.company_id = companyData.company_id
      }
      // Set the associated company in the project data
      accountProjectData.company = recruiterCompanyUser.company;
  
      // Validate required fields
      if (this.hasRequiredFields(accountProjectData)) {
        accountProjectData.draft = false;
        accountProjectData.published = true;
  
        // Create and validate the project
        const project: RecruiterProjectDto = this.recruiterProjectRepository.create(accountProjectData);
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
  
  async updateAndPublish(body: RecruiterProjectRequestDto, userId: number, project_id: number, buffer: Buffer, imageType: string | null, companyData: CompanyDataDto): Promise<ProjectResponseDto> {
    try {
      // Find the user by userId

      let accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);

      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId, role: In(['User', 'Admin']) } });
      accountProjectData.user = user;
  
      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
  
      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      let project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: project_id },
      });
  
      if (!project) {
        return { error: true, message: 'Project not found.' };
      }
  
      if(accountProjectData.project_custom_url){
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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
       let storedImage: string = await this.uploadService.uploadNewImage(
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

   if(companyData && companyData.company_id && companyData.company_name && companyData.logo_url){
    accountProjectData.logo = await this.getCompanyInfo(companyData)
    accountProjectData.logo_type = "url"
    accountProjectData.company_id = companyData.company_id
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
    body: RecruiterProjectRequestDto,
    userId: number,
    buffer: Buffer,
    imageType: string | null,
    companyData: CompanyDataDto
  ): Promise<ProjectResponseDto> {
    try {

      let accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);
      console.log(accountProjectData)
      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId,  role: In(['User', 'Admin']) } });
      accountProjectData.user = user;


      // Check if the user is associated with a company
  const recruiterCompanyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
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
   let storedImage: string = await this.uploadService.uploadNewImage(
    buffer,
    'recruiter_project_images',
    imageType
  );

  if(storedImage){
    accountProjectData.logo=storedImage;
    accountProjectData.logo_type=imageType;
  }
} 

  if(companyData && companyData.company_id && companyData.company_name && companyData.logo_url){
    accountProjectData.logo = await this.getCompanyInfo(companyData)
    accountProjectData.logo_type = "url"
    accountProjectData.company_id = companyData.company_id
  }

  // Set the user in the project data
  accountProjectData.company = recruiterCompanyUser.company;

  accountProjectData.user = user;
      const project: RecruiterProjectDto = this.recruiterProjectRepository.create(accountProjectData);
      const errors: ValidationError[] = await validate(project);
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
  ): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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
  ): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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
  private hasRequiredFields(project: RecruiterProject | RecruiterProjectDto): boolean {
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
      project.minimum_salecycle_type &&
      (project.experience_type && project.experience_type.length>0)
    );
  }
  async update(
    userId: number,
    id: number,
    body: RecruiterProjectRequestDto,
    buffer:Buffer,
    imageType: string | null,
    companyData: CompanyDataDto
  ): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id},
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found.',
        };
      }

      let accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);

      if(accountProjectData.project_custom_url){
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
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
        let storedImage: string = await this.uploadService.uploadNewImage(
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

     if(companyData && companyData.company_id && companyData.company_name && companyData.logo_url){
      accountProjectData.logo = await this.getCompanyInfo(companyData)
      accountProjectData.logo_type = "url";
      accountProjectData.company_id = companyData.company_id
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

  async remove(id: number, userId: number): Promise<ProjectResponseDto> {
    try {
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id},
      });
      if (!project) {
        return {
          error: true,
          message: 'Project not found.',
        };
      }
      const applications: ProjectApplication[] = await this.applicationService.find({
        where: { project: { id: id } },
      });
      await this.applicationService.remove(applications);

      const visitors: ProjectVisitors[] = await this.visitorRepository.find({
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

    calculatePointsForUser = async (application: ProjectApplicationWithPostions): Promise<{points: PointsDto, percentage: number}> => {
      try {
        const points: PointsDto = {
          ote_points: 0,
          worked_in_points: 0,
          sold_to_points: 0,
          segment_points: 0,
          salescycle_points: 0,
          dealsize_points: 0,
          newbusiness_points: 0,
          outbound_points: 0,
          points_for_persona: 0,
          points_for_experience: 0
        };
    
        if (application.user.positions.length === 0) {
          return { points, percentage: 0 };
        }
    
        // Wait for all point calculations to complete
        const pointsArray: [
          number, // otepoints
          number, // worked_in_points
          number, // sold_to_points
          number, // segment_points
          number, // salescycle_points
          number, // dealsize_points
          number, // newbusiness_points
          number, // outbound_points
          number, // points_for_persona
          number  // points_for_experience
        ] = await Promise.all([
          this.pointsService.points_for_ote(application.user.ote_expectation, application.ote),
          this.pointsService.points_for_worked_in(application.user.positions, application.project.Industry_Works_IN),
          this.pointsService.points_for_sold_to(application.user.positions, application.project.Industry_Sold_To),
          this.pointsService.points_for_segment(application.user.positions, application.project),
          this.pointsService.points_for_sales_cycle(application.user.positions, application.project),
          this.pointsService.points_for_dealsize(application.user.positions, application.project),
          this.pointsService.points_for_new_business(application.user.positions, application.project),
          this.pointsService.points_for_outbound(application.user.positions, application.project),
          this.pointsService.points_for_persona(application.user.positions, application.project.selectedPersona),
          this.pointsService.points_for_years(application.user.positions, application.project),
        ]);
        // console.log(worked_in_points)
        // console.log(sold_to_points)
        // console.log(dealsize_points)
        // console.log(newbusiness_points)
        const [
          otepoints,
          worked_in_points,
          sold_to_points,
          segment_points,
          salescycle_points,
          dealsize_points,
          newbusiness_points,
          outbound_points,
          points_for_persona,
          points_for_experience,
        ] = pointsArray;
        Object.assign(points, {
          ote_points: otepoints,
          worked_in_points,
          sold_to_points,
          segment_points,
          salescycle_points,
          dealsize_points,
          newbusiness_points,
          outbound_points,
          points_for_persona,
          points_for_experience
        });
    
        const sum: number = this.sumObjectValues(points);
        const maxpossiblesum: number = 10 * Object.keys(points).length;
        let percentage: number = Math.round((sum / maxpossiblesum) * 100);
        percentage = Math.min(percentage, 100);
    
        return { points, percentage };
      } catch (e) {
        console.error('Error calculating points:', e);
        return { points: {}, percentage: 0 };
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

  private filterPositionsByRecentYears(
    positions: PositionDto[],
    filter: string
  ): PositionDto[] {
    if(!filter){
      return positions
    }
    const filterMapping: RecentYearPositionFilterDto = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      five_plus: null, 
    };
  
    const selectedYears: number | null = filterMapping[filter];
    if (selectedYears == undefined) {
      return positions; 
    }
  
    const currentDate: Date = new Date();
    const thresholdDate: Date = new Date();
    thresholdDate.setFullYear(currentDate.getFullYear() - selectedYears);
  
    return positions.filter((position) => {
      const positionStartDate: Date = new Date(position.start_year, (position.start_month || 1) - 1);
      const positionEndDate: Date = position.end_year
        ? new Date(position.end_year, (position.end_month || 12) - 1)
        : currentDate; // Use current date if end date is null (ongoing position)
  
      return positionEndDate >= thresholdDate && positionStartDate <= currentDate;
    });
  }
  
  
  
  
  async getRanking(project_id: number, user_id: number, min_experience?: string): Promise<ApplicationRankingListResponseDto> {
    try {
       const recruiterCompanyUser: RecruiterCompanyUserDto = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: user_id } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: project_id },
        relations: ['company']
      });

      if(!project || project.company.id!=recruiterCompanyUser.company.id){
        return {error: true, message: "Project not found."}
      }
      const applications: ProjectApplication[] = await this.applicationService
        .createQueryBuilder('application')
        .leftJoinAndSelect('application.project', 'project')
        .leftJoinAndSelect('application.user', 'user')
        .leftJoinAndSelect('user.positions', 'position')
        .leftJoinAndSelect('position.details', 'detail')
        .leftJoinAndSelect('position.company', 'company')

        .where('project.id = :projectId', { projectId: project_id })

        .getMany();

  
     
        let updatedApplications: ProjectApplicationWithPostions[] = applications.map((application: ProjectApplicationDto) => {
          const filteredPositions: PositionDto[] = this.filterPositionsByRecentYears(application.user.positions, min_experience);
          const validPositions: PositionDto[] = filteredPositions.filter(
            (position) =>
              position.details &&
              this.sharedService.calculateCompletionPercentage(position) == 100.0
          );
         
        
          return {
            ...application,
            user: {
              ...application.user,
              positions: validPositions,
            },
          };
        });
        
     
      
       const updatedApplicationsWithUserPoints: ProjectApplicationWithUserPointsDto[] = await Promise.all(
        updatedApplications.map(async (application: ProjectApplicationWithPostions) => {
            const updatedUser = await this.calculatePointsForUser(application);
            return {
              ...application,
              user: { ...application.user, points: updatedUser },
            };
          })
        );
      


      let above75Count: number = 0;
      updatedApplicationsWithUserPoints?.map((item) => {
        if (item?.user?.points?.percentage >= 75) {
          above75Count++;
        }
      });

      const visitorCount: number = await this.projectVisitorsRepository.count({
        where: { project: { id: project_id } },
      });

      return { error: false, updatedApplicationsWithUserPoints, above75Count, visitorCount, project };
    } catch (e) {
      return { error: true, message: 'Error for getting ranking, try again.' };
    }
  }


   parseRecruiterProjectData(data: RecruiterProjectRequestDto): RecruiterProject {
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
    parsedData.is_ote_visible = data.is_ote_visible == 'true';
  
    // Parse date fields
    parsedData.start_date = data.start_date ? new Date(data.start_date) : null;
  
    // Parse simple-array fields
    parsedData.Industry_Works_IN = data.Industry_Works_IN 
    ? data.Industry_Works_IN.replace(/[\[\]']/g, '').split(',').map(item => item.trim())
    : null;
  

// Handle other fields which might need splitting and joining as comma-separated strings
parsedData.Industry_Sold_To = data.Industry_Sold_To 
? data.Industry_Sold_To.replace(/[\[\]']/g, '').split(',').map(item => item.trim())
    : null;

parsedData.selectedPersona = data.selectedPersona 
     ? data.selectedPersona.replace(/[\[\]']/g, '').split(',').map(item => item.trim()) 
    : null;

parsedData.territory = data.territory 
     ? data.territory.replace(/[\[\]']/g, '').split(',').map(item => item.trim()) 
    : null;

parsedData.languages = data.languages 
     ? data.languages.replace(/[\[\]']/g, '').split(',').map(item => item.trim()) 
    : null;
  
    // Parse string fields
    parsedData.title = data.title || null;
    parsedData.company_name = data.company_name || null;
    parsedData.company_id = data.company_id || null;
    parsedData.logo = data.logo || null;
    parsedData.location_type = data.location_type || null;
    parsedData.description = data.description || null;
    parsedData.experience_type = data.experience_type || null;
    parsedData.company_elevator_pitch = data.company_elevator_pitch || null;
    parsedData.main_problem = data.main_problem || null;
    parsedData.location = data.location 
    ? data.location.replace(/[\[\]']/g, '').split(',').map(item => item.trim()) 
    : null;
    parsedData.linkedin_profile = data.linkedin_profile || null;
    parsedData.minimum_salecycle_type = data.minimum_salecycle_type || null;
    parsedData.timeline = data.timeline || null;
    parsedData.benefits = data.benefits || null;
    parsedData.office_address =  data.office_address || null;
    parsedData.elevator_pitch = data.elevator_pitch || null;
    parsedData.travel_requirement_percentage = data.travel_requirement_percentage || null;
    parsedData.report_to = data.report_to || null;
    parsedData.hiring_process = data.hiring_process || null;
    parsedData.growth_opportunities = data.growth_opportunities || null;
  
    // Parse other fields
    parsedData.visits_count = data.visits_count ? parseInt(data.visits_count) : 0;
    parsedData.currency = data.currency || '$';
    parsedData.currency_country = data.currency_country || 'United States Dollar (USD)';
    parsedData.project_custom_url = data.project_custom_url;
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
