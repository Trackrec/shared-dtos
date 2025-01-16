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
  ParseIntPipe,
} from '@nestjs/common';
import { RecruiterProject } from './project.entity';
import { RecruiterProjectService } from './project.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AllUsersProjectsResponseDto, CheckAppliedResponseDto, ProjectResponseDto, GetCandidatesResponseDto, ProjectListResponseDto, RecruiterProjectDto, RecruiterProjectRequestDto, ProjectIdQueryDto, CandidatesListQueryDto, ProjectListQueryDto, ProjectViewByUrlParamDto, ProjectByIdParamDto, ProjectRankingQueryDto } from 'src/shared-dtos/src/recruiter_project.dto';
import { CompanyDataDto } from 'src/shared-dtos/src/company.dto';
import { ApplicationRankingListResponseDto } from 'src/shared-dtos/src/project_application.dto';
import { candidatesListQuerySchema, projectByIdParamSchema, projectIdQuerySchema, projectListQuerySchema, projectRankingQuerySchema, projectViewByUrlParamSchema, recruiterProjectRequestSchema } from 'src/validations/recruiter_project.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('recruiter/projects')
export class RecruiterProjectController {
  constructor(private readonly recruiterProjectService: RecruiterProjectService) {}
  
  @Get('check_applied')
  async checkApplied(
    @Req() req: Request,
    @Query(new ZodValidationPipe(projectIdQuerySchema)) query: ProjectIdQueryDto,

  ): Promise<CheckAppliedResponseDto> {
    const user_id: number = req['user_id'];
    const {project_id}=query;
    return this.recruiterProjectService.checkApplied(+project_id, +user_id);
  }
  
  @Get('candidates')
  async getCandidates(
    @Req() req: Request,
    @Query(new ZodValidationPipe(candidatesListQuerySchema)) query: CandidatesListQueryDto,
  ): Promise<GetCandidatesResponseDto> {
    const user_id: number = req['user_id'];
    const { page = 1, limit = 10 } = query;
    return this.recruiterProjectService.getCandidates(+user_id, +page, +limit);
  }
  

  @Get()
  async findAll(
    @Req() req: Request,
    @Query(new ZodValidationPipe(projectListQuerySchema)) query: ProjectListQueryDto,
  ): Promise<ProjectListResponseDto> {
    const user_id: number = req['user_id'];
    const { page = 1, limit = 10, title, startDate, status, ref } = query;
    const parsedStartDate: Date = startDate ? new Date(startDate) : undefined;

    return this.recruiterProjectService.findAll(user_id, +page, +limit, title, parsedStartDate, status, ref);
  }

  @Get('/all-users')
  findAllUsersProjects(@Req() req: Request): Promise<AllUsersProjectsResponseDto> {
    const user_id: number=req['user_id']
    return this.recruiterProjectService.findAllUsersProjects(user_id);
  }
  
  @Get('project-view/:project_url')
  findOne(
    @Param(new ZodValidationPipe(projectViewByUrlParamSchema)) param: ProjectViewByUrlParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const {project_url}= param
    return this.recruiterProjectService.findOneByUrl(project_url);
  }

  @Get(':id')
  findOneProject(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const {id}= param;
    return this.recruiterProjectService.findOne(+id);
  }
  
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema)) accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const user_id: number = req['user_id'];
    let imageType: string | null=null;
    if(image){
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }
    
    const {company_id, company_name, logo_url, website_url, domain} = accountProjectData;

    const companyData: CompanyDataDto = {
      company_id,
      company_name,
      logo_url,
      website_url,
      domain
    };
    return this.recruiterProjectService.create(accountProjectData, user_id, image?.buffer, imageType, companyData);
  }

  @Post('save_and_publish')
  @UseInterceptors(FileInterceptor('logo'))
  saveAndPublish(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema)) accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const user_id: number = req['user_id'];
    let imageType: string | null=null;
    if(image){
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }
    const {company_id, company_name, logo_url, website_url, domain} = accountProjectData;

    const companyData: CompanyDataDto = {
      company_id,
      company_name,
      logo_url,
      website_url,
      domain
    };
    return this.recruiterProjectService.createAndPublish(accountProjectData, user_id,  image?.buffer, imageType, companyData);
  }

  @Post('update_and_publish/:id')
  @UseInterceptors(FileInterceptor('logo'))
  updateAndPublish(
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema)) accountProjectData: RecruiterProjectRequestDto,
    @Req() req: Request,
    @UploadedFile() image: Multer.File,
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
  ): Promise<ProjectResponseDto> {
    const user_id: number = req['user_id'];
    const {id}= param;
    let imageType: string | null=null;
    if(image){
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }

    const {company_id, company_name, company_logo_url, company_website_url, company_domain} = accountProjectData;

    const companyData: CompanyDataDto = {
      company_id,
      company_name,
      company_logo_url,
      company_website_url,
      company_domain
    };
    return this.recruiterProjectService.updateAndPublish(accountProjectData, user_id, id, image?.buffer, imageType, companyData);
  }

  @Post('/:id/publish')
  async publishProject(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const userId: number = req['user_id'];
    const {id}= param;
    return this.recruiterProjectService.publishProject(id, userId);
  }

  @Post('/:id/unpublish')
async unpublishProject(
  @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
  @Req() req: Request,
): Promise<ProjectResponseDto> {
  const userId: number = req['user_id'];
  const {id}= param;
  return this.recruiterProjectService.unpublishProject(id, userId);
}

  @Put('/:id')
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto,
    @Body(new ZodValidationPipe(recruiterProjectRequestSchema)) accountProjectData: RecruiterProjectRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<ProjectResponseDto> {
    const user_id: number = req['user_id'];
    const {id}= param;
    let imageType: string | null=null;
    if(image){
      const imgType: string = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }

    const {company_id, company_name, logo_url, website_url, domain} = accountProjectData;

    const companyData: CompanyDataDto = {
      company_id,
      company_name,
      logo_url,
      website_url,
      domain
    };
    return this.recruiterProjectService.update(user_id, +id, accountProjectData, image?.buffer, imageType, companyData);
  }

  @Delete('/:id')
  remove(@Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto, @Req() req: Request): Promise<ProjectResponseDto> {
    const user_id: number = req['user_id'];
    const {id}= param;
    return this.recruiterProjectService.remove(+id, user_id);
  }

 
  
  @Get('project_ranking/:id')
  async getRanking(@Param(new ZodValidationPipe(projectByIdParamSchema)) param: ProjectByIdParamDto, @Req() req: Request,   @Query(new ZodValidationPipe(projectRankingQuerySchema)) query: ProjectRankingQueryDto): Promise<ApplicationRankingListResponseDto> {
    const user_id: number = req['user_id'];
    const {id}= param;
    const {min_experience}= query;
    return await this.recruiterProjectService.getRanking(id, user_id, min_experience);
  }

  getImageTypeFromMimetype(mimetype: string): string | null {
    // Split the mimetype string by '/'
    const parts: string[] = mimetype.split('/');
  
    // Check if the first part is 'image'
    if (parts[0] === 'image' && parts[1]) {
      // Special case for 'svg+xml' which should be treated as 'svg'
      if (parts[1] === 'svg+xml') {
        return 'svg';
      }
      return parts[1]; // The second part is the image type
    } else {
      return null; // Not a valid image mimetype
    }
  }

  
  
}
