import * as mongoose from 'mongoose';

const WeightRuleSchema = new mongoose.Schema(
  {
    fromGram: { type: Number, required: true },
    toGram: { type: Number, required: true },
    cost: { type: Number, required: true },
  },
  { _id: false },
);

export const ShippingChargeSchema = new mongoose.Schema(
  {
    deliveryInDhaka: {
      type: Number,
      required: true,
    },
    deliveryOutsideDhaka: {
      type: Number,
      required: true,
    },
    deliveryOutsideBD: {
      type: Number,
      required: false,
    },
    insideDhakaRules: {
      type: [WeightRuleSchema],
      required: false,
      default: [],
    },
    outsideDhakaRules: {
      type: [WeightRuleSchema],
      required: false,
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
