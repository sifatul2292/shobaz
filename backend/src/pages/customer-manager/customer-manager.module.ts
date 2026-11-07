import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminSchema } from '../../schema/admin.schema';
import { OrderSchema } from '../../schema/order.schema';
import { ProductSchema } from '../../schema/product.schema';
import { OrderModule } from '../sales/order/order.module';
import { CustomerManagerController } from './customer-manager.controller';
import { CustomerContactSchema } from './customer-manager.schema';
import { CustomerManagerService } from './customer-manager.service';

@Module({
  imports: [
    OrderModule,
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Admin', schema: AdminSchema },
      { name: 'CustomerContact', schema: CustomerContactSchema },
    ]),
  ],
  controllers: [CustomerManagerController],
  providers: [CustomerManagerService],
})
export class CustomerManagerModule {}
