import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { GetAdmin } from '../../decorator/get-admin.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { Admin } from '../../interfaces/admin/admin.interface';
import { CustomerManagerService } from './customer-manager.service';

// Sales staff and managers (same roles as Amolbooks' Customer Manager).
const CRM_ROLES = [AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.SALESMAN];

@Controller('customer-manager')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class CustomerManagerController {
  constructor(private readonly service: CustomerManagerService) {}

  /** Delivered customers with filters, tabs, summary and pagination (export=1 for managers). */
  @Version(VERSION_NEUTRAL)
  @Get()
  @AdminMetaRoles(...CRM_ROLES)
  list(@Query() query: any, @GetAdmin() admin: Admin) {
    return this.service.list(query, admin);
  }

  /** Book names bought by delivered customers (filter suggestions). */
  @Version(VERSION_NEUTRAL)
  @Get('purchased-books/search')
  @AdminMetaRoles(...CRM_ROLES)
  purchasedBooks(@Query('q') query: string) {
    return this.service.searchPurchasedBooks(query);
  }

  /** Catalog search for the repeat-order form. */
  @Version(VERSION_NEUTRAL)
  @Get('products/search')
  @AdminMetaRoles(...CRM_ROLES)
  products(@Query('q') query: string) {
    return this.service.searchProducts(query);
  }

  @Version(VERSION_NEUTRAL)
  @Post(':phone/orders')
  @AdminMetaRoles(...CRM_ROLES)
  order(
    @Param('phone') phone: string,
    @Body() body: any,
    @GetAdmin() admin: Admin,
  ) {
    return this.service.createOrder(phone, body, admin);
  }

  @Version(VERSION_NEUTRAL)
  @Get(':phone')
  @AdminMetaRoles(...CRM_ROLES)
  detail(@Param('phone') phone: string) {
    return this.service.detail(phone);
  }

  @Version(VERSION_NEUTRAL)
  @Post(':phone/contacts')
  @AdminMetaRoles(...CRM_ROLES)
  save(
    @Param('phone') phone: string,
    @Body() body: any,
    @GetAdmin() admin: Admin,
  ) {
    return this.service.save(phone, body, admin);
  }
}
