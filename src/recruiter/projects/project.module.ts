import { Module } from '@nestjs/common';
import { RecruiterProjectController } from './project.controller';
import { RecruiterProjectService } from './project.service';
import { RecruiterProject } from './project.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { ProjectApplication } from 'src/applications/application.entity';
import { ProjectVisitors } from 'src/project_visits/project_visits.entity';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
import { SharedService } from 'src/shared/shared.service';
import { RecruiterPointsService } from './points.service';
import { RecruiterCompanyUser } from '../recruiter-company/recruiter-company-user.entity';
import { Company } from 'src/company/company.entity';
import { CompanyService } from 'src/company/company.service';


@Module({
  imports: [TypeOrmModule.forFeature([RecruiterProject, UserAccounts, ProjectApplication, ProjectVisitors, RecruiterCompanyUser, Company])],
  controllers: [RecruiterProjectController],
  providers: [RecruiterProjectService, S3UploadService, SharedService, RecruiterPointsService, CompanyService],
  exports: [RecruiterProjectService],
})
export class RecruiterProjectModule {}
