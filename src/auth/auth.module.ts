// auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LinkedinStrategy } from '../strategies/linkedin.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccounts } from './User.entity';
import { PositionService } from 'src/positions/positions.service';
import { Position } from 'src/positions/positions.entity';
import { CompanyService } from 'src/company/company.service';
import { Company } from 'src/company/company.entity';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'linkedin' }),
    TypeOrmModule.forFeature([UserAccounts]),
    TypeOrmModule.forFeature([Position]),
    TypeOrmModule.forFeature([Company]),
    TypeOrmModule.forFeature([Position, UserAccounts]),


  ],
  providers: [LinkedinStrategy, AuthService, PositionService, CompanyService],
  controllers: [AuthController]
})
export class AuthModule {}
