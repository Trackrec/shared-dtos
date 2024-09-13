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
    if(!image && !company_name){
      return { error: true, message: 'Company name, logo are required.' };
    }
    const imageType = this.getImageTypeFromMimetype(image?.mimetype);
    // List of allowed image types
    const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

    // Validate image type
    if (!imageType || !allowedImageTypes.includes(imageType)) {
    return { error: true, message: 'Please upload an image in a valid format (svg, png, jpg, jpeg, gif).' };
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
    @Body() body: { company_name?: string },
    @UploadedFile() image: Multer.File,
    @Req() req
  ): Promise<any> {
    const user_id = req["user_id"];
    const { company_name } = body;
  
    // Check if an image is uploaded
    if (image) {
      const imageType = this.getImageTypeFromMimetype(image.mimetype);
      // List of allowed image types
      const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];
      // Validate image type
      if (!imageType || !allowedImageTypes.includes(imageType)) {
        return { error: true, message: 'Please upload an image in a valid format (svg, png, jpg, jpeg, gif).' };
      }
    }
  
    try {
      const company = await this.recruiterCompanyService.updateCompany(
        id,
        user_id,
        company_name,
        image?.buffer,
        image ? this.getImageTypeFromMimetype(image.mimetype) : null
      );
      return { error: false, company };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
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
