// recruiter-company.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterCompany } from './recruiter-company.entity';
import { RecruiterCompanyUser } from './recruiter-company-user.entity'; // Import RecruiterCompanyUser entity
import { UserAccounts } from 'src/auth/User.entity';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import {
  RecruiterCompanyDto,
  RecruiterCompanyUserDto,
} from 'src/shared-dtos/src/recruiter_company';
import { FormattedUserDto, UserDto, UsersInCompanyResponseDto } from 'src/shared-dtos/src/user.dto';
import {
  CreateRecruiterCompanyDto,
  UpdateRecruiterCompanyDto,
} from 'src/shared-dtos/src/company.dto';
@Injectable()
export class RecruiterCompanyService {
  private readonly logger = new Logger(RecruiterCompanyService.name);

  constructor(
    @InjectRepository(RecruiterCompany)
    private recruiterCompanyRepository: Repository<RecruiterCompany>,
    @InjectRepository(RecruiterCompanyUser)
    private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>, // Inject RecruiterCompanyUser repository
    @InjectRepository(UserAccounts)
    private userRepository: Repository<UserAccounts>, // Inject User repository
    private readonly uploadService: S3UploadService,
  ) {}

  async createCompany(
    companyName: string,
    userId: number,
    buffer: Buffer,
    imageType: string,
  ): Promise<CreateRecruiterCompanyDto> {
    this.logger.log(
      'info',
      `Starting company creation for user ${userId} with company name: ${companyName}`,
    );

    // Check if the user already has a company associated with them
    const existingAssociation: RecruiterCompanyUserDto =
      await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });

    if (existingAssociation) {
      this.logger.log(
        'warn',
        `User ${userId} already has an associated company. Company name: ${companyName}`,
      );
      return {
        error: false,
        message: 'Company already added for this user.',
      };
    }

    // Upload the new image for the company
    const storedImage: string = await this.uploadService.uploadNewImage(
      buffer,
      'recruiter_company_images',
      imageType,
    );
    this.logger.log(
      'info',
      `Image for company ${companyName} uploaded successfully. Image type: ${imageType}`,
    );

    const company: RecruiterCompanyDto = this.recruiterCompanyRepository.create({
      company_name: companyName,
      logo: storedImage,
      logo_type: imageType,
      created_by: { id: userId },
    });

    const savedCompany: RecruiterCompanyDto = await this.recruiterCompanyRepository.save(company);
    this.logger.log(
      'info',
      `Company ${companyName} created and saved successfully for user ${userId}`,
    );

    const user: UserDto = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || user.role !== 'Admin') {
      this.logger.log(
        'error',
        `Invalid recruiter: User ${userId} is not an admin or does not exist.`,
      );
      throw new BadRequestException('Invalid recruiter.');
    }

    // Create the association between the user and the new company
    const recruiterCompanyUser: RecruiterCompanyUserDto =
      this.recruiterCompanyUserRepository.create({
        user,
        company: savedCompany,
      });

    await this.recruiterCompanyUserRepository.save(recruiterCompanyUser);
    this.logger.log('info', `User ${userId} successfully associated with company ${companyName}`);

    return {
      error: false,
      message: 'Company successfully added.',
      company: savedCompany,
    };
  }

  async updateCompany(
    companyId: number,
    userId: number,
    companyName?: string,
    buffer?: Buffer,
    imageType?: string,
  ): Promise<UpdateRecruiterCompanyDto> {
    this.logger.log(`Starting update for company ID ${companyId} by user ${userId}`);

    // Find the company by ID
    const company: RecruiterCompanyDto = await this.recruiterCompanyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      this.logger.log('warn', `Company ID ${companyId} not found.`);
      return { error: true, message: 'Company not found.' };
    }

    // Check if the user has the right to update the company
    const existingAssociation: RecruiterCompanyUserDto =
      await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId }, company: { id: companyId } },
      });

    if (!existingAssociation) {
      this.logger.log('warn', `User ${userId} does not have access to company ${companyId}`);
      return { error: true, message: 'User does not have access to this company.' };
    }

    // Update company name if provided
    if (companyName) {
      this.logger.log(
        'info',
        `Updating company name for company ID ${companyId} to ${companyName}`,
      );
      company.company_name = companyName;
    }

    if (buffer && imageType) {
      this.logger.log('info', `Deleting old logo for company ID ${companyId}`);
      await this.uploadService.deleteImage(company.logo, 'recruiter_company_images');

      // Upload the new image
      this.logger.log(
        'info',
        `Uploading new image for company ID ${companyId} with image type ${imageType}`,
      );
      const storedImage: string = await this.uploadService.uploadNewImage(
        buffer,
        'recruiter_company_images',
        imageType,
      );

      company.logo = storedImage;
      company.logo_type = imageType;
    }

    // Save the updated company
    const updatedCompany: RecruiterCompanyDto = await this.recruiterCompanyRepository.save(company);
    this.logger.log('info', `Company ID ${companyId} successfully updated by user ${userId}`);

    return {
      error: false,
      message: 'Company successfully updated.',
      company: updatedCompany,
    };
  }

  async findAllUsersInCompany(userId: number): Promise<UsersInCompanyResponseDto> {
    try {
      this.logger.log(`Fetching users for company associated with user ID ${userId}`);

      // Fetch the company associated with the given userId
      const recruiterCompanyUser: RecruiterCompanyUserDto =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser || !recruiterCompanyUser.company) {
        this.logger.warn(`No company found for user ID ${userId}`);
        return { error: true, message: 'Company not found for the given user' };
      }

      const companyId: number = recruiterCompanyUser.company.id;
      this.logger.log(
        `Company ID ${companyId} found for user ID ${userId}. Fetching users associated with the company.`,
      );

      const users: RecruiterCompanyUserDto[] = await this.recruiterCompanyUserRepository
        .createQueryBuilder('recruiterCompanyUser')
        .innerJoinAndSelect('recruiterCompanyUser.user', 'user')
        .where('recruiterCompanyUser.company.id = :companyId', { companyId })
        .andWhere('user.is_deleted = :isDeleted', { isDeleted: false })
        .select([
          'recruiterCompanyUser.id',
          'user.id',
          'user.full_name',
          'user.email',
          'user.role',
          'user.login_method',
        ])
        .getMany();

      this.logger.log(`Fetched ${users.length} active users for company ID ${companyId}`);

      const formattedUsers: FormattedUserDto[] = users.map(({ id, user }) => ({
        id,
        ...user,
      }));

      return { error: false, users: formattedUsers };
    } catch (e) {
      this.logger.error(`Error fetching users for company: ${e.message}`);
      return { error: true, message: 'Something went wrong, try again.' };
    }
  }
}
