import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { FbFeedService } from './fb-feed.service';

@Controller()
export class FbFeedController {
  constructor(private readonly fbFeedService: FbFeedService) {}

  @Get('fb-feed.xml')
  async getFbFeed(@Res() res: Response) {
    const xml = await this.fbFeedService.generateFeedXml();
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  }
}
