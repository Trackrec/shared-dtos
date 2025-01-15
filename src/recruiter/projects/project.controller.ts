// account-project.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { RecruiterProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import {
  AllUsersProjectsResponseDto,
  CheckAppliedResponseDto,
  ProjectResponseDto,
  GetCandidatesResponseDto,
  ProjectListResponseDto,
  RecruiterProjectRequestDto,
  ProjectIdQueryDto,
  CandidatesListQueryDto,
  ProjectListQueryDto,
  ProjectViewByUrlParamDto,
  ProjectByIdParamDto,
  ProjectRankingQueryDto,
} from 'src/shared-dtos/src/recruiter_project.dto';
import { CompanyDataDto } from 'src/shared-dtos/src/company.dto';
import { ApplicationRankingListResponseDto } from 'src/shared-dtos/src/project_application.dto';
import {
  candidatesListQuerySchema,
  projectByIdParamSchema,
  projectIdQuerySchema,
  projectListQuerySchema,
  projectRankingQuerySchema,
  projectViewByUrlParamSchema,
  recruiterProjectRequestSchema,
} from 'src/validations/recruiter_project.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import { ThrottlerGuard } from '@nestjs/throttler';
@Controller('recruiter/projects')
export class RecruiterProjectController {
  private readonly logger = new Logger(RecruiterProjectController.name);

  constructor(private readonly recruiterProjectService: RecruiterProjectService) {}

  @Get('check_applied')
  async checkApplied(
    @Req() req: Request,
    @Query(new ZodValidationPipe(projectIdQuerySchema)) query: ProjectIdQueryDto,
  ): Promise<CheckAppliedResponseDto> {
    const userId: number = req['user_id'];
    const { project_id: projectId } = query;

    this.logger.log(`Checking if user ID ${userId} has applied for project ID ${projectId}`);

    try {
      const result = await this.recruiterProjectService.checkApplied(+projectId, +userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error checking application status for user ID ${userId} and project ID ${projectId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('candidates')
  async getCandidates(
    @Req() req: Request,
    @Query(new ZodValidationPipe(candidatesListQuerySchema)) query: CandidatesListQueryDto,
  ): Promise<GetCandidatesResponseDto> {
    const userId: number = req['user_id'];
    const { page = 1, limit = 10 } = query;

    this.logger.log(`Fetching candidates for user ID ${userId} | Page: ${page}, Limit: ${limit}`);

    try {
      const result = await this.recruiterProjectService.getCandidates(+userId, +page, +limit);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching candidates for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query(new ZodValidationPipe(projectListQuerySchema)) query: ProjectListQueryDto,
  ): Promise<ProjectListResponseDto> {
    const userId: number = req['user_id'];
    const { page = 1, limit = 10, title, startDate, status, ref } = query;
    const parsedStartDate: Date = startDate ? new Date(startDate) : undefined;

    this.logger.log(
      `Fetching all projects for user ID ${userId} | Page: ${page}, Limit: ${limit}, Title: ${title}, Status: ${status}`,
    );

    try {
      const result = await this.recruiterProjectService.findAll(
        userId,
        +page,
        +limit,
        title,
        parsedStartDate,
        status,
        ref,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error fetching projects for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('/all-users')
  async findAllUsersProjects(@Req() req: Request): Promise<AllUsersProjectsResponseDto> {
    const userId: number = req['user_id'];

    this.logger.log(`Fetching all projects across users for user ID ${userId}`);

    try {
      const result = await this.recruiterProjectService.findAllUsersProjects(userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching all users' projects for user ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  @UseGuards(ThrottlerGuard)
  @Get('project-view/:project_url')
  async findOne(
    @Param(new ZodValidationPipe(projectViewByUrlParamSchema)) param: ProjectViewByUrlParamDto,
  ): Promise<ProjectResponseDto> {
    const { project_url: projectUrl } = param;

    this.logger.log(`Fetching project by URL: ${projectUrl}`);

    try {
      const result = await this.recruiterProjectService.findOneByUrl(projectUrl);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching project by URL ${projectUrl}: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async findOneProject(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
  ): Promise<ProjectResponseDto> {
    const { id } = param;

    this.logger.log(`Fetching project by ID: ${id}`);

    try {
      const result = await this.recruiterProjectService.findOne(+id);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching project by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema))
    accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    this.logger.log(`User ID ${userId} initiated project creation`);

    let imageType: string | null = null;
    if (image) {
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

      if (imgType && allowedImageTypes.includes(imgType)) {
        imageType = imgType;
        this.logger.log(`Uploaded image type validated: ${imageType}`);
      } else {
        this.logger.warn(`Invalid image type uploaded: ${imgType}`);
      }
    }

    const {
      company_id: companyId,
      company_name: companyName,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    } = accountProjectData;

    this.logger.log(`Creating project for company: ${companyName} (ID: ${companyId})`);

    const companyData: CompanyDataDto = {
      company_id: companyId,
      company_name: companyName,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    };

    try {
      const result = await this.recruiterProjectService.create(
        accountProjectData,
        userId,
        image?.buffer,
        imageType,
        companyData,
      );
      this.logger.log(`Project created successfully for user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating project for user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('save_and_publish')
  @UseInterceptors(FileInterceptor('logo'))
  async saveAndPublish(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema))
    accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    this.logger.log(`User ID ${userId} initiated save and publish project process`);

    let imageType: string | null = null;
    if (image) {
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

      if (imgType && allowedImageTypes.includes(imgType)) {
        imageType = imgType;
        this.logger.log(`Uploaded image type validated: ${imageType}`);
      } else {
        this.logger.warn(`Invalid image type uploaded: ${imgType}`);
      }
    }

    const {
      company_id: companyId,
      company_name: companyName,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    } = accountProjectData;

    this.logger.log(`Saving and publishing project for company: ${companyName} (ID: ${companyId})`);

    const companyData: CompanyDataDto = {
      company_id: companyId,
      company_name: companyId,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    };

    try {
      const result = await this.recruiterProjectService.createAndPublish(
        accountProjectData,
        userId,
        image?.buffer,
        imageType,
        companyData,
      );
      this.logger.log(`Project saved and published successfully for user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error saving and publishing project for user ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('update_and_publish/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateAndPublish(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema))
    accountProjectData: RecruiterProjectRequestDto,
    @Req() req: Request,
    @UploadedFile() image: Multer.File,
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    this.logger.log(`User ID ${userId} initiated update and publish for project ID ${id}`);

    let imageType: string | null = null;
    if (image) {
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

      if (imgType && allowedImageTypes.includes(imgType)) {
        imageType = imgType;
        this.logger.log(`Uploaded image type validated: ${imageType}`);
      } else {
        this.logger.warn(`Invalid image type uploaded: ${imgType}`);
      }
    }

    const {
      company_id: companyId,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      company_website_url: companyWebsiteUrl,
      company_domain: companyDomain,
    } = accountProjectData;

    this.logger.log(
      `Updating and publishing project for company: ${companyName} (ID: ${companyId})`,
    );

    const companyData: CompanyDataDto = {
      company_id: companyId,
      company_name: companyName,
      company_logo_url: companyLogoUrl,
      company_website_url: companyWebsiteUrl,
      company_domain: companyDomain,
    };

    try {
      const result = await this.recruiterProjectService.updateAndPublish(
        accountProjectData,
        userId,
        id,
        image?.buffer,
        imageType,
        companyData,
      );
      this.logger.log(`Project updated and published successfully for project ID ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating and publishing project for user ID ${userId}, project ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('/:id/publish')
  async publishProject(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    this.logger.log(`User ID ${userId} initiated publish for project ID ${id}`);

    try {
      const result = await this.recruiterProjectService.publishProject(id, userId);
      this.logger.log(`Project ID ${id} published successfully by user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error publishing project ID ${id} by user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('/:id/unpublish')
  async unpublishProject(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    this.logger.log(`User ID ${userId} initiated unpublish for project ID ${id}`);

    try {
      const result = await this.recruiterProjectService.unpublishProject(id, userId);
      this.logger.log(`Project ID ${id} unpublished successfully by user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error unpublishing project ID ${id} by user ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Put('/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema))
    accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    this.logger.log(`User ID ${userId} initiated update for project ID ${id}`);

    let imageType: string | null = null;
    if (image) {
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

      if (imgType && allowedImageTypes.includes(imgType)) {
        imageType = imgType;
        this.logger.log(`Uploaded image type validated: ${imageType}`);
      } else {
        this.logger.warn(`Invalid image type uploaded: ${imgType}`);
      }
    }

    const {
      company_id: companyId,
      company_name: companyName,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    } = accountProjectData;

    const companyData: CompanyDataDto = {
      company_id: companyId,
      company_name: companyName,
      logo_url: logoUrl,
      website_url: websiteUrl,
      domain,
    };

    try {
      const result = await this.recruiterProjectService.update(
        userId,
        +id,
        accountProjectData,
        image?.buffer,
        imageType,
        companyData,
      );
      this.logger.log(`Project ID ${id} updated successfully by user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating project ID ${id} by user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Delete('/:id')
  async remove(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    this.logger.log(`User ID ${userId} initiated deletion for project ID ${id}`);

    try {
      const result = await this.recruiterProjectService.remove(+id, userId);
      this.logger.log(`Project ID ${id} deleted successfully by user ID ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting project ID ${id} by user ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Get('project_ranking/:id')
  async getRanking(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
    @Query(new ZodValidationPipe(projectRankingQuerySchema)) query: ProjectRankingQueryDto,
  ): Promise<ApplicationRankingListResponseDto> {
    const userId: number = req['user_id'];
    const { id } = param;
    const { min_experience: minExperience } = query;

    this.logger.log(
      `User ID ${userId} requested ranking for project ID ${id} with min_experience: ${minExperience}`,
    );

    try {
      const result = await this.recruiterProjectService.getRanking(id, userId, minExperience);
      this.logger.log(
        `Project ranking retrieved successfully for project ID ${id} by user ID ${userId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching ranking for project ID ${id} by user ID ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  getImageTypeFromMimetype(mimetype: string): string | null {
    const parts: string[] = mimetype.split('/');
    if (parts[0] === 'image' && parts[1]) {
      if (parts[1] === 'svg+xml') {
        return 'svg';
      }
      return parts[1];
    }
    return null;
  }
}
