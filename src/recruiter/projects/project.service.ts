import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { RecruiterProject } from './project.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { validate, ValidationError } from 'class-validator';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { ProjectApplication } from 'src/applications/application.entity';
import { SharedService } from 'src/shared/shared.service';
import { RecruiterPointsService } from './points.service';
import { ProjectVisitors } from 'src/project_visits/project_visits.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
import { Company } from 'src/company/company.entity';
import { CompanyService } from 'src/company/company.service';
import {
  ApplicationRankingListResponseDto,
  PointsDto,
  ProjectApplicationDto,
  ProjectApplicationWithPostions,
  ProjectApplicationWithUserPointsDto,
} from 'src/shared-dtos/src/project_application.dto';
import {
  AllUsersProjectsResponseDto,
  CheckAppliedResponseDto,
  GetCandidatesResponseDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  RecruiterProjectDto,
  RecruiterProjectRequestDto,
} from 'src/shared-dtos/src/recruiter_project.dto';
import { RecruiterCompanyUserDto } from 'src/shared-dtos/src/recruiter_company';
import { UserDto } from 'src/shared-dtos/src/user.dto';
import { CompanyDataDto } from 'src/shared-dtos/src/company.dto';
import { PositionDto, RecentYearPositionFilterDto } from 'src/shared-dtos/src/position.dto';

@Injectable()
export class RecruiterProjectService {
  private readonly logger = new Logger(RecruiterProjectService.name);

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
    title?: string,
    startDate?: Date,
    status?: 'published' | 'draft',
    ref?: number,
  ): Promise<ProjectListResponseDto> {
    try {
      this.logger.log(
        `User ID ${userId} requested project list with filters - Title: ${title}, Start Date: ${startDate}, Status: ${status}, Ref: ${ref}, Page: ${page}, Limit: ${limit}`,
      );

      // Check if the user exists and has the correct role
      const user: UserDto = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });

      if (!user) {
        this.logger.warn(`Unauthorized access attempt by User ID ${userId}`);
        return { error: true, message: 'You are not authorized to make this request.' };
      }

      this.logger.log(`User ID ${userId} verified with role: ${user.role}`);

      // Find the recruiter company user
      const recruiterCompanyUser: RecruiterCompanyUserDto =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      this.logger.log(
        `User ID ${userId} is associated with company ID ${recruiterCompanyUser.company.id}`,
      );

      // Build the query dynamically based on filters
      const queryBuilder: SelectQueryBuilder<RecruiterProject> = this.recruiterProjectRepository
        .createQueryBuilder('project')
        .where('project.company.id = :companyId', { companyId: recruiterCompanyUser.company.id });

      // Apply filters if provided
      if (title) {
        this.logger.log(`Applying title filter: ${title}`);
        queryBuilder.andWhere('project.title LIKE :title', { title: `%${title}%` });
      }

      if (startDate) {
        this.logger.log(`Applying start date filter: ${startDate}`);
        queryBuilder.andWhere('project.start_date = :startDate', { startDate });
      }

      if (status) {
        this.logger.log(`Applying status filter: ${status}`);
        if (status === 'published') {
          queryBuilder.andWhere('project.published = true');
        } else if (status === 'draft') {
          queryBuilder.andWhere('project.draft = true');
        }
      }

      if (ref) {
        this.logger.log(`Applying reference ID filter: ${ref}`);
        queryBuilder.andWhere('project.id = :ref', { ref });
      }

      // Fetch projects
      const projects: RecruiterProjectDto[] = await queryBuilder.getMany();

      this.logger.log(`User ID ${userId} retrieved ${projects.length} projects.`);

      return {
        error: false,
        projects,
      };
    } catch (e) {
      this.logger.error(`Error fetching projects for user ID ${userId}: ${e.message}`);
      return { error: true, message: 'Projects not found' };
    }
  }

  async getCandidates(
    userId: number,
    page: number,
    limit: number,
  ): Promise<GetCandidatesResponseDto> {
    try {
      this.logger.log(
        `User ID ${userId} requested candidate list with page: ${page}, limit: ${limit}`,
      );

      // Check if the user is associated with any recruiter company
      const recruiterCompanyUser: RecruiterCompanyUserDto =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      this.logger.log(
        `User ID ${userId} is associated with company ID ${recruiterCompanyUser.company.id}`,
      );

      // Fetch candidates linked to the recruiter's company
      const [candidates, total]: [UserDto[], number] = await this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.full_name',
          'user.public_profile_username',
          'user.custom_current_role',
          'application',
          'project',
        ])
        .leftJoin('user.applications', 'application')
        .leftJoin('application.project', 'project')
        .leftJoin('project.company', 'company')
        .where('company.id = :companyId', { companyId: recruiterCompanyUser.company.id })
        .skip((page - 1) * limit) // Pagination: Skip previous pages
        .take(limit) // Pagination: Limit records per page
        .getManyAndCount(); // Get candidates and total count

      this.logger.log(
        `User ID ${userId} retrieved ${candidates.length} candidates out of ${total} total candidates.`,
      );

      return {
        error: false,
        candidates,
        total,
        page,
        limit,
      };
    } catch (e) {
      this.logger.error(`Error fetching candidates for User ID ${userId}: ${e.message}`);
      return { error: true, message: 'Unable to get candidates, please try again.' };
    }
  }

  async checkApplied(projectId: number, userId: number): Promise<CheckAppliedResponseDto> {
    try {
      this.logger.log(`Checking if user ID ${userId} has applied to project ID ${projectId}`);

      const application: ProjectApplicationDto = await this.applicationService.findOne({
        where: { user: { id: userId }, project: { id: projectId } },
      });

      if (application) {
        this.logger.log(`User ID ${userId} has already applied to project ID ${projectId}`);
        return { error: false, Applied: true };
      } else {
        this.logger.log(`User ID ${userId} has not applied to project ID ${projectId}`);
        return { error: false, Applied: false };
      }
    } catch (e) {
      this.logger.error(
        `Error checking application status for user ID ${userId} on project ID ${projectId}: ${e.message}`,
      );
      return { error: true, message: 'Projects not found' };
    }
  }

  async findAllUsersProjects(userId: number): Promise<AllUsersProjectsResponseDto> {
    try {
      this.logger.log(`Fetching recruiter company information for user ID: ${userId}`);

      const recruiterCompanyUser: RecruiterCompanyUser =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      this.logger.log(
        `Fetching projects for company ID: ${recruiterCompanyUser.company.id} associated with user ID: ${userId}`,
      );

      const projects: RecruiterProjectDto[] = await this.recruiterProjectRepository.find({
        where: {
          company: recruiterCompanyUser.company,
        },
      });

      this.logger.log(`Retrieved ${projects.length} project(s) for user ID: ${userId}`);

      return { error: false, projects };
    } catch (e) {
      this.logger.error(`Error fetching projects for user ID ${userId}: ${e.message}`);
      return { error: true, message: 'Projects not found' };
    }
  }

  async findOne(id: number, checkPublished: boolean = false): Promise<ProjectResponseDto> {
    try {
      this.logger.log(`Fetching project with ID: ${id}`);

      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id },
        relations: ['company'],
      });

      if (!project) {
        this.logger.warn(`Project with ID ${id} not found.`);
        return { error: true, message: 'Project not found.' };
      }

      this.logger.log(`Project with ID ${id} found.`);

      if (checkPublished && !project.published) {
        this.logger.warn(`Project with ID ${id} is not published.`);
        return { error: true, message: 'Project not published.' };
      }

      this.logger.log(`Returning project with ID ${id}.`);
      return { error: false, project };
    } catch (e) {
      this.logger.error(`Error fetching project with ID ${id}: ${e.message}`);
      return { error: true, message: 'Project not found.' };
    }
  }

  async findOneByUrl(projectUrl: string): Promise<ProjectResponseDto> {
    try {
      this.logger.log(`Attempting to fetch project with URL: ${projectUrl}`);

      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { project_custom_url: projectUrl },
        relations: ['company'],
      });

      if (!project) {
        this.logger.warn(`No project found with URL: ${projectUrl}`);
        return { error: true, message: 'Project not found.' };
      }

      if (!project.published) {
        this.logger.warn(`Project with URL: ${projectUrl} exists but is not published.`);
        return { error: true, message: 'Project not published.' };
      }

      this.logger.log(`Project with URL: ${projectUrl} fetched successfully.`);
      return { error: false, project };
    } catch (e) {
      this.logger.error(`Error fetching project with URL: ${projectUrl}. Error: ${e.message}`);
      return { error: true, message: 'Project not found.' };
    }
  }

  async getCompanyInfo(companyData: {
    company_id: string;
    company_name: string;
    logo_url?: string;
    domain?: string;
    website_url?: string;
  }) {
    this.logger.log(`Fetching company information for company ID: ${companyData?.company_id}`);

    if (companyData && companyData.company_id) {
      try {
        const company = await this.companyRepository.findOne({
          where: { company_id: companyData.company_id },
        });

        if (company) {
          this.logger.log(
            `Company found with ID: ${companyData.company_id}. Returning existing logo URL.`,
          );
          return company.logo_url;
        } else {
          this.logger.warn(
            `Company not found with ID: ${companyData.company_id}. Creating a new company.`,
          );

          const newCompany = await this.companyService.createCompany({
            company_id: companyData.company_id,
            name: companyData.company_name,
            logo_url: companyData.logo_url || null,
            domain: companyData.domain || null,
            website_url: companyData.website_url || null,
          });

          if (newCompany && !newCompany.error) {
            this.logger.log(`New company created with ID: ${companyData.company_id}.`);
            return newCompany.createdCompany.logo_url;
          } else {
            this.logger.error(`Failed to create company with ID: ${companyData.company_id}.`);
            return null;
          }
        }
      } catch (error) {
        this.logger.error(
          `Error fetching company info for ID: ${companyData.company_id}. Error: ${error.message}`,
        );
        return null;
      }
    }

    this.logger.warn(`Invalid company data provided: ${JSON.stringify(companyData)}`);
    return null;
  }

  async createAndPublish(
    body: RecruiterProjectRequestDto,
    userId: number,
    buffer: Buffer,
    imageType: string | null,
    companyData: CompanyDataDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`Starting project creation and publishing process for user ID: ${userId}`);

    try {
      const accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);
      this.logger.log(`Parsed project data for title: ${accountProjectData.title}`);

      // Find the user by userId
      const user: UserAccounts = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found or unauthorized.`);
        return { error: true, message: 'User not found or unauthorized.' };
      }

      accountProjectData.user = user;

      // Check if the user is associated with a recruiter company
      const recruiterCompanyUser: RecruiterCompanyUser =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User with ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      // Check or generate unique project URL
      if (!accountProjectData.project_custom_url) {
        accountProjectData.project_custom_url = await this.generateUniqueProjectUrl(
          accountProjectData.title,
        );
        this.logger.log(`Generated unique project URL: ${accountProjectData.project_custom_url}`);
      } else {
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
          where: { project_custom_url: accountProjectData.project_custom_url },
        });

        if (urlExist) {
          this.logger.warn(
            `Project URL '${accountProjectData.project_custom_url}' already exists.`,
          );
          return { error: true, message: 'This job custom URL already exists.' };
        }
      }

      // Handle project logo upload
      if (imageType) {
        this.logger.log(`Uploading project logo for project: ${accountProjectData.title}`);
        const storedImage: string = await this.uploadService.uploadNewImage(
          buffer,
          'recruiter_project_images',
          imageType,
        );

        if (storedImage) {
          this.logger.log(`Logo uploaded successfully: ${storedImage}`);
          accountProjectData.logo = storedImage;
          accountProjectData.logo_type = imageType;
        } else {
          this.logger.warn(`Failed to upload logo for project: ${accountProjectData.title}`);
        }
      }

      // Handle company logo if company data is provided
      if (
        companyData &&
        companyData.company_id &&
        companyData.company_name &&
        companyData.logo_url
      ) {
        this.logger.log(`Fetching company info for company ID: ${companyData.company_id}`);
        accountProjectData.logo = await this.getCompanyInfo(companyData);
        accountProjectData.logo_type = 'url';
        accountProjectData.company_id = companyData.company_id;
      }

      // Set associated company
      accountProjectData.company = recruiterCompanyUser.company;
      this.logger.log(`Assigned company ID ${recruiterCompanyUser.company.id} to project.`);

      // Validate required fields
      if (this.hasRequiredFields(accountProjectData)) {
        accountProjectData.draft = false;
        accountProjectData.published = true;
        this.logger.log(`All required fields are valid. Proceeding to save the project.`);

        // Save project to the database
        const project: RecruiterProjectDto =
          this.recruiterProjectRepository.create(accountProjectData);
        await this.recruiterProjectRepository.save(project);

        this.logger.log(
          `Project '${accountProjectData.title}' created and published successfully.`,
        );
        return {
          error: false,
          message: 'Project created successfully.',
          project,
        };
      } else {
        this.logger.warn(`Required fields missing in project data for user ID: ${userId}`);
        return {
          error: true,
          message: 'Please fill all the required fields.',
        };
      }
    } catch (e) {
      this.logger.error(`Error creating project for user ID: ${userId} - ${e.message}`);
      return {
        error: true,
        message: 'Project not created.',
      };
    }
  }

  async updateAndPublish(
    body: RecruiterProjectRequestDto,
    userId: number,
    projectId: number,
    buffer: Buffer,
    imageType: string | null,
    companyData: CompanyDataDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log(
      `Starting project update and publish process for user ID: ${userId}, Project ID: ${projectId}`,
    );

    try {
      // Parse project data
      const accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);
      this.logger.log(`Parsed project data for update. Project Title: ${accountProjectData.title}`);

      // Verify user existence and role
      const user: UserAccounts = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found or unauthorized.`);
        return { error: true, message: 'User not found or unauthorized.' };
      }

      accountProjectData.user = user;

      // Check if user is associated with a recruiter company
      const recruiterCompanyUser: RecruiterCompanyUser =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User with ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      // Find the existing project
      let project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        this.logger.warn(`Project with ID ${projectId} not found.`);
        return { error: true, message: 'Project not found.' };
      }

      // Check for existing custom URL
      if (accountProjectData.project_custom_url) {
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
          where: { project_custom_url: accountProjectData.project_custom_url },
        });

        if (urlExist && urlExist.id !== project.id) {
          this.logger.warn(
            `Custom URL '${accountProjectData.project_custom_url}' already exists for another project.`,
          );
          return { error: true, message: 'This job custom URL already exists.' };
        }
      }

      // Handle project logo upload
      if (imageType) {
        this.logger.log(`Uploading new logo for project ID ${projectId}.`);
        const storedImage: string = await this.uploadService.uploadNewImage(
          buffer,
          'recruiter_project_images',
          imageType,
        );

        if (storedImage) {
          this.logger.log(`Logo uploaded successfully: ${storedImage}`);
          accountProjectData.logo = storedImage;
          accountProjectData.logo_type = imageType;

          // Delete old logo if it exists
          if (project.logo) {
            await this.uploadService.deleteImage(project.logo, 'recruiter_project_images');
            this.logger.log(`Deleted old logo for project ID ${projectId}.`);
          }
        } else {
          this.logger.warn(`Logo upload failed for project ID ${projectId}.`);
        }
      }

      // Handle company data
      if (
        companyData &&
        companyData.company_id &&
        companyData.company_name &&
        companyData.logo_url
      ) {
        this.logger.log(`Fetching company info for company ID: ${companyData.company_id}`);
        accountProjectData.logo = await this.getCompanyInfo(companyData);
        accountProjectData.logo_type = 'url';
        accountProjectData.company_id = companyData.company_id;
      }

      // Set the associated company in the project data
      accountProjectData.company = recruiterCompanyUser.company;
      this.logger.log(
        `Assigned company ID ${recruiterCompanyUser.company.id} to project ID ${projectId}.`,
      );

      // Update project data
      project = { ...accountProjectData };

      // Validate required fields
      if (this.hasRequiredFields(project)) {
        project.draft = false;
        project.published = true;
        this.logger.log(
          `All required fields are valid for project ID ${projectId}. Proceeding to update.`,
        );

        // Save the updated project
        await this.recruiterProjectRepository.update(projectId, project);
        this.logger.log(`Project ID ${projectId} updated and published successfully.`);

        return {
          error: false,
          message: 'Project updated and published successfully.',
          project,
        };
      } else {
        this.logger.warn(`Missing required fields for project ID ${projectId}.`);
        return {
          error: true,
          message: 'Please fill all the required fields.',
        };
      }
    } catch (e) {
      this.logger.error(`Error updating project ID ${projectId}: ${e.message}`);
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
    companyData: CompanyDataDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`Starting project creation process for user ID: ${userId}`);

    try {
      // Parse project data
      const accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);
      this.logger.log(
        `Parsed project data for user ID ${userId}. Project Title: ${accountProjectData.title}`,
      );

      // Verify user existence and role
      const user: UserAccounts = await this.userRepository.findOne({
        where: { id: userId, role: In(['User', 'Admin']) },
      });

      if (!user) {
        this.logger.warn(`User with ID ${userId} not found or unauthorized.`);
        return { error: true, message: 'User not found or unauthorized.' };
      }

      accountProjectData.user = user;

      // Check if the user is associated with a company
      const recruiterCompanyUser: RecruiterCompanyUser =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User with ID ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      // Handle custom project URL
      if (!accountProjectData.project_custom_url) {
        accountProjectData.project_custom_url = await this.generateUniqueProjectUrl(
          accountProjectData.title,
        );
        this.logger.log(
          `Generated custom URL for project: ${accountProjectData.project_custom_url}`,
        );
      } else {
        const urlExist = await this.recruiterProjectRepository.findOne({
          where: { project_custom_url: accountProjectData.project_custom_url },
        });

        if (urlExist) {
          this.logger.warn(`Custom URL '${accountProjectData.project_custom_url}' already exists.`);
          return { error: true, message: 'This job custom URL already exists.' };
        }
      }

      // Handle logo upload
      if (imageType) {
        this.logger.log(`Uploading logo for project. Image Type: ${imageType}`);
        const storedImage: string = await this.uploadService.uploadNewImage(
          buffer,
          'recruiter_project_images',
          imageType,
        );

        if (storedImage) {
          this.logger.log(`Logo uploaded successfully: ${storedImage}`);
          accountProjectData.logo = storedImage;
          accountProjectData.logo_type = imageType;
        } else {
          this.logger.warn(`Failed to upload logo for user ID ${userId}`);
        }
      }

      // Handle company data
      if (
        companyData &&
        companyData.company_id &&
        companyData.company_name &&
        companyData.logo_url
      ) {
        this.logger.log(`Fetching company info for company ID: ${companyData.company_id}`);
        accountProjectData.logo = await this.getCompanyInfo(companyData);
        accountProjectData.logo_type = 'url';
        accountProjectData.company_id = companyData.company_id;
      }

      // Set the company in project data
      accountProjectData.company = recruiterCompanyUser.company;

      // Create project
      const project: RecruiterProjectDto =
        this.recruiterProjectRepository.create(accountProjectData);

      // Validate project
      const errors: ValidationError[] = await validate(project);
      if (errors.length > 0) {
        this.logger.warn(
          `Validation failed for project creation. Errors: ${JSON.stringify(errors)}`,
        );
        return { error: true, message: 'Please send all the required fields.' };
      }

      // Save project
      await this.recruiterProjectRepository.save(project);
      this.logger.log(
        `Project created successfully for user ID ${userId}. Project ID: ${project.id}`,
      );

      return {
        error: false,
        message: 'Project created successfully.',
        project,
      };
    } catch (e) {
      this.logger.error(`Error creating project for user ID ${userId}: ${e.message}`, e.stack);
      return { error: true, message: 'Project not created!' };
    }
  }

  async publishProject(projectId: number, userId: number): Promise<ProjectResponseDto> {
    this.logger.log(`Attempting to publish project with ID: ${projectId} by user ID: ${userId}`);

    try {
      // Fetch the project by ID and user
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: projectId, user: { id: userId } },
      });

      // Check if the project exists
      if (!project) {
        this.logger.warn(`Project with ID ${projectId} not found for user ID ${userId}`);
        return { error: true, message: 'Project not found.' };
      }

      // Check if the project is already published
      if (project.published) {
        this.logger.warn(`Project with ID ${projectId} is already published.`);
        return { error: true, message: 'Project is already published.' };
      }

      // Check if the project has all required fields
      if (this.hasRequiredFields(project)) {
        this.logger.log(
          `All required fields are filled for project ID ${projectId}. Publishing now.`,
        );

        // Set draft to false and published to true
        project.draft = false;
        project.published = true;

        // Save the updated project
        await this.recruiterProjectRepository.save(project);

        this.logger.log(`Project with ID ${projectId} has been published successfully.`);

        return {
          error: false,
          message: 'Project published successfully.',
          project,
        };
      } else {
        this.logger.warn(
          `Required fields are missing for project ID ${projectId}. Cannot publish.`,
        );
        return { error: true, message: 'Please fill in all required fields.' };
      }
    } catch (e) {
      this.logger.error(`Error publishing project with ID ${projectId}: ${e.message}`, e.stack);
      return { error: true, message: e.message || 'Failed to publish project.' };
    }
  }

  async unpublishProject(projectId: number, userId: number): Promise<ProjectResponseDto> {
    this.logger.log(`Attempting to unpublish project with ID: ${projectId} by user ID: ${userId}`);

    try {
      // Fetch the project by ID
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: projectId },
      });

      // Check if the project exists
      if (!project) {
        this.logger.warn(`Project with ID ${projectId} not found for user ID ${userId}`);
        return { error: true, message: 'Project not found.' };
      }

      // Check if the project is already unpublished
      if (!project.published) {
        this.logger.warn(`Project with ID ${projectId} is already unpublished.`);
        return { error: true, message: 'Project is already unpublished.' };
      }

      // Set published to false and draft to true
      project.published = false;
      project.draft = true;

      // Save the updated project
      await this.recruiterProjectRepository.save(project);

      this.logger.log(`Project with ID ${projectId} has been unpublished successfully.`);

      return {
        error: false,
        message: 'Project unpublished successfully.',
        project,
      };
    } catch (e) {
      this.logger.error(`Error unpublishing project with ID ${projectId}: ${e.message}`, e.stack);
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
      project.location != null &&
      project.location_type &&
      project.description &&
      (project.location_type !== 'hybrid' || project.hybrid_days !== null) &&
      (project.business_range ?? 0) +
        (project.existing_business_range ?? 0) +
        (project.partnership_range ?? 0) ===
        100 &&
      (project.inbound_range ?? 0) + (project.outbound_range ?? 0) === 100 &&
      (project.smb ?? 0) + (project.midmarket ?? 0) + (project.enterprise ?? 0) === 100 &&
      project.minimum_deal_size !== null &&
      project.minimum_sale_cycle !== null &&
      project.Industry_Works_IN &&
      project.Industry_Sold_To &&
      project.selectedPersona &&
      project.territory &&
      project.languages &&
      project.minimum_salecycle_type &&
      project.experience_type &&
      project.experience_type.length > 0
    );
  }
  async update(
    userId: number,
    id: number,
    body: RecruiterProjectRequestDto,
    buffer: Buffer,
    imageType: string | null,
    companyData: CompanyDataDto,
  ): Promise<ProjectResponseDto> {
    this.logger.log(`User ID ${userId} is attempting to update project with ID ${id}`);

    try {
      // Fetch the project by ID
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id },
      });

      if (!project) {
        this.logger.warn(`Project with ID ${id} not found for user ID ${userId}`);
        return {
          error: true,
          message: 'Project not found.',
        };
      }

      this.logger.log(`Project with ID ${id} found. Proceeding with the update.`);

      const accountProjectData: RecruiterProject = this.parseRecruiterProjectData(body);

      // Check if the custom URL is unique
      if (accountProjectData.project_custom_url) {
        const urlExist: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
          where: { project_custom_url: accountProjectData.project_custom_url },
        });

        if (urlExist && urlExist.id !== project.id) {
          this.logger.warn(
            `Custom URL "${accountProjectData.project_custom_url}" already exists for another project.`,
          );
          return {
            error: true,
            message: 'This job custom URL already exists.',
          };
        }
      }

      // Handle image upload
      if (imageType) {
        this.logger.log(`Uploading new image for project ID ${id} with image type ${imageType}`);

        const storedImage: string = await this.uploadService.uploadNewImage(
          buffer,
          'recruiter_project_images',
          imageType,
        );

        if (storedImage) {
          this.logger.log(`Image uploaded successfully for project ID ${id}: ${storedImage}`);
          accountProjectData.logo = storedImage;
          accountProjectData.logo_type = imageType;

          this.logger.log(`Deleting old image for project ID ${id}: ${project.logo}`);
          await this.uploadService.deleteImage(project.logo, 'recruiter_project_images');
        }
      }

      // Handle company data update
      if (
        companyData &&
        companyData.company_id &&
        companyData.company_name &&
        companyData.logo_url
      ) {
        this.logger.log(`Updating company info for project ID ${id}`);
        accountProjectData.logo = await this.getCompanyInfo(companyData);
        accountProjectData.logo_type = 'url';
        accountProjectData.company_id = companyData.company_id;
      }

      // Check if published project has all required fields
      if (project.published && !this.hasRequiredFields(accountProjectData as RecruiterProject)) {
        this.logger.warn(`Project ID ${id} lacks required fields. Marking as draft.`);
        accountProjectData.published = false;
        accountProjectData.draft = true;
      }

      // Save updated project
      await this.recruiterProjectRepository.update(id, accountProjectData);
      this.logger.log(`Project with ID ${id} updated successfully by user ID ${userId}`);

      return { error: false, message: 'Project updated successfully.' };
    } catch (e) {
      this.logger.error(
        `Error updating project with ID ${id} by user ID ${userId}: ${e.message}`,
        e.stack,
      );
      return { error: true, message: 'Project not updated.' };
    }
  }

  async remove(id: number, userId: number): Promise<ProjectResponseDto> {
    this.logger.log(`User ID ${userId} is attempting to delete project with ID ${id}`);

    try {
      // Check if the project exists
      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id },
      });

      if (!project) {
        this.logger.warn(`Project with ID ${id} not found for user ID ${userId}`);
        return {
          error: true,
          message: 'Project not found.',
        };
      }

      this.logger.log(`Project with ID ${id} found. Proceeding with deletion.`);

      // Delete related applications
      const applications: ProjectApplication[] = await this.applicationService.find({
        where: { project: { id: id } },
      });

      if (applications.length > 0) {
        this.logger.log(`Deleting ${applications.length} applications related to project ID ${id}`);
        await this.applicationService.remove(applications);
      } else {
        this.logger.log(`No applications found for project ID ${id}`);
      }

      // Delete related visitors
      const visitors: ProjectVisitors[] = await this.visitorRepository.find({
        where: { project: { id: id } },
      });

      if (visitors.length > 0) {
        this.logger.log(`Deleting ${visitors.length} visitor records related to project ID ${id}`);
        await this.visitorRepository.remove(visitors);
      } else {
        this.logger.log(`No visitors found for project ID ${id}`);
      }

      // Delete the project's image if it exists
      if (project.logo) {
        this.logger.log(`Deleting project logo for project ID ${id}: ${project.logo}`);
        await this.uploadService.deleteImage(project.logo, 'recruiter_project_images');
      }

      // Delete the project itself
      await this.recruiterProjectRepository.delete(id);
      this.logger.log(`Project with ID ${id} deleted successfully by user ID ${userId}`);

      return { error: false, message: 'Project Deleted Successfully' };
    } catch (e) {
      this.logger.error(
        `Error deleting project with ID ${id} by user ID ${userId}: ${e.message}`,
        e.stack,
      );
      return { error: true, message: 'Project not deleted.' };
    }
  }

  async updateProjectPicture(
    id: number,
    image,
    userId: number,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.log(`User ID ${userId} is attempting to update the image for project ID ${id}`);

    try {
      // Check if the project exists
      const project = await this.recruiterProjectRepository.findOne({
        where: { id },
      });

      if (!project) {
        this.logger.warn(`Project with ID ${id} not found for user ID ${userId}`);
        return {
          error: true,
          message: 'Project not found.',
        };
      }

      this.logger.log(`Project with ID ${id} found. Proceeding with image upload.`);

      // Upload the new image
      const storedImage = await this.uploadService.uploadNewImage(image, 'project_images');

      // if (storedImage) {
      this.logger.log(`Image uploaded successfully for project ID ${id}: ${storedImage}`);

      // Assuming the project has a field for storing the image URL
      //  project.project_image = storedImage;

      await this.recruiterProjectRepository.save(project);
      this.logger.log(
        `Project image updated successfully for project ID ${id} by user ID ${userId}`,
      );

      return { error: false, message: 'Project image updated successfully' };
      //  }
    } catch (error) {
      this.logger.error(
        `Error updating project image for project ID ${id} by user ID ${userId}: ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to update project image.' };
    }
  }

  calculatePointsForUser = async (
    application: ProjectApplicationWithPostions,
  ): Promise<{ points: PointsDto; percentage: number }> => {
    this.logger.log(
      `Starting points calculation for user ID: ${application.user.id} and project ID: ${application.project.id}`,
    );

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
        points_for_experience: 0,
      };

      if (application.user.positions.length === 0) {
        this.logger.warn(
          `User ID: ${application.user.id} has no positions. Returning zero points.`,
        );
        return { points, percentage: 0 };
      }

      this.logger.log(`Calculating points for user ID: ${application.user.id}`);

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
        number, // points_for_experience
      ] = await Promise.all([
        this.pointsService.points_for_ote(application.user.ote_expectation, application.ote),
        this.pointsService.points_for_worked_in(
          application.user.positions,
          application.project.Industry_Works_IN,
        ),
        this.pointsService.points_for_sold_to(
          application.user.positions,
          application.project.Industry_Sold_To,
        ),
        this.pointsService.points_for_segment(application.user.positions, application.project),
        this.pointsService.points_for_sales_cycle(application.user.positions, application.project),
        this.pointsService.points_for_dealsize(application.user.positions, application.project),
        this.pointsService.points_for_new_business(application.user.positions, application.project),
        this.pointsService.points_for_outbound(application.user.positions, application.project),
        this.pointsService.points_for_persona(
          application.user.positions,
          application.project.selectedPersona,
        ),
        this.pointsService.points_for_years(application.user.positions, application.project),
      ]);

      this.logger.log(
        `Points calculated for user ID: ${application.user.id}: ${JSON.stringify(pointsArray)}`,
      );

      const [
        otepoints,
        workedInPoints,
        soldToPoints,
        segmentPoints,
        salescyclePoints,
        dealsizePoints,
        newbusinessPoints,
        outboundPoints,
        pointsForPersona,
        pointsForExperience,
      ] = pointsArray;

      Object.assign(points, {
        ote_points: otepoints,
        workedInPoints,
        soldToPoints,
        segmentPoints,
        salescyclePoints,
        dealsizePoints,
        newbusinessPoints,
        outboundPoints,
        pointsForPersona,
        pointsForExperience,
      });

      const sum: number = this.sumObjectValues(points);
      const maxpossiblesum: number = 10 * Object.keys(points).length;
      let percentage: number = Math.round((sum / maxpossiblesum) * 100);
      percentage = Math.min(percentage, 100);

      this.logger.log(`Total points for user ID: ${application.user.id}: ${sum}`);
      this.logger.log(`Calculated percentage for user ID: ${application.user.id}: ${percentage}%`);

      return { points, percentage };
    } catch (e) {
      this.logger.error(
        `Error calculating points for user ID: ${application.user.id} in project ID: ${application.project.id}: ${e.message}`,
        e.stack,
      );
      return { points: {}, percentage: 0 };
    }
  };

  sumObjectValues(obj) {
    let sum = 0;
    for (const key in obj) {
      /* eslint */
      if (obj.hasOwnProperty(key)) {
        sum += obj[key];
      }
    }
    return sum;
  }

  private filterPositionsByRecentYears(positions: PositionDto[], filter: string): PositionDto[] {
    this.logger.log(`Starting to filter positions based on filter: ${filter}`);

    if (!filter) {
      this.logger.warn('No filter provided. Returning all positions without filtering.');
      return positions;
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

    if (selectedYears === undefined) {
      this.logger.warn(`Invalid filter "${filter}" provided. Returning all positions.`);
      return positions;
    }

    const currentDate: Date = new Date();
    const thresholdDate: Date = new Date();

    if (selectedYears !== null) {
      thresholdDate.setFullYear(currentDate.getFullYear() - selectedYears);
      this.logger.log(
        `Filtering positions for the last ${selectedYears} year(s). Threshold date: ${thresholdDate.toISOString()}`,
      );
    } else {
      this.logger.log('Filtering positions for all years (5+ years).');
    }

    const filteredPositions = positions.filter((position) => {
      const positionStartDate: Date = new Date(
        position.start_year,
        (position.start_month || 1) - 1,
      );
      const positionEndDate: Date = position.end_year
        ? new Date(position.end_year, (position.end_month || 12) - 1)
        : currentDate; // Ongoing position

      const isWithinRange = positionEndDate >= thresholdDate && positionStartDate <= currentDate;

      return isWithinRange;
    });

    this.logger.log(`Filtered positions count: ${filteredPositions.length}`);

    return filteredPositions;
  }

  async getRanking(
    projectId: number,
    userId: number,
    minExperience?: string,
  ): Promise<ApplicationRankingListResponseDto> {
    try {
      this.logger.log(`Fetching ranking for project ID: ${projectId} by user ID: ${userId}`);

      const recruiterCompanyUser: RecruiterCompanyUserDto =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User ID: ${userId} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      const project: RecruiterProjectDto = await this.recruiterProjectRepository.findOne({
        where: { id: projectId },
        relations: ['company'],
      });

      if (!project || project.company.id !== recruiterCompanyUser.company.id) {
        this.logger.warn(
          `Project ID: ${projectId} not found or does not belong to the company of user ID: ${userId}`,
        );
        return { error: true, message: 'Project not found.' };
      }

      this.logger.log(`Fetching applications for project ID: ${projectId}`);

      const applications: ProjectApplication[] = await this.applicationService
        .createQueryBuilder('application')
        .leftJoinAndSelect('application.project', 'project')
        .leftJoinAndSelect('application.user', 'user')
        .leftJoinAndSelect('user.positions', 'position')
        .leftJoinAndSelect('position.details', 'detail')
        .leftJoinAndSelect('position.company', 'company')
        .where('project.id = :projectId', { projectId: projectId })
        .getMany();

      this.logger.log(`Total applications fetched: ${applications.length}`);

      const updatedApplications: ProjectApplicationWithPostions[] = applications.map(
        (application: ProjectApplicationDto) => {
          const filteredPositions: PositionDto[] = this.filterPositionsByRecentYears(
            application.user.positions,
            minExperience,
          );
          const validPositions: PositionDto[] = filteredPositions.filter(
            (position) =>
              position.details &&
              this.sharedService.calculateCompletionPercentage(position) === 100.0,
          );

          this.logger.log(
            `Application ID: ${application.id} | Valid Positions after filtering: ${validPositions.length}`,
          );

          return {
            ...application,
            user: {
              ...application.user,
              positions: validPositions,
            },
          };
        },
      );

      this.logger.log(`Calculating user points for ${updatedApplications.length} applications.`);

      const updatedApplicationsWithUserPoints: ProjectApplicationWithUserPointsDto[] =
        await Promise.all(
          updatedApplications.map(async (application: ProjectApplicationWithPostions) => {
            const updatedUser = await this.calculatePointsForUser(application);
            this.logger.log(
              `Calculated points for User ID: ${application.user.id} | Percentage: ${updatedUser.percentage}%`,
            );
            return {
              ...application,
              user: { ...application.user, points: updatedUser },
            };
          }),
        );

      let above75Count: number = 0;
      updatedApplicationsWithUserPoints.forEach((item) => {
        if (item?.user?.points?.percentage >= 75) {
          above75Count++;
        }
      });

      this.logger.log(`Number of candidates with score above 75%: ${above75Count}`);

      const visitorCount: number = await this.projectVisitorsRepository.count({
        where: { project: { id: projectId } },
      });

      this.logger.log(`Total visitor count for project ID: ${projectId}: ${visitorCount}`);

      return {
        error: false,
        updatedApplicationsWithUserPoints,
        above75Count,
        visitorCount,
        project,
      };
    } catch (e) {
      this.logger.error(`Error fetching ranking for project ID: ${projectId}. Error: ${e.message}`);
      return { error: true, message: 'Error for getting ranking, try again.' };
    }
  }

  parseRecruiterProjectData(data: RecruiterProjectRequestDto): RecruiterProject {
    const parsedData = new RecruiterProject();

    // Parse numeric fields
    parsedData.experience = data.experience ? parseInt(data.experience) : null;
    parsedData.ote_start = data.ote_start ? parseInt(data.ote_start) : null;
    parsedData.ote_end = data.ote_end ? parseInt(data.ote_end) : null;
    parsedData.existing_business_range = data.existing_business_range
      ? parseInt(data.existing_business_range)
      : null;
    parsedData.business_range = data.business_range ? parseInt(data.business_range) : null;
    parsedData.partnership_range = data.partnership_range ? parseInt(data.partnership_range) : null;
    parsedData.inbound_range = data.inbound_range ? parseInt(data.inbound_range) : null;
    parsedData.outbound_range = data.outbound_range ? parseInt(data.outbound_range) : null;
    parsedData.smb = data.smb ? parseInt(data.smb) : null;
    parsedData.midmarket = data.midmarket ? parseInt(data.midmarket) : null;
    parsedData.enterprise = data.enterprise ? parseInt(data.enterprise) : null;
    parsedData.minimum_deal_size = data.minimum_deal_size ? parseInt(data.minimum_deal_size) : null;
    parsedData.minimum_sale_cycle = data.minimum_sale_cycle
      ? parseInt(data.minimum_sale_cycle)
      : null;
    parsedData.hybrid_days = data.hybrid_days ? parseInt(data.hybrid_days) : null;

    // Parse boolean fields
    parsedData.is_travel_requirements = data.is_travel_requirements == 'Yes';
    parsedData.is_ote_visible = data.is_ote_visible == 'true';

    // Parse date fields
    parsedData.start_date = data.start_date ? new Date(data.start_date) : null;

    // Parse simple-array fields

    parsedData.Industry_Works_IN = data.Industry_Works_IN
      ? // eslint-disable-next-line no-useless-escape
        data.Industry_Works_IN.replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
      : null;

    // Handle other fields which might need splitting and joining as comma-separated strings
    parsedData.Industry_Sold_To = data.Industry_Sold_To
      ? // eslint-disable-next-line no-useless-escape
        data.Industry_Sold_To.replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
      : null;

    parsedData.selectedPersona = data.selectedPersona
      ? data.selectedPersona
          // eslint-disable-next-line no-useless-escape
          .replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
      : null;

    parsedData.territory = data.territory
      ? data.territory
          // eslint-disable-next-line no-useless-escape
          .replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
      : null;

    parsedData.languages = data.languages
      ? data.languages
          // eslint-disable-next-line no-useless-escape
          .replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
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
      ? data.location
          // eslint-disable-next-line no-useless-escape
          .replace(/[\[\]']/g, '')
          .split(',')
          .map((item) => item.trim())
      : null;
    parsedData.linkedin_profile = data.linkedin_profile || null;
    parsedData.minimum_salecycle_type = data.minimum_salecycle_type || null;
    parsedData.timeline = data.timeline || null;
    parsedData.benefits = data.benefits || null;
    parsedData.office_address = data.office_address || null;
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
    this.logger.log(`Generating unique project URL for project name: "${projectName}"`);

    const baseProjectName = projectName.toLowerCase().replace(/\s+/g, '-');
    this.logger.log(`Base project URL generated: "${baseProjectName}"`);

    let updateBaseProjectName = baseProjectName;
    let counter = 2;

    while (
      await this.recruiterProjectRepository.findOne({
        where: { project_custom_url: updateBaseProjectName },
      })
    ) {
      this.logger.warn(`Project URL "${updateBaseProjectName}" already exists. Trying a new one.`);
      updateBaseProjectName = `${baseProjectName}-${counter}`;
      counter++;
    }

    this.logger.log(`Unique project URL generated: "${updateBaseProjectName}"`);
    return updateBaseProjectName;
  }
}
