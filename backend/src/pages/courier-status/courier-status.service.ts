import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import * as crypto from 'crypto';
import { Order } from '../../interfaces/common/order.interface';
import { Setting } from '../customization/setting/interface/setting.interface';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import {
  SteadfastBackfillBody,
  SteadfastCredentials,
  SteadfastWebhookPayload,
} from './courier-status.interface';

const STEADFAST_PROVIDER = 'Steadfast Courier';
// Same base URL / headers as shared/courier/courier.service.ts uses for Steadfast.
const STEADFAST_API_URL = 'https://portal.packzy.com/api/v1';
const STEADFAST_TIMEOUT_MS = 10000;
const MISSING_CHARGE_MESSAGE =
  'Steadfast status response did not include delivery charge.';

/**
 * Steadfast courier-status tracking, ported from Amolbooks' order service:
 * - authenticated webhook for delivery/tracking updates,
 * - live sync of the non-terminal ("In Review") queue,
 * - historical backfill of orders that never received a status,
 * - background lookup of missing delivery charges.
 *
 * Only `courierStatus` / `courierStatusHistory` are written. `orderStatus` is
 * never changed here (Amolbooks' hooks do not change it either).
 *
 * Locks are per-process, exactly as in Amolbooks.
 */
@Injectable()
export class CourierStatusService {
  private logger = new Logger(CourierStatusService.name);
  private steadfastBackfillRunning = false;
  private steadfastInReviewSyncRunning = false;
  private steadfastInReviewSyncCompletedAt = 0;
  private steadfastInReviewSyncResult: ResponsePayload | null = null;
  private steadfastMissingChargeSyncRunning = false;
  private steadfastMissingChargeSyncCompletedAt = 0;

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * HELPERS
   * getSteadfastDeliveryCharge()
   * getWebhookToken()
   * getSteadfastCredentials()
   * getSteadfastStatus()
   * lookupErrorMessage()
   */

  private getSteadfastDeliveryCharge(payload: any): number | undefined {
    const candidates = [
      payload?.delivery_charge,
      payload?.delivery_fee,
      payload?.consignment?.delivery_charge,
      payload?.consignment?.delivery_fee,
      payload?.data?.delivery_charge,
      payload?.data?.delivery_fee,
    ];
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined || candidate === '') {
        continue;
      }
      const charge = Number(candidate);
      if (Number.isFinite(charge) && charge >= 0) return charge;
    }
    return undefined;
  }

  /**
   * STEADFAST_WEBHOOK_TOKEN from the environment. A `steadfastWebhookToken`
   * key in configuration.ts (Amolbooks' name) is honoured too if one is added.
   */
  private getWebhookToken(): string | undefined {
    return (
      this.configService.get<string>('steadfastWebhookToken') ||
      this.configService.get<string>('STEADFAST_WEBHOOK_TOKEN') ||
      process.env.STEADFAST_WEBHOOK_TOKEN ||
      undefined
    );
  }

  /**
   * The Steadfast entry of Setting.courierMethods, picked by provider name.
   * Shobaz can have MetroWings as the active courier while old Steadfast
   * consignments still need tracking, so the entry is not required to be the
   * active one. An active Steadfast entry is preferred when there are several.
   */
  private async getSteadfastCredentials(): Promise<SteadfastCredentials | null> {
    const setting: any = await this.settingModel
      .findOne()
      .select('courierMethods -_id')
      .lean();
    const steadfastMethods = (setting?.courierMethods || []).filter(
      (courier: any) =>
        courier?.providerName === STEADFAST_PROVIDER &&
        courier?.apiKey &&
        courier?.secretKey,
    );
    const courierMethod =
      steadfastMethods.find((courier: any) => courier.status === 'active') ||
      steadfastMethods[0];
    if (!courierMethod) return null;
    return {
      apiKey: courierMethod.apiKey,
      secretKey: courierMethod.secretKey,
    };
  }

  /**
   * GET status_by_cid. Mirrors CourierService.getOrderStatusFormCourier for
   * Steadfast (same URL and headers), plus Amolbooks' 10s timeout. Never
   * throws: failures come back as `{ error: true, ... }` without `status: 200`.
   */
  private async getSteadfastStatus(
    credentials: SteadfastCredentials,
    consignmentId: string | number,
  ): Promise<any> {
    try {
      const res = await axios.get(
        `${STEADFAST_API_URL}/status_by_cid/${encodeURIComponent(
          String(consignmentId),
        )}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Api-Key': credentials.apiKey,
            'Secret-Key': credentials.secretKey,
          },
          timeout: STEADFAST_TIMEOUT_MS,
        },
      );
      return res.data;
    } catch (error) {
      const details = error?.response?.data || error?.message;
      this.logger.warn(
        `[Steadfast Error] CID: ${consignmentId} ${
          typeof details === 'string' ? details : JSON.stringify(details)
        }`,
      );
      return {
        error: true,
        message: 'Steadfast API call failed',
        delivery_status: 'unknown',
        details,
      };
    }
  }

  /** Readable error text for a failed status lookup (objects are stringified). */
  private lookupErrorMessage(response: any, fallback: string): string {
    const detail = response?.details || response?.message;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  /**
   * WEBHOOK
   * receiveSteadfastWebhook()
   */

  /** Receive authenticated delivery and tracking updates from Steadfast. */
  async receiveSteadfastWebhook(
    authorization: string,
    payload: SteadfastWebhookPayload,
  ): Promise<void> {
    const configuredToken = this.getWebhookToken();
    if (!configuredToken) {
      this.logger.error('STEADFAST_WEBHOOK_TOKEN is not configured');
      throw new ServiceUnavailableException('Webhook is not configured.');
    }

    const suppliedToken = String(authorization || '').replace(
      /^Bearer\s+/i,
      '',
    );
    const expectedHash = crypto
      .createHash('sha256')
      .update(configuredToken)
      .digest();
    const suppliedHash = crypto
      .createHash('sha256')
      .update(suppliedToken)
      .digest();
    if (!suppliedToken || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      throw new UnauthorizedException('Invalid webhook token.');
    }

    if (
      !payload ||
      !['delivery_status', 'tracking_update'].includes(
        payload.notification_type,
      ) ||
      (payload.consignment_id == null && !payload.invoice)
    ) {
      throw new BadRequestException('Invalid Steadfast webhook payload.');
    }

    const consignmentId =
      payload.consignment_id == null
        ? null
        : String(payload.consignment_id).trim();
    const invoice =
      payload.invoice == null ? null : String(payload.invoice).trim();
    const [byConsignment, byInvoice]: any[] = await Promise.all([
      consignmentId
        ? this.orderModel
            .findOne({
              'courierData.providerName': STEADFAST_PROVIDER,
              'courierData.consignmentId': consignmentId,
            })
            .lean()
        : null,
      invoice ? this.orderModel.findOne({ orderId: invoice }).lean() : null,
    ]);

    if (
      byConsignment &&
      byInvoice &&
      String(byConsignment._id) !== String(byInvoice._id)
    ) {
      throw new BadRequestException(
        'Consignment ID and invoice identify different orders.',
      );
    }

    const order: any = byConsignment || byInvoice;
    if (!order) {
      throw new NotFoundException('Invalid consignment ID or invoice.');
    }
    if (
      order.courierData?.providerName &&
      order.courierData.providerName !== STEADFAST_PROVIDER
    ) {
      throw new BadRequestException('Order does not use Steadfast Courier.');
    }
    if (
      consignmentId &&
      order.courierData?.consignmentId &&
      String(order.courierData.consignmentId) !== consignmentId
    ) {
      throw new BadRequestException('Consignment ID does not match invoice.');
    }
    if (invoice && String(order.orderId) !== invoice) {
      throw new BadRequestException('Invoice does not match consignment ID.');
    }

    const notificationType = payload.notification_type;
    const rawStatus =
      notificationType === 'delivery_status' && payload.status
        ? String(payload.status).trim().toLowerCase()
        : undefined;
    const updatedAt = payload.updated_at
      ? String(payload.updated_at).trim()
      : new Date().toISOString();
    const trackingMessage = payload.tracking_message
      ? String(payload.tracking_message).trim()
      : undefined;
    const codAmount =
      payload.cod_amount === null || payload.cod_amount === undefined
        ? undefined
        : Number(payload.cod_amount);
    const deliveryCharge = this.getSteadfastDeliveryCharge(payload);
    const eventKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          notificationType,
          consignmentId,
          invoice,
          rawStatus,
          trackingMessage,
          codAmount: Number.isFinite(codAmount) ? codAmount : undefined,
          deliveryCharge,
          updatedAt,
        }),
      )
      .digest('hex');

    const existingHistory = order.courierStatusHistory || [];
    if (existingHistory.some((event: any) => event.eventKey === eventKey)) {
      return;
    }

    const receivedAt = new Date();
    const historyEvent = {
      eventKey,
      notificationType,
      status: rawStatus,
      trackingMessage,
      updatedAt,
      receivedAt,
    };
    const currentUpdatedAt = order.courierStatus?.updatedAt;
    // Steadfast sends Dhaka wall-clock times without a zone ("2026-11-07 16:40:00");
    // read those as +06:00 so the result does not depend on the server time zone.
    const parseCourierTime = (value: any) => {
      const text = String(value || '').trim().replace(' ', 'T');
      const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : text + '+06:00';
      return Date.parse(zoned);
    };
    const incomingTimestamp = parseCourierTime(updatedAt);
    const currentTimestamp = currentUpdatedAt
      ? parseCourierTime(currentUpdatedAt)
      : NaN;
    const isCurrentEvent =
      !currentUpdatedAt ||
      (Number.isFinite(incomingTimestamp) && Number.isFinite(currentTimestamp)
        ? incomingTimestamp >= currentTimestamp
        : updatedAt >= currentUpdatedAt);
    const update: any = {
      $push: {
        courierStatusHistory: {
          $each: [historyEvent],
          $slice: -20,
        },
      },
    };

    if (isCurrentEvent) {
      const currentStatus = order.courierStatus?.status;
      update.$set = {
        'courierStatus.status': rawStatus || currentStatus || 'in_review',
        'courierStatus.notificationType': notificationType,
        'courierStatus.trackingMessage':
          trackingMessage || order.courierStatus?.trackingMessage || '',
        'courierStatus.updatedAt': updatedAt,
        'courierStatus.receivedAt': receivedAt,
      };
      if (Number.isFinite(codAmount)) {
        update.$set['courierStatus.codAmount'] = codAmount;
      }
      if (deliveryCharge !== undefined) {
        update.$set['courierStatus.deliveryCharge'] = deliveryCharge;
        update.$unset = {
          ...(update.$unset || {}),
          'courierStatus.chargeLookupError': 1,
        };
      }
    }

    await this.orderModel.updateOne(
      {
        _id: order._id,
        'courierStatusHistory.eventKey': { $ne: eventKey },
      },
      update,
    );
  }

  /**
   * HISTORICAL BACKFILL
   * backfillSteadfastStatus()
   * runSteadfastStatusBackfillBatch()
   */

  async backfillSteadfastStatus(
    body: SteadfastBackfillBody,
  ): Promise<ResponsePayload> {
    if (this.steadfastBackfillRunning) {
      throw new ConflictException(
        'Another Steadfast backfill batch is already running.',
      );
    }
    this.steadfastBackfillRunning = true;
    try {
      return await this.runSteadfastStatusBackfillBatch(body);
    } finally {
      this.steadfastBackfillRunning = false;
    }
  }

  private async runSteadfastStatusBackfillBatch(
    body: SteadfastBackfillBody,
  ): Promise<ResponsePayload> {
    const requestedLimit = Number(body?.limit) || 15;
    const limit = Math.min(Math.max(Math.floor(requestedLimit), 1), 25);
    const retryFailed = body?.retryFailed === true;
    const credentials = await this.getSteadfastCredentials();
    if (!credentials) {
      throw new BadRequestException(
        'Steadfast API credentials are not configured.',
      );
    }

    const missingStatusQuery = () => ({
      'courierData.providerName': STEADFAST_PROVIDER,
      'courierData.consignmentId': { $exists: true, $nin: [null, ''] },
      $or: [
        { 'courierStatus.status': { $exists: false } },
        { 'courierStatus.status': null },
        { 'courierStatus.status': '' },
      ],
    });
    const candidateQuery: any = {
      $and: [
        missingStatusQuery(),
        retryFailed
          ? { 'courierStatus.backfillAttemptedAt': { $exists: true } }
          : { 'courierStatus.backfillAttemptedAt': { $exists: false } },
      ],
    };
    const orders: any[] = await this.orderModel
      .find(candidateQuery)
      .sort(
        retryFailed
          ? { 'courierStatus.backfillAttemptedAt': 1 }
          : { createdAt: 1 },
      )
      .limit(limit)
      .select('orderId courierData courierStatus')
      .lean();

    const results: Array<{
      orderId: string;
      success: boolean;
      error?: string;
    }> = [];

    // Three concurrent requests keeps batches quick without flooding Steadfast.
    for (let index = 0; index < orders.length; index += 3) {
      const chunk = orders.slice(index, index + 3);
      const chunkResults = await Promise.all(
        chunk.map(async (order: any) => {
          const attemptedAt = new Date();
          try {
            const response = await this.getSteadfastStatus(
              credentials,
              order.courierData.consignmentId,
            );
            if (
              response?.status !== 200 ||
              typeof response?.delivery_status !== 'string'
            ) {
              throw new Error(
                this.lookupErrorMessage(
                  response,
                  'Steadfast returned no delivery status.',
                ),
              );
            }

            const status = response.delivery_status.trim().toLowerCase();
            const deliveryCharge = this.getSteadfastDeliveryCharge(response);
            const eventKey = crypto
              .createHash('sha256')
              .update(
                `historical_backfill:${order.courierData.consignmentId}:${status}`,
              )
              .digest('hex');
            const statusSet: any = {
              'courierStatus.status': status,
              'courierStatus.notificationType': 'historical_backfill',
              'courierStatus.trackingMessage':
                'Historical status retrieved from Steadfast.',
              'courierStatus.updatedAt': attemptedAt.toISOString(),
              'courierStatus.receivedAt': attemptedAt,
              'courierStatus.backfillAttemptedAt': attemptedAt,
              'courierStatus.chargeLookupAttemptedAt': attemptedAt,
            };
            const statusUnset: any = {
              'courierStatus.backfillError': 1,
            };
            if (deliveryCharge !== undefined) {
              statusSet['courierStatus.deliveryCharge'] = deliveryCharge;
              statusUnset['courierStatus.chargeLookupError'] = 1;
            } else {
              statusSet['courierStatus.chargeLookupError'] =
                MISSING_CHARGE_MESSAGE;
            }
            await this.orderModel.updateOne(
              { _id: order._id },
              {
                $set: statusSet,
                $unset: statusUnset,
                $push: {
                  courierStatusHistory: {
                    $each: [
                      {
                        eventKey,
                        notificationType: 'historical_backfill',
                        status,
                        trackingMessage:
                          'Historical status retrieved from Steadfast.',
                        updatedAt: attemptedAt.toISOString(),
                        receivedAt: attemptedAt,
                      },
                    ],
                    $slice: -20,
                  },
                },
              } as any,
            );
            return { orderId: order.orderId, success: true };
          } catch (error) {
            const message = String(
              error?.message || 'Steadfast status lookup failed.',
            ).slice(0, 300);
            await this.orderModel.updateOne(
              { _id: order._id },
              {
                $set: {
                  'courierStatus.backfillAttemptedAt': attemptedAt,
                  'courierStatus.backfillError': message,
                },
              },
            );
            return {
              orderId: order.orderId,
              success: false,
              error: message,
            };
          }
        }),
      );
      results.push(...chunkResults);
    }

    const [remaining, failedTotal] = await Promise.all([
      this.orderModel.countDocuments({
        $and: [
          missingStatusQuery(),
          { 'courierStatus.backfillAttemptedAt': { $exists: false } },
        ],
      } as any),
      this.orderModel.countDocuments({
        $and: [
          missingStatusQuery(),
          { 'courierStatus.backfillAttemptedAt': { $exists: true } },
        ],
      } as any),
    ]);
    const updated = results.filter((result) => result.success).length;
    const failed = results.length - updated;

    return {
      success: true,
      message: 'Steadfast historical status batch completed.',
      data: {
        checked: results.length,
        updated,
        failed,
        remaining,
        failedTotal,
        failures: results.filter((result) => !result.success).slice(0, 10),
      },
    } as ResponsePayload;
  }

  /**
   * LIVE "IN REVIEW" SYNC
   * syncSteadfastInReview()
   * runSteadfastInReviewSync()
   */

  async syncSteadfastInReview(): Promise<ResponsePayload> {
    if (this.steadfastInReviewSyncRunning) {
      throw new ConflictException(
        'A Steadfast In Review sync is already running.',
      );
    }
    if (
      this.steadfastInReviewSyncResult &&
      Date.now() - this.steadfastInReviewSyncCompletedAt < 45000
    ) {
      return {
        ...this.steadfastInReviewSyncResult,
        data: {
          ...(this.steadfastInReviewSyncResult.data as any),
          cached: true,
        },
      } as ResponsePayload;
    }

    this.steadfastInReviewSyncRunning = true;
    try {
      const result = await this.runSteadfastInReviewSync();
      this.steadfastInReviewSyncResult = result;
      this.steadfastInReviewSyncCompletedAt = Date.now();
      return result;
    } finally {
      this.steadfastInReviewSyncRunning = false;
    }
  }

  private async runSteadfastInReviewSync(): Promise<ResponsePayload> {
    const credentials = await this.getSteadfastCredentials();
    if (!credentials) {
      throw new BadRequestException(
        'Steadfast API credentials are not configured.',
      );
    }

    const inReviewQuery = {
      'courierData.providerName': STEADFAST_PROVIDER,
      'courierData.consignmentId': { $exists: true, $nin: [null, ''] },
      'courierStatus.status': 'in_review',
    };
    // Orders can enter in_review without a webhook firing (missed/late webhook,
    // or a status change that predates the webhook being configured). Checking
    // only orders already labeled in_review can never recover those, so the
    // sync candidates also include every non-terminal status.
    const syncCandidatesQuery = {
      'courierData.providerName': STEADFAST_PROVIDER,
      'courierData.consignmentId': { $exists: true, $nin: [null, ''] },
      'courierStatus.status': {
        $nin: ['delivered', 'partial_delivered', 'cancelled'],
      },
    };
    const orders: any[] = await this.orderModel
      .find(syncCandidatesQuery as any)
      .sort({ 'courierStatus.lastSyncedAt': 1, createdAt: 1 })
      .limit(50)
      .select('orderId courierData courierStatus')
      .lean();
    const results: Array<{
      id: string;
      orderId: string;
      success: boolean;
      status?: string;
      moved?: boolean;
      entered?: boolean;
      chargeUpdated?: boolean;
      error?: string;
    }> = [];

    // Eight concurrent requests keep the visible queue responsive while staying
    // far below the legacy scheduler's 100-request batches.
    for (let index = 0; index < orders.length; index += 8) {
      const chunk = orders.slice(index, index + 8);
      const chunkResults = await Promise.all(
        chunk.map(async (order: any) => {
          const syncedAt = new Date();
          try {
            const response = await this.getSteadfastStatus(
              credentials,
              order.courierData.consignmentId,
            );
            if (
              response?.status !== 200 ||
              typeof response?.delivery_status !== 'string'
            ) {
              throw new Error(
                this.lookupErrorMessage(
                  response,
                  'Steadfast returned no delivery status.',
                ),
              );
            }

            const status = response.delivery_status.trim().toLowerCase();
            const previousStatus = String(
              order.courierStatus?.status || '',
            ).toLowerCase();
            const statusChanged = status !== previousStatus;
            const moved =
              previousStatus === 'in_review' && status !== 'in_review';
            const entered =
              previousStatus !== 'in_review' && status === 'in_review';
            const deliveryCharge = this.getSteadfastDeliveryCharge(response);
            const needsCharge =
              order.courierStatus?.deliveryCharge === null ||
              order.courierStatus?.deliveryCharge === undefined;
            const update: any = {
              $set: { 'courierStatus.lastSyncedAt': syncedAt },
              $unset: { 'courierStatus.lastSyncError': 1 },
            };
            if (needsCharge) {
              update.$set['courierStatus.chargeLookupAttemptedAt'] = syncedAt;
              if (deliveryCharge !== undefined) {
                update.$set['courierStatus.deliveryCharge'] = deliveryCharge;
                update.$unset['courierStatus.chargeLookupError'] = 1;
              } else {
                update.$set['courierStatus.chargeLookupError'] =
                  MISSING_CHARGE_MESSAGE;
              }
            }
            if (statusChanged) {
              const trackingMessage = 'Live status reconciled with Steadfast.';
              const updatedAt = syncedAt.toISOString();
              const eventKey = crypto
                .createHash('sha256')
                .update(
                  `live_in_review_sync:${order.courierData.consignmentId}:${status}:${updatedAt}`,
                )
                .digest('hex');
              update.$set = {
                ...update.$set,
                'courierStatus.status': status,
                'courierStatus.notificationType': 'live_in_review_sync',
                'courierStatus.trackingMessage': trackingMessage,
                'courierStatus.updatedAt': updatedAt,
                'courierStatus.receivedAt': syncedAt,
              };
              update.$push = {
                courierStatusHistory: {
                  $each: [
                    {
                      eventKey,
                      notificationType: 'live_in_review_sync',
                      status,
                      trackingMessage,
                      updatedAt,
                      receivedAt: syncedAt,
                    },
                  ],
                  $slice: -20,
                },
              };
            }
            await this.orderModel.updateOne({ _id: order._id }, update);
            return {
              id: String(order._id),
              orderId: order.orderId,
              success: true,
              status,
              moved,
              entered,
              chargeUpdated: needsCharge && deliveryCharge !== undefined,
            };
          } catch (error) {
            const message = String(
              error?.message || 'Steadfast status lookup failed.',
            ).slice(0, 300);
            await this.orderModel.updateOne(
              { _id: order._id },
              {
                $set: {
                  'courierStatus.lastSyncedAt': syncedAt,
                  'courierStatus.lastSyncError': message,
                  ...(order.courierStatus?.deliveryCharge === null ||
                  order.courierStatus?.deliveryCharge === undefined
                    ? {
                        'courierStatus.chargeLookupAttemptedAt': syncedAt,
                        'courierStatus.chargeLookupError': message,
                      }
                    : {}),
                },
              },
            );
            return {
              id: String(order._id),
              orderId: order.orderId,
              success: false,
              error: message,
            };
          }
        }),
      );
      results.push(...chunkResults);
    }

    const currentCount = await this.orderModel.countDocuments(
      inReviewQuery as any,
    );
    void this.syncSteadfastMissingCharges().catch((error) => {
      this.logger.warn(
        `Steadfast missing-charge background batch failed: ${
          error?.message || error
        }`,
      );
    });
    const moved = results.filter((result) => result.moved);
    const entered = results.filter((result) => result.entered);
    const chargesUpdated = results.filter(
      (result) => result.chargeUpdated,
    ).length;
    const failed = results.filter((result) => !result.success);
    return {
      success: true,
      message: 'Steadfast In Review queue synchronized.',
      data: {
        checked: results.length,
        moved: moved.length,
        entered: entered.length,
        chargesUpdated,
        failed: failed.length,
        currentCount,
        movedOrderIds: moved.map((result) => result.id),
        enteredOrderIds: entered.map((result) => result.id),
        failures: failed.slice(0, 10),
      },
    } as ResponsePayload;
  }

  /**
   * MISSING DELIVERY CHARGES (background, fired after each live sync)
   * syncSteadfastMissingCharges()
   */

  private async syncSteadfastMissingCharges(): Promise<void> {
    if (
      this.steadfastMissingChargeSyncRunning ||
      Date.now() - this.steadfastMissingChargeSyncCompletedAt < 5 * 60 * 1000
    ) {
      return;
    }
    this.steadfastMissingChargeSyncRunning = true;
    try {
      const credentials = await this.getSteadfastCredentials();
      if (!credentials) return;

      const retryChargeBefore = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const findMissingChargeOrders = async (
        statuses: string[],
        limit: number,
        excludedIds: any[] = [],
      ): Promise<any[]> =>
        this.orderModel
          .find({
            'courierData.providerName': STEADFAST_PROVIDER,
            'courierData.consignmentId': {
              $exists: true,
              $nin: [null, ''],
            },
            'courierStatus.status': { $in: statuses },
            $and: [
              {
                $or: [
                  { 'courierStatus.deliveryCharge': { $exists: false } },
                  { 'courierStatus.deliveryCharge': null },
                ],
              },
              {
                $or: [
                  {
                    'courierStatus.chargeLookupAttemptedAt': {
                      $exists: false,
                    },
                  },
                  {
                    'courierStatus.chargeLookupAttemptedAt': {
                      $lt: retryChargeBefore,
                    },
                  },
                ],
              },
            ],
            _id: { $nin: excludedIds },
          } as any)
          .sort({ 'courierStatus.chargeLookupAttemptedAt': 1, createdAt: -1 })
          .limit(limit)
          .select('orderId courierData courierStatus')
          .lean();

      // Prioritize completed deliveries, then use remaining capacity for active
      // consignments. This batch is deliberately independent of the visible queue.
      const deliveredOrders = await findMissingChargeOrders(
        [
          'delivered',
          'partial_delivered',
          'delivered_approval_pending',
          'partial_delivered_approval_pending',
        ],
        20,
      );
      // limit(0) means "no limit" in MongoDB, so skip the second query when
      // the delivered batch already filled all 20 slots.
      const otherOrders =
        deliveredOrders.length < 20
          ? await findMissingChargeOrders(
              [
                'pending',
                'hold',
                'cancelled',
                'cancelled_approval_pending',
                'unknown',
                'unknown_approval_pending',
              ],
              20 - deliveredOrders.length,
              deliveredOrders.map((order) => order._id),
            )
          : [];
      const orders = [...deliveredOrders, ...otherOrders];

      for (let index = 0; index < orders.length; index += 5) {
        await Promise.all(
          orders.slice(index, index + 5).map(async (order: any) => {
            const attemptedAt = new Date();
            try {
              const response = await this.getSteadfastStatus(
                credentials,
                order.courierData.consignmentId,
              );
              if (response?.status !== 200) {
                throw new Error(
                  this.lookupErrorMessage(
                    response,
                    'Steadfast status lookup failed.',
                  ),
                );
              }
              const deliveryCharge = this.getSteadfastDeliveryCharge(response);
              await this.orderModel.updateOne(
                { _id: order._id },
                deliveryCharge === undefined
                  ? {
                      $set: {
                        'courierStatus.chargeLookupAttemptedAt': attemptedAt,
                        'courierStatus.chargeLookupError':
                          MISSING_CHARGE_MESSAGE,
                      },
                    }
                  : {
                      $set: {
                        'courierStatus.deliveryCharge': deliveryCharge,
                        'courierStatus.chargeLookupAttemptedAt': attemptedAt,
                      },
                      $unset: { 'courierStatus.chargeLookupError': 1 },
                    },
              );
            } catch (error) {
              const message = String(
                error?.message || 'Steadfast charge lookup failed.',
              ).slice(0, 300);
              await this.orderModel.updateOne(
                { _id: order._id },
                {
                  $set: {
                    'courierStatus.chargeLookupAttemptedAt': attemptedAt,
                    'courierStatus.chargeLookupError': message,
                  },
                },
              );
            }
          }),
        );
      }
    } finally {
      this.steadfastMissingChargeSyncRunning = false;
      this.steadfastMissingChargeSyncCompletedAt = Date.now();
    }
  }
}
