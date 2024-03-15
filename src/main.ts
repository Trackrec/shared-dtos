import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from "nestjs-pino";
import { swaggerConfig } from "./config/swagger.config";
import { SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: ['error', 'warn'] });
  
  app.enableCors()

   //swagger
   const document = SwaggerModule.createDocument(app, swaggerConfig);
   SwaggerModule.setup("api", app, document);

  //Pine Logger
  app.useLogger(app.get(Logger));
  
  //todo: move this to .env
  await app.listen(process.env.PORT);
}
bootstrap();
