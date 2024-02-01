// auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LinkedinStrategy } from '../strategies/linkedin.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccounts } from './User.entity';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'linkedin' }),
    TypeOrmModule.forFeature([UserAccounts]),
  ],
  providers: [LinkedinStrategy, AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
