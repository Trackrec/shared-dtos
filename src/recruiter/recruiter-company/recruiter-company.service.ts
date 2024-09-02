// recruiter-company.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterCompany } from './recruiter-company.entity';
import { RecruiterCompanyUser } from './recruiter-company-user.entity'; // Import RecruiterCompanyUser entity
import { UserAccounts } from 'src/auth/User.entity';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
@Injectable()
export class RecruiterCompanyService {
  constructor(
    @InjectRepository(RecruiterCompany)
    private recruiterCompanyRepository: Repository<RecruiterCompany>,
    @InjectRepository(RecruiterCompanyUser)
    private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>, // Inject RecruiterCompanyUser repository
    @InjectRepository(UserAccounts)
    private userRepository: Repository<UserAccounts>, // Inject User repository
    private readonly uploadService: S3UploadService,

  ) {}

  async createCompany(company_name: string, userId: number, buffer, imageType): Promise<any> {
    // Check if the user already has a company associated with them
    const existingAssociation = await this.recruiterCompanyUserRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company'],
    });
  
    if (existingAssociation) {
      return {
        error: false,
        message: 'Company already added for this user.',
      };
    }
  
    // Upload the new image for the company
    let storedImage = await this.uploadService.uploadNewImage(
      buffer,
      'recruiter_company_images',
      imageType
    );
  
    const company = this.recruiterCompanyRepository.create({ company_name, logo: storedImage });
    const savedCompany = await this.recruiterCompanyRepository.save(company);
  
    const user = await this.userRepository.findOne({ where: { id: userId } });
  
    if (!user || user.role != 'Admin') {
      throw new BadRequestException('Invalid recruiter.');
    }
  
    // Create the association between the user and the new company
    const recruiterCompanyUser = this.recruiterCompanyUserRepository.create({
      user,
      company: savedCompany,
    });
  
    await this.recruiterCompanyUserRepository.save(recruiterCompanyUser);
  
    return {
      error: false,
      message: 'Company successfully added.',
      company: savedCompany,
    };
  }
  
}
