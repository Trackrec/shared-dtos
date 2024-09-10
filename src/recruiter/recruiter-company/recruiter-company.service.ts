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

  async updateCompany(
    companyId: any,
    userId: any,
    company_name?: string,
    buffer?: Buffer,
    imageType?: string
  ): Promise<any> {
    // Find the company by ID
    const company = await this.recruiterCompanyRepository.findOne({ where: { id: companyId } });
  
    if (!company) {
      return {error: true, message: "Company not found."}
    }
  
    // Check if the user has the right to update the company
    const existingAssociation = await this.recruiterCompanyUserRepository.findOne({
      where: { user: { id: userId }, company: { id: companyId } },
    });
  
    if (!existingAssociation) {
      return {error: true, message :"User does not have access to this company."}
    }
  
    // Update company name if provided
    if (company_name) {
      company.company_name = company_name;
    }
  
    if (buffer && imageType) {
      await this.uploadService.deleteImage(company.logo,'recruiter_company_images' )   
  
      // Upload the new image
      let storedImage = await this.uploadService.uploadNewImage(
        buffer,
        'recruiter_company_images',
        imageType
      );
  
      company.logo = storedImage;
    }
  
    // Save the updated company
    const updatedCompany = await this.recruiterCompanyRepository.save(company);
  
    return {
      error: false,
      message: 'Company successfully updated.',
      company: updatedCompany,
    };
  }

  async findAllUsersInCompany(userId: number): Promise<any> {
    try{
    // Fetch the company associated with the given userId
    const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company'], 
    });
  
    if (!recruiterCompanyUser || !recruiterCompanyUser.company) {
      return {error: true, message: "Company not found for the given user"}
    }
  
    const companyId = recruiterCompanyUser.company.id;
    const users = await this.recruiterCompanyUserRepository.createQueryBuilder('recruiterCompanyUser')
    .innerJoinAndSelect('recruiterCompanyUser.user', 'user')
    .where('recruiterCompanyUser.company.id = :companyId', { companyId })
    .select([
      'recruiterCompanyUser.id',   
      'user.id',                  
      'user.full_name',
      'user.email',
      'user.role',
      'user.login_method',
    ])
    .getMany();
    return {error: false, users}
  }
  catch(e){
    return {error: true, message: "Something went wrong, try again."}
  }
  }
  
  
  
}
