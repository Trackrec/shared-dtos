import { ProjectVisitors } from './project_visits/project_visits.entity';
import {
  Module,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { loggerConfig } from './config/logger.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { SessionModule } from 'nestjs-session';
import { TokenMiddleware } from './middlewares/token.middleware';
import { PositionController } from './positions/positions.controller';
import { PositionDetailsController } from './position_details/position-details.controller';
import { PositionService } from './positions/positions.service';
import { PositionDetailsService } from './position_details/position-details.service';
import { Position } from './positions/positions.entity';
import { PositionDetails } from './position_details/position_details.entity';
import { Company } from './company/company.entity';
import { CompanyService } from './company/company.service';
import { CompanyController } from './company/company.controller';
import { UserAccounts } from './auth/User.entity';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CityController } from './location/city.controller';
import { CityService } from './location/city.service';
import { City } from './location/city.entity';
import { S3UploadService } from './storage_bucket/storage_bucket.service';
import { PublishProfileController } from './publish_profile/publish_profile.controller';
import { PublishProfileService } from './publish_profile/publish-profile.service';
import { KeywordsController } from './keywords/keyword.controller';
import { KeywordsService } from './keywords/keyword.service';
import { Keywords } from './keywords/keyword.entity';
import { AccountsVisitors } from './visitors/accounts_visitor.entity';
import { AnalyticsAccess } from './visitors/analytics_access.entity';
import { SuperAdminController } from './super-admin/super-admin.controller';
import { SuperAdminService } from './super-admin/super-admin.service';
import { VerifyPositionController } from './verify-position/verify-position.controller';
import { VerifyPositionService } from './verify-position/verify-position.service';
import { SharedService } from './shared/shared.service';
import { MailgunService } from './mailgun/mailgun.service';
import { ProjectApplication } from './applications/application.entity';
import { ProjectApplicationController } from './applications/application.controller';
import { ApplicationService } from './applications/application.service';
import { ProjectVisitorsController } from './project_visits/project_visits.controller';
import { ProjectVisitorsService } from './project_visits/project_visits.service';
import { VerifyPosition } from './verify-position/verify-position.entity';
import { State } from './location/state.entity';
import { Country } from './location/country.entity';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RecruiterAuthController } from './recruiter/recruiter-auth/recruiter-auth.controller';
import { RecruiterAuthService } from './recruiter/recruiter-auth/recruiter-auth.service';
import { RecruiterLinkedinStrategy } from './strategies/recruiter-linkedin.strategy';
import { RecruiterGoogleStrategy } from './strategies/recruiter-google.strategy';
import { RecruiterCompanyController } from './recruiter/recruiter-company/recruiter-company.controller';
import { RecruiterCompanyService } from './recruiter/recruiter-company/recruiter-company.service';
import { RecruiterCompany } from './recruiter/recruiter-company/recruiter-company.entity';
import { RecruiterCompanyUser } from './recruiter/recruiter-company/recruiter-company-user.entity';
import { RecruiterProjectModule } from './recruiter/projects/project.module';
import { RecruiterProject } from './recruiter/projects/project.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.intercepter';
import { AppLoggerService } from './logger.service';
import winston from 'winston';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    TypeOrmModule.forRoot(databaseConfig),
    ScheduleModule.forRoot(),
    AuthModule,
    PassportModule,
    RecruiterProjectModule,
    //todo: remove unused code
    TypeOrmModule.forFeature([UserAccounts]),
    TypeOrmModule.forFeature([Position]),

    TypeOrmModule.forFeature([Position, UserAccounts]),
    TypeOrmModule.forFeature([PositionDetails]),
    TypeOrmModule.forFeature([Company]),
    TypeOrmModule.forFeature([City, State, Country]),
    TypeOrmModule.forFeature([State]),
    TypeOrmModule.forFeature([Country]),
    TypeOrmModule.forFeature([Position, Company]),
    TypeOrmModule.forFeature([Keywords]),
    TypeOrmModule.forFeature([AccountsVisitors]),
    TypeOrmModule.forFeature([AnalyticsAccess]),
    TypeOrmModule.forFeature([ProjectApplication]),
    TypeOrmModule.forFeature([ProjectVisitors]),
    TypeOrmModule.forFeature([VerifyPosition]),
    TypeOrmModule.forFeature([RecruiterProject]),

    TypeOrmModule.forFeature([RecruiterCompany, RecruiterCompanyUser]),

  ],
  controllers: [
    AuthController,
    RecruiterAuthController,
    AppController,
    PositionController,
    PositionDetailsController,
    CompanyController,
    CityController,
    PublishProfileController,
    KeywordsController,
    SuperAdminController,
    ProjectApplicationController,
    ProjectVisitorsController,
    VerifyPositionController,
    RecruiterCompanyController
  ],
  providers: [
    {
      provide: 'WINSTON_LOGGER',    
      useValue: loggerConfig,        
    },
    {
      provide: AppLoggerService,
      useFactory: (logger: winston.Logger) => new AppLoggerService(logger),
      inject: ['WINSTON_LOGGER'],
    },
    AuthService,
    RecruiterAuthService,
    RecruiterLinkedinStrategy,
    RecruiterGoogleStrategy,
    AppService,
    CompanyService,
    PositionService,
    PositionDetailsService,
    CityService,
    S3UploadService,
    PublishProfileService,
    KeywordsService,
    SuperAdminService,
    SharedService,
    MailgunService,
    ApplicationService,
    ProjectVisitorsService,
    VerifyPositionService,
    CronService,
    RecruiterCompanyService,
    
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenMiddleware)
      .exclude(
        'recruiter/projects/project-view/(.*)' 
      )
      .forRoutes(
        'me',
        'positions',
        'profile',
        'update_profile_picture',
        'companies',
        'position_details',
        'positions',
        'p',
        'my/profile_views',
        'keywords',
        'get_all_users',
        'get_user_details',
        'get_user_companies',
        'update_block_user_status',
        'account-projects',
        'impersonate_user',
        'create-user',
        'remove-user',
        'get-my-details',
        'get_users',
        'update_project_picture',
        'applications',
        'project_ranking',
        'verify',
        'preference',
        'recruiter/company',
        'recruiter/me',
        'recruiter/projects',
        'recruiter/invite-user',
        'recruiter/update-user',
        'project_visitor',
        'recruiter/change-password',
        'recruiter/delete-user'

      );
  }
}
