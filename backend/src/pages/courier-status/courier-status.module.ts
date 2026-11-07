import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema } from '../../schema/order.schema';
import { SettingSchema } from '../customization/setting/schema/setting.schema';
import { CourierStatusController } from './courier-status.controller';
import { CourierStatusService } from './courier-status.service';

/**
 * Steadfast courier-status tracking (webhook, live In Review sync, historical
 * backfill, missing delivery-charge lookup). Self-contained: talks to the
 * Steadfast API directly and writes only `courierStatus` /
 * `courierStatusHistory` on orders.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Setting', schema: SettingSchema },
    ]),
  ],
  controllers: [CourierStatusController],
  providers: [CourierStatusService],
  exports: [CourierStatusService],
})
export class CourierStatusModule {}
