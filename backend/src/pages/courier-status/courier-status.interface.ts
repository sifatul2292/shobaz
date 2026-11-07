/**
 * Body Steadfast posts to the courier webhook (ported from Amolbooks).
 * `delivery_status` events carry `status`; `tracking_update` events carry only
 * the tracking message. Steadfast is inconsistent about the charge field name,
 * so both `delivery_charge` and `delivery_fee` are accepted.
 */
export interface SteadfastWebhookPayload {
  notification_type?: 'delivery_status' | 'tracking_update';
  consignment_id?: string | number;
  invoice?: string;
  cod_amount?: number | string;
  status?: string;
  delivery_charge?: number | string;
  delivery_fee?: number | string;
  tracking_message?: string;
  updated_at?: string;
}

/** Body of `POST /api/order/backfill-steadfast-status`. */
export interface SteadfastBackfillBody {
  limit?: number;
  retryFailed?: boolean;
}

/** Steadfast API credentials read from the Setting `courierMethods` entry. */
export interface SteadfastCredentials {
  apiKey: string;
  secretKey: string;
}
