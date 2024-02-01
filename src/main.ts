import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "nestjs-pino";
import { swaggerConfig } from "./config/swagger.config";
import { SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: ['error', 'warn'] });
  
   //swagger
   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup("api", app, document);

  //Pine Logger
  app.useLogger(app.get(Logger));
  
  await app.listen(4000);
}
bootstrap();
