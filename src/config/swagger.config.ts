import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Trackrec APIs')
  .setDescription('Trackrec APIs description')
  .setVersion('1.0')
  .addTag('Trackrec')
  .build();
