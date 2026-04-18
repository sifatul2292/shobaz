import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Catch(NotFoundException)
export class SpaFilter implements ExceptionFilter {
  private readonly adminIndex: string | null;

  constructor() {
    const indexPath = join(
      __dirname,
      '..',
      '..',
      'admin',
      'dist',
      'angular-ui',
      'index.html',
    );
    this.adminIndex = existsSync(indexPath)
      ? readFileSync(indexPath, 'utf-8')
      : null;
  }

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const path = req.path;

    if (
      this.adminIndex &&
      !path.startsWith('/api') &&
      !path.startsWith('/upload') &&
      !path.startsWith('/invoice') &&
      !/\.\w+$/.test(path)
    ) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(this.adminIndex);
      return;
    }

    const status = exception.getStatus();
    res.status(status).json(exception.getResponse());
  }
}
