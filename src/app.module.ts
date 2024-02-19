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





  ],
  controllers: [AuthController, AppController, PositionController, PositionDetailsController, CompanyController, CityController],
  providers: [AuthService,AppService,CompanyService, PositionService,PositionDetailsService, CityService, S3UploadService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenMiddleware)
      .forRoutes(
        //todo: rename to "GetUserDetails/Me"
        "me", "positions","profile", "update_profile_picture", "companies", "position_details", "positions"
      );
  }
}