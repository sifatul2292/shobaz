import * as mongoose from 'mongoose';

/**
 * Single-document collection that stores the global "Bought Together" default.
 * When a product has its own boughtTogetherIds the frontend uses those instead.
 */
export const BoughtTogetherConfigSchema = new mongoose.Schema(
  {
    productIds: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
