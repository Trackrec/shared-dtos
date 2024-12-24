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
@Controller('recruiter/projects')
export class RecruiterProjectController {
  constructor(private readonly recruiterProjectService: RecruiterProjectService) {}

  @Get('check_applied')
  async checkApplied(
    @Req() req: Request,
    @Query('project_id', ParseIntPipe) projectId: number,

  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.checkApplied(+projectId, +user_id);
  }
  
  @Get('candidates')
  async getCandidates(
    @Req() req: Request,
    @Query('page') page: number = 1, // Default to page 1
    @Query('limit') limit: number = 10 // Default to 10 items per page
  ): Promise<any> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.getCandidates(+user_id, +page, +limit);
  }
  

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query('role') title?: string, // Project title
    @Query('startDate') startDate?: string,
    @Query('status') status?: 'published' | 'draft',
    @Query('ref') ref?: number // Project ID
  ): Promise<any> {
    const user_id = req['user_id'];
    const parsedStartDate = startDate ? new Date(startDate) : undefined;

    return this.recruiterProjectService.findAll(user_id, +page, +limit, title, parsedStartDate, status, ref);
  }

  @Get('/all-users')
  findAllUsersProjects(@Req() req: any): Promise<any> {
    const user_id=req['user_id']
    return this.recruiterProjectService.findAllUsersProjects(user_id);
  }

  @Get('project-view/:project_url')
  findOne(
    @Param('project_url') project_url: string,
    @Req() req: Request,
  ): Promise<RecruiterProject> {
    return this.recruiterProjectService.findOneByUrl(project_url);
  }

  @Get(':id')
  findOneProject(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<RecruiterProject> {
    return this.recruiterProjectService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body() accountProjectData,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = 308//req['user_id'];
    let imageType=null;
    if(image){
      const imgType = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }
    
    const {company_id, company_name, company_logo_url, company_website_url, company_domain} = accountProjectData;

    const companyData = {
      company_id,
      company_name,
      company_logo_url,
      company_website_url,
      company_domain
    };
    return this.recruiterProjectService.create(accountProjectData, user_id, image?.buffer, imageType, companyData);
  }

  @Post('save_and_publish')
  @UseInterceptors(FileInterceptor('logo'))
  saveAndPublish(
    @Body() accountProjectData,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    let imageType=null;
    if(image){
      const imgType = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }
    const {company_id, company_name, company_logo_url, company_website_url, company_domain} = accountProjectData;

    const companyData = {
      company_id,
      company_name,
      company_logo_url,
      company_website_url,
      company_domain
    };
    return this.recruiterProjectService.createAndPublish(accountProjectData, user_id,  image?.buffer, imageType, companyData);
  }

  @Post('update_and_publish/:id')
  @UseInterceptors(FileInterceptor('logo'))
  updateAndPublish(
    @Body() accountProjectData,
    @Req() req: Request,
    @UploadedFile() image: Multer.File,
    @Param('id') id: string,
  ): Promise<any> {
    const user_id = req['user_id'];
    let imageType=null;
    if(image){
      const imgType = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }

    const {company_id, company_name, company_logo_url, company_website_url, company_domain} = accountProjectData;

    const companyData = {
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
    @Param('id') projectId: number,
    @Req() req: Request,
  ): Promise<any> {
    const userId = req['user_id'];
    return this.recruiterProjectService.publishProject(projectId, userId);
  }

  @Post('/:id/unpublish')
async unpublishProject(
  @Param('id') projectId: number,
  @Req() req: Request,
): Promise<any> {
  const userId = req['user_id'];
  return this.recruiterProjectService.unpublishProject(projectId, userId);
}

  @Put('/:id')
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param('id') id: string,
    @Body() accountProjectData,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<any> {
    const user_id = req['user_id'];
    let imageType=null;
    if(image){
      const imgType = this.getImageTypeFromMimetype(image?.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
  
      // Validate image type
      if (imgType || allowedImageTypes.includes(imgType)) {
        imageType=imgType;
      }
    }

    const {company_id, company_name, company_logo_url, company_website_url, company_domain} = accountProjectData;

    const companyData = {
      company_id,
      company_name,
      company_logo_url,
      company_website_url,
      company_domain
    };
    return this.recruiterProjectService.update(user_id, +id, accountProjectData, image?.buffer, imageType, companyData);
  }

  @Delete('/:id')
  remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const user_id = req['user_id'];
    return this.recruiterProjectService.remove(+id, user_id);
  }

 

  @Get('project_ranking/:id')
  async getRanking(@Param('id') project_id: number, @Req() req: Request,   @Query('min_experience') min_experience?: string) {
    const user_id = req['user_id'];
    return await this.recruiterProjectService.getRanking(project_id, user_id, min_experience);
  }

  getImageTypeFromMimetype(mimetype: string): string | null {
    // Split the mimetype string by '/'
    const parts = mimetype.split('/');
  
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
