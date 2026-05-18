import * as mongoose from 'mongoose';

export const IncompleteOrderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNo: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
