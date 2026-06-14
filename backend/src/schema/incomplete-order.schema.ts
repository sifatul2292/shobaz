import * as mongoose from 'mongoose';

export const IncompleteOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: false,
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
      required: false,
    },
    paymentType: {
      type: String,
      required: false,
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    orderStatus: {
      type: Number,
      required: false,
    },
    deliveryCharge: {
      type: Number,
      required: false,
      default: 0,
    },
    subTotal: {
      type: Number,
      required: false,
      default: 0,
    },
    discount: {
      type: Number,
      required: false,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: false,
      default: 0,
    },
    orderedItems: {
      type: [mongoose.Schema.Types.Mixed],
      required: false,
      default: [],
    },
    checkoutDate: {
      type: Date,
      required: false,
    },
    // 'converted' once an admin turns this abandoned checkout into a real order.
    status: {
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
    fraudChecker: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
