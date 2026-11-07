import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { CustomerInsightsService } from './customer-insights.service';

@Controller('customer-insights')
export class CustomerInsightsController {
  constructor(private readonly customerInsightsService: CustomerInsightsService) {}

  /**
   * GET /api/customer-insights/report
   * Repeat customers, multi-item packages and recommended 3–4 book bundles.
   * Amolbooks hides this view from salesmen; here the API enforces it too.
   */
  @Get('/report')
  @AdminMetaRoles(
    AdminRoles.SUPER_ADMIN,
    AdminRoles.ADMIN,
    AdminRoles.EDITOR,
    AdminRoles.ACCOUNTANT,
    AdminRoles.Collector,
  )
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getReport(): Promise<ResponsePayload> {
    return this.customerInsightsService.getReport();
  }
}
