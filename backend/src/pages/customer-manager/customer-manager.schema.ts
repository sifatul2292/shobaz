import { Schema } from 'mongoose';

/**
 * One row per contact attempt with a delivered customer (Customer Manager).
 * `phone` is the normalised 01XXXXXXXXX form; the latest row per phone is the
 * customer's current CRM status and next follow-up.
 */
export const CustomerContactSchema = new Schema(
  {
    phone: { type: String, required: true },
    outcome: { type: String, required: true },
    channel: { type: String, required: true },
    note: { type: String, maxlength: 2000, default: '' },
    // Asia/Dhaka calendar day (YYYY-MM-DD); empty means no follow-up.
    nextFollowUp: { type: String, default: '' },
    contactedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    contactedByName: { type: String },
    contactedByRole: { type: String },
  },
  { timestamps: true, versionKey: false },
);
CustomerContactSchema.index({ phone: 1, createdAt: -1, _id: -1 });
