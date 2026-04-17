import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import * as compression from 'compression';
import * as jwt from 'jsonwebtoken';
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

  // Protect custom-orders.html — requires a valid admin JWT as ?token= query param
  app.use('/upload/static/custom-orders.html', (req: any, res: any, next: any) => {
    const token = req.query?.token;
    if (!token) {
      return res.status(403).send('<h2>403 Forbidden</h2><p>Access this page from the admin dashboard.</p>');
    }
    try {
      jwt.verify(token, process.env.JWT_PRIVATE_KEY_ADMIN);
      next();
    } catch {
      return res.status(403).send('<h2>403 Forbidden</h2><p>Invalid or expired token. Please log in to the admin dashboard again.</p>');
    }
  });

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

  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
