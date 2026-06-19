import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.enableCors({ origin: '*' });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  const expressApp = server.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
