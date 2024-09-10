// recruiter-company.controller.ts
import { Controller, Post, Body, BadRequestException, InternalServerErrorException, Req,UseInterceptors, UploadedFile, Put, Param, Get } from '@nestjs/common';
import { RecruiterCompanyService } from './recruiter-company.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@Controller('recruiter/company')
export class RecruiterCompanyController {
  constructor(private readonly recruiterCompanyService: RecruiterCompanyService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async createCompany(
    @Body() body: { company_name: string; },
    @UploadedFile() image: Multer.File,
    @Req() req
  ): Promise<any> {
    const user_id=req.user_id;
    const { company_name } = body;
    console.log(image)
    if(!image){
      return { error: true, message: 'Please upload image first.' };
    }
    const imageType = this.getImageTypeFromMimetype(image?.mimetype);
    if(!imageType){
      return { error: true, message: 'Please upload image in valid format.' };

    }

    if (!company_name ) {
      throw new BadRequestException('Company name, logo are required.');
    }

    try {
      const company = await this.recruiterCompanyService.createCompany(company_name, user_id, image.buffer, imageType);
      return { error: false, company };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('/all-users')
  findAllUsersProjects(@Req() req: any): Promise<any> {
    const user_id=req['user_id']
    return this.recruiterCompanyService.findAllUsersInCompany(user_id);
  }


  @Put(':id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateCompany(
    @Param('id') id: string,
    @Body() body: { company_name?: string; },
    @UploadedFile() image: Multer.File,
    @Req() req
  ): Promise<any> {
    const user_id = req["user_id"];
    const { company_name } = body;

    if (image && !this.getImageTypeFromMimetype(image?.mimetype)) {
      return { error: true, message: 'Please upload image in valid format.' };
    }

    try {
      const company = await this.recruiterCompanyService.updateCompany(id,user_id, company_name,image?.buffer, image ? this.getImageTypeFromMimetype(image?.mimetype) : null);
      return { error: false, company };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  getImageTypeFromMimetype(mimetype) {
    // Split the mimetype string by '/'
    const parts = mimetype.split('/');
  
    // Check if the first part is 'image'
    if (parts[0] === 'image' && parts[1]) {
      return parts[1]; // The second part is the image type
    } else {
      return null; // Not a valid image mimetype
    }
  }
}
