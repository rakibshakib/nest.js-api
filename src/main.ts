import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });
  // const app = await NestFactory.create(AppModule, {
  //   logger: false,
  // });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Learning API')
    .setDescription('Note API description')
    .setVersion('1.0')
    .addTag('services')
    .addBearerAuth()
    .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config);
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(8000);
}

bootstrap().catch((error) => {
  console.error(error);
});
