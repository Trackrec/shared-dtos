import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "nestjs-pino";
import { swaggerConfig } from "./config/swagger.config";
import { SwaggerModule } from "@nestjs/swagger";
import * as Sentry from '@sentry/node';
import { SentryFilter } from './sentry.filter';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: ['error', 'warn'] });
  
  app.enableCors()

  Sentry.init({
    dsn: process.env.SENTRY_DNS,
  });


  // Import the filter globally, capturing all exceptions on all routes
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));

   //swagger
   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup("api", app, document);

  //Pine Logger
  app.useLogger(app.get(Logger));
  app.use(
    session({
      secret: process.env.JWT_SECRET,  
      resave: false,
      saveUninitialized: false,
    }),
  );
  //todo: move this to .env
  await app.listen(process.env.PORT);
}
bootstrap();
