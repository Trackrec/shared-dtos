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

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    loggerConfig,
    AuthModule,
    PassportModule,
    SessionModule.forRoot({
      session: {
        secret: 'your-secret-key',
      },
    }),
   

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TokenMiddleware)
      .forRoutes(
        "getMe", "positions"
      );
  }
}