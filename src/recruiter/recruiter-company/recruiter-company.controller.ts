// recruiter-company.controller.ts
import {
  Controller,
  Post,
  Body,
  InternalServerErrorException,
  Req,
  UseInterceptors,
  UploadedFile,
  Put,
  Param,
  Get,
  Logger,
} from '@nestjs/common';
import { RecruiterCompanyService } from './recruiter-company.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import {
  CreateRecruiterCompanyDto,
  CreateRecruiterCompanyResponseDto,
  UpdateRecruiterCompanyDto,
  UpdateRecruiterCompanyResponseDto,
} from 'src/shared-dtos/src/company.dto';
import { UsersInCompanyResponseDto } from 'src/shared-dtos/src/user.dto';
import {
  CreateRecruiterCompanyRequestDto,
  RecruiterCompanyParamDto,
  UpdateRecruiterCompanyRequestDto,
} from 'src/shared-dtos/src/recruiter_company';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
import {
  recruiterCompanyParamSchema,
  recruiterCompanyRequestSchema,
  updateRecruiterCompanyRequestSchema,
} from 'src/validations/recruiter_company.validation';

@Controller('recruiter/company')
export class RecruiterCompanyController {
  private readonly logger = new Logger(RecruiterCompanyController.name);

  constructor(private readonly recruiterCompanyService: RecruiterCompanyService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async createCompany(
    @Body(new ZodValidationPipe(recruiterCompanyRequestSchema))
    body: CreateRecruiterCompanyRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<CreateRecruiterCompanyResponseDto> {
    const userId = req['user_id'];
    const { company_name: companyName } = body;

    if (!image && !companyName) {
      this.logger.warn(`Company name or logo is missing in request from user ${userId}.`);
      return { error: true, message: 'Company name, logo are required.' };
    }

    const imageType = this.getImageTypeFromMimetype(image?.mimetype);
    const allowedImageTypes = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

    if (!imageType || !allowedImageTypes.includes(imageType)) {
      this.logger.log(
        'warn',
        `Invalid image format uploaded by user ${userId}. Received: ${imageType}`,
      );
      return {
        error: true,
        message: 'Please upload an image in a valid format (svg, png, jpg, jpeg, gif).',
      };
    }

    try {
      this.logger.log(
        'info',
        `Creating company for user ${userId} with company name: ${companyName}`,
      );
      const company: CreateRecruiterCompanyDto = await this.recruiterCompanyService.createCompany(
        companyName,
        userId,
        image.buffer,
        imageType,
      );
      return { error: false, company };
    } catch (error) {
      this.logger.log('error', `Error creating company for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('/all-users')
  findAllUsersProjects(@Req() req: Request): Promise<UsersInCompanyResponseDto> {
    const userId: number = req['user_id'];
    this.logger.log('info', `Fetching all users' projects for user ${userId}`);
    return this.recruiterCompanyService.findAllUsersInCompany(userId);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateCompany(
    @Param(new ZodValidationPipe(recruiterCompanyParamSchema)) param: RecruiterCompanyParamDto,
    @Body(new ZodValidationPipe(updateRecruiterCompanyRequestSchema))
    body: UpdateRecruiterCompanyRequestDto,
    @UploadedFile() image: Multer.File,
    @Req() req: Request,
  ): Promise<UpdateRecruiterCompanyResponseDto> {
    const userId: number = req['user_id'];
    const { company_name: companyName } = body;
    const { id } = param;

    if (image) {
      const imageType: string = this.getImageTypeFromMimetype(image.mimetype);
      const allowedImageTypes: string[] = ['svg', 'png', 'jpg', 'jpeg', 'gif'];

      if (!imageType || !allowedImageTypes.includes(imageType)) {
        this.logger.log(
          'warn',
          `Invalid image format uploaded by user ${userId} for company ${id}. Received: ${imageType}`,
        );
        return {
          error: true,
          message: 'Please upload an image in a valid format (svg, png, jpg, jpeg, gif).',
        };
      }
    }

    try {
      this.logger.log(
        'info',
        `Updating company with ID ${id} for user ${userId}. New name: ${companyName}`,
      );
      const company: UpdateRecruiterCompanyDto = await this.recruiterCompanyService.updateCompany(
        id,
        userId,
        companyName,
        image?.buffer,
        image ? this.getImageTypeFromMimetype(image.mimetype) : null,
      );
      return { error: false, company };
    } catch (error) {
      this.logger.log(
        'error',
        `Error updating company with ID ${id} for user ${userId}: ${error.message}`,
      );
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
