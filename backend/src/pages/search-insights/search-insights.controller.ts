import {
  Controller,
  Get,
  Query,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { SearchInsightsService } from './search-insights.service';

@Controller('search-insights')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class SearchInsightsController {
  constructor(private readonly service: SearchInsightsService) {}

  /** Searches grouped by term: ?days=7|30|90|365 or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (Dhaka days). */
  @Version(VERSION_NEUTRAL)
  @Get('report')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR, AdminRoles.ACCOUNTANT)
  report(@Query() query: any) {
    return this.service.report(query);
  }
}
