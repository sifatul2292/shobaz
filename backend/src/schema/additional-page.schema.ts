import * as mongoose from 'mongoose';

export const AdditionalPageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, required: false, default: '' },
    // Legacy field kept for backward compat
    description: { type: String, required: false, default: '' },
    isHtml: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: false },
    showInHeader: { type: Boolean, default: false },
    footerGroup: { type: String, default: 'policy' }, // 'policy' | 'feature' | 'none'
    headerOrder: { type: Number, default: 99 },
    footerOrder: { type: Number, default: 99 },
    menuLabel: { type: String, default: '' }, // custom label for menu (uses name if empty)
  },
  { versionKey: false, timestamps: true },
);
