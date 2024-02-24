import { Module , MiddlewareConsumer, NestModule,
  RequestMethod,} from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { loggerConfig } from "./config/logger.config";
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from "./config/database.config";
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
import { AdminAuthController } from './admin/auth/auth.controller';
import { AdminAuthService } from './admin/auth/auth.service';
import { AccountProjectController } from './admin/projects/project.controller';
import { AccountProjectService } from './admin/projects/project.service';
import { AccountProject } from './admin/projects/project.entity';
import { SharedService } from './shared/shared.service';
import { MailgunService } from './mailgun/mailgun.service';
import { ProjectApplication } from './applications/application.entity';
import { ProjectApplicationController } from './applications/application.controller';
import { ApplicationService } from './applications/application.service';
import { PointsService } from './admin/projects/points.service';
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    loggerConfig,
    AuthModule,
    PassportModule,
    //todo: remove unused code
    TypeOrmModule.forFeature([UserAccounts]),
    TypeOrmModule.forFeature([Position]),

    TypeOrmModule.forFeature([Position, UserAccounts]),
    TypeOrmModule.forFeature([PositionDetails]),
    TypeOrmModule.forFeature([Company]),
    TypeOrmModule.forFeature([City]),
    TypeOrmModule.forFeature([Position, Company]),
    TypeOrmModule.forFeature([Keywords]),
    TypeOrmModule.forFeature([AccountsVisitors]),
    TypeOrmModule.forFeature([AnalyticsAccess]),
    TypeOrmModule.forFeature([AccountProject]),
    TypeOrmModule.forFeature([ProjectApplication])


  ],
  controllers: [AuthController, AppController, PositionController, PositionDetailsController, CompanyController, CityController, PublishProfileController, KeywordsController, SuperAdminController, AdminAuthController, AccountProjectController, ProjectApplicationController],
  providers: [AuthService,AppService,CompanyService, PositionService,PositionDetailsService, CityService, S3UploadService, PublishProfileService, KeywordsService, SuperAdminService, AdminAuthService, AccountProjectService, SharedService, MailgunService, ApplicationService, PointsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenMiddleware)
      .forRoutes(
        "me", "positions","profile", "update_profile_picture", "companies", "position_details", "positions", "p", "my/profile_views", "keywords", "get_all_users", "get_user_details", "get_user_companies", "update_block_user_status", "account-projects", "impersonate_user", "create-user", "remove-user", "get-my-details", "get_users", "update_project_picture", "applications", "project_ranking"
      );
  }
}