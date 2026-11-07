import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { CourierStatusService } from './courier-status.service';
import {
  SteadfastBackfillBody,
  SteadfastWebhookPayload,
} from './courier-status.interface';

/**
 * Steadfast courier-status routes. Shares the `order` prefix with
 * OrderController (sales/order) so the URLs match Amolbooks:
 *   POST /api/order/courier-webhook/steadfast   (public, bearer token)
 *   POST /api/order/sync-steadfast-in-review    (super_admin, admin)
 *   POST /api/order/backfill-steadfast-status   (super_admin, admin)
 * None of these paths exist on OrderController.
 */
@Controller('order')
export class CourierStatusController {
  constructor(private readonly courierStatusService: CourierStatusService) {}

  /**
   * Called by Steadfast. Authenticated with `Authorization: Bearer <token>`
   * matched against STEADFAST_WEBHOOK_TOKEN (503 when the token is unset).
   */
  @Version(VERSION_NEUTRAL)
  @Post('/courier-webhook/steadfast')
  @HttpCode(200)
  async receiveSteadfastWebhook(
    @Headers('authorization') authorization: string,
    @Body() body: SteadfastWebhookPayload,
  ): Promise<{ status: string; message: string }> {
    await this.courierStatusService.receiveSteadfastWebhook(
      authorization,
      body,
    );
    return {
      status: 'success',
      message: 'Webhook received successfully.',
    };
  }

  @Version(VERSION_NEUTRAL)
  @Post('/backfill-steadfast-status')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async backfillSteadfastStatus(
    @Body() body: SteadfastBackfillBody,
  ): Promise<ResponsePayload> {
    return await this.courierStatusService.backfillSteadfastStatus(body);
  }

  @Version(VERSION_NEUTRAL)
  @Post('/sync-steadfast-in-review')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async syncSteadfastInReview(): Promise<ResponsePayload> {
    return await this.courierStatusService.syncSteadfastInReview();
  }
}
