import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import * as compression from 'compression';
import { SpaFilter } from './spa.filter';
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: true });
  // Allow Cors
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3006',
      'http://localhost:4000',
      'http://localhost:4200',
      'http://localhost:42002',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3007',
      'http://localhost:3005',
      'http://localhost:3004',
      'http://localhost:3003',
      'http://localhost:3008',
      'http://localhost:3009',
      'https://www.alambook.com',
      'https://alambook.com',
      'https://admin.alambook.com',
      'https://www.shobaz.com',
      'https://shobaz.com',
      'https://admin.shobaz.com',
      'https://api.shobaz.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,administrator',
    credentials: true,
  });
  // Gzip compression for all responses
  app.use(compression());

  app.use(
    '/upload/static',
    express.static(join(__dirname, '..', 'upload/static')),
  );
  // app.enableCors();
  // Version Control
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // Global Prefix
  // Limit payload size
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Serve Angular admin SPA — must be registered BEFORE setGlobalPrefix/NestJS router
  // so these middleware run first and non-API paths never reach NestJS's 404 handler.
  const adminDist = join(__dirname, '..', '..', 'admin', 'dist', 'angular-ui');
  app.use(express.static(adminDist));
  app.use((req: any, res: any, next: any) => {
    const p: string = req.path;
    if (p.startsWith('/api') || p.startsWith('/upload') || p.startsWith('/invoice') || /\.\w+$/.test(p)) {
      return next();
    }
    res.sendFile(join(adminDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new SpaFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
