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

   app.enableCors( {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
     })
  //Pine Logger
  app.useLogger(app.get(Logger));
  
  //todo: move this to .env
  await app.listen(4000);
}
bootstrap();
