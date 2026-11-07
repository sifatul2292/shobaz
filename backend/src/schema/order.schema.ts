import * as mongoose from 'mongoose';
import { ORDER_ITEM_SCHEMA } from './sub-schema.schema';
import { Schema } from 'mongoose';

export const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    orderSmsSent: {
      type: Boolean,
      required: false,
      default: false,
    },
    courierData: {
      providerName: {
        type: String,
        required: false,
      },
      consignmentId: {
        type: String,
        required: false,
      },
      trackingId: {
        type: String,
        required: false,
      },
      createdAt: {
        type: String,
        required: false,
      },
    },
    zone: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Zone',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    division: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Division',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    area: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Area',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    paymentType: {
      type: String,
      required: false,
    },
    orderFrom: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
      default: 'unpaid',
    },
    courierLink: {
      type: String,
      required: false,
    },
    orderedItems: [ORDER_ITEM_SCHEMA],
    subTotal: {
      type: Number,
      required: false,
    },
    deliveryCharge: {
      type: Number,
      required: false,
    },
    fraudChecker: {
      type: Schema.Types.Mixed,
      required: false,
    },
    weightBasedDeliveryCharge: {
      type: Number,
      required: false,
      default: 0,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    orderDiscountFromApps: {
      type: Number,
      required: false,
    },
    month: {
      type: Number,
      required: false,
    },
    year: {
      type: Number,
      required: false,
    },
    productDiscount: {
      type: Number,
      required: false,
    },
    sslSessionId: {
      type: String,
      required: false,
    },
    bkashPaymentId: {
      type: String,
      required: false,
    },
    nagadPaymentId: {
      type: String,
      required: false,
    },
    grandTotal: {
      type: Number,
      required: false,
    },
    discountTypes: {
      type: [Object],
      required: false,
    },
    checkoutDate: {
      type: String,
      required: false,
    },
    deliveryDate: {
      type: Date,
      required: false,
    },
    deliveryDateString: {
      type: String,
      required: false,
    },
    orderStatus: {
      type: Number,
      required: false,
      default: 1,
    },
    hasOrderTimeline: {
      type: Boolean,
      required: false,
    },
    orderTimeline: {
      type: Object,
      required: false,
    },
    processingDate: {
      type: Date,
      required: false,
    },
    shippingDate: {
      type: Date,
      required: false,
    },
    deliveringDate: {
      type: Date,
      required: false,
    },
    preferredDateString: {
      type: String,
      required: false,
    },
    preferredTime: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    adminNote: {
      type: String,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    // Staff who last wrote adminNote (staff-activity).
    adminNoteBy: {
      _id: { type: Schema.Types.ObjectId, ref: 'Admin' },
      name: { type: String },
      role: { type: String },
      at: { type: Date },
    },
    // Staff whose action booked the courier parcel (staff-activity).
    courierSentBy: {
      _id: { type: Schema.Types.ObjectId, ref: 'Admin' },
      name: { type: String },
      role: { type: String },
      at: { type: Date },
    },
    // Staff credit scored when the parcel is sent (staff-activity): who converted
    // the order (incomplete / Customer Manager) and who added books beyond the
    // customer's own count.
    staffCredit: {
      type: Schema.Types.Mixed,
      required: false,
    },
    // Latest courier status (Steadfast webhook / status sync) and charge.
    courierStatus: {
      status: { type: String, required: false },
      notificationType: { type: String, required: false },
      trackingMessage: { type: String, required: false },
      codAmount: { type: Number, required: false },
      deliveryCharge: { type: Number, required: false },
      updatedAt: { type: String, required: false },
      receivedAt: { type: Date, required: false },
      lastSyncedAt: { type: Date, required: false },
      lastSyncError: { type: String, required: false },
      chargeLookupAttemptedAt: { type: Date, required: false },
      chargeLookupError: { type: String, required: false },
      backfillAttemptedAt: { type: Date, required: false },
      backfillError: { type: String, required: false },
    },
    courierStatusHistory: [
      {
        _id: false,
        eventKey: { type: String, required: true },
        notificationType: { type: String, required: true },
        status: { type: String, required: false },
        trackingMessage: { type: String, required: false },
        updatedAt: { type: String, required: false },
        receivedAt: { type: Date, required: true },
      },
    ],
    admin: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Admin',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: false,
    },
    couponDiscount: {
      type: Number,
      required: false,
    },
    stockDecremented: {
      type: Boolean,
      required: false,
      default: false,
    },
    stockRestocked: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
