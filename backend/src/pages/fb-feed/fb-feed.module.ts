import { Module } from '@nestjs/common';
import { FbFeedController } from './fb-feed.controller';
import { FbFeedService } from './fb-feed.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [FbFeedController],
  providers: [FbFeedService],
})
export class FbFeedModule {}
