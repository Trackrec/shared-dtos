import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';
import { SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './sentry.filter';
import session from 'express-session';
import { ResponseInterceptor } from './interceptors/response.intercepter';
import { LoggingInterceptor } from './interceptors/logging.intercepter';
import { loggerConfig } from './config/logger.config';
import { configurations } from './config/env.config';
import { AppLoggerService } from './logger.service';

const { sentryDns, port, jwtSecret } =configurations;
const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors();

  Sentry.init({
    dsn: sentryDns,
  });

  // Import the filter globally, capturing all exceptions on all routes
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new SentryFilter(httpAdapter));

  //swagger
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const appLogger = new AppLoggerService(loggerConfig);
  app.useLogger(appLogger);

  app.useGlobalInterceptors(new LoggingInterceptor(appLogger));
  app.use(
    session({
      secret: jwtSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );
  await app.listen(port);
};
bootstrap();
