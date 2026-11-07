import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../../interfaces/common/order.interface';
import { Product } from '../../interfaces/common/product.interface';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { OrderStatus } from '../../enum/order.enum';
import { DiscountTypeEnum } from '../../enum/product.enum';

/** Orders that never became a real sale are left out of every insight. */
const EXCLUDED_STATUSES = [
  OrderStatus.CANCEL,
  OrderStatus.REFUND,
  OrderStatus.RETURN,
  OrderStatus.HOLD,
];
const RECOMMENDATION_WINDOW_DAYS = 90;
const MAX_SUGGESTIONS = 12;
const MAX_PACKAGES = 100;
/** Baskets bigger than this are bulk orders, not bundles; skip their 3–4 book combinations. */
const MAX_COMBINATION_BASKET = 15;

type BundleProduct = { id: string; name: string };
type BundleResult = {
  products: BundleProduct[];
  orderCount: number;
  recentOrderCount: number;
  lastOrderAt: Date;
};
type CustomerRow = {
  phoneNo: string;
  name: string;
  orderCount: number;
  itemCount: number;
  totalSpent: number;
  lastOrderAt: Date;
};

/** Free gifts (checkout `orderType: 'free'`, staff `'gift'`) are not part of a basket. */
const paidItemFilter = (input: any) => ({
  $filter: {
    input: { $ifNull: [input, []] },
    as: 'item',
    cond: {
      $and: [
        { $gt: ['$$item._id', null] },
        { $ne: ['$$item.isGift', true] },
        { $ne: ['$$item.isFreeGift', true] },
        { $not: [{ $in: ['$$item.orderType', ['free', 'gift']] }] },
      ],
    },
  },
});

/** Bangladeshi numbers in one form (01XXXXXXXXX) so +880 / 880 / spaced copies merge. */
function normalizePhone(value: any): string {
  let digits = String(value == null ? '' : value).replace(/\D/g, '');
  if (digits.startsWith('0088')) digits = digits.slice(4);
  else if (digits.startsWith('88') && digits.length === 13) digits = digits.slice(2);
  if (/^1[3-9]\d{8}$/.test(digits)) digits = `0${digits}`;
  return digits;
}

/** Same rule as UtilsService.transform(product, 'salePrice'). */
function effectivePrice(product: any): number {
  const salePrice = Number(product?.salePrice) || 0;
  const discountAmount = Number(product?.discountAmount) || 0;
  if (product?.discountType === DiscountTypeEnum.PERCENTAGE) {
    return Math.max(0, Math.floor(salePrice - (discountAmount / 100) * salePrice));
  }
  if (product?.discountType === DiscountTypeEnum.CASH) {
    return Math.max(0, Math.floor(salePrice - discountAmount));
  }
  return Math.max(0, Math.floor(salePrice));
}

@Injectable()
export class CustomerInsightsService {
  private logger = new Logger(CustomerInsightsService.name);

  constructor(
    @InjectModel('Order')
    private readonly orderModel: Model<Order>,
    @InjectModel('Product')
    private readonly productModel: Model<Product>,
  ) {}

  /**
   * Repeat customers, multi-item baskets and the 3–4 book combinations that
   * sold together most in the last 90 days (port of Amolbooks
   * order/customer-bundle-insights).
   */
  // The basket maths is heavy on a large order history: reuse a report for a
  // few minutes and let concurrent requests share one run.
  private cached: { at: number; result: ResponsePayload } | null = null;
  private running: Promise<ResponsePayload> | null = null;

  async getReport(): Promise<ResponsePayload> {
    if (this.cached && Date.now() - this.cached.at < 5 * 60 * 1000) {
      return this.cached.result;
    }
    if (!this.running) {
      this.running = this.buildReport()
        .then((result) => {
          if ((result as any)?.success) this.cached = { at: Date.now(), result };
          return result;
        })
        .finally(() => {
          this.running = null;
        });
    }
    return this.running;
  }

  private async buildReport(): Promise<ResponsePayload> {
    try {
      const validOrders = { orderStatus: { $nin: EXCLUDED_STATUSES } };

      const [phoneGroups, multiItemOrders] = await Promise.all([
        // Grouped by the raw phone here; merged by the normalised phone below.
        this.orderModel
          .aggregate([
            { $match: { ...validOrders, phoneNo: { $nin: [null, ''] } } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: '$phoneNo',
                name: { $first: '$name' },
                orderCount: { $sum: 1 },
                itemCount: {
                  $sum: {
                    $sum: {
                      $map: {
                        input: paidItemFilter('$orderedItems'),
                        as: 'item',
                        in: { $ifNull: ['$$item.quantity', 1] },
                      },
                    },
                  },
                },
                totalSpent: { $sum: { $ifNull: ['$grandTotal', 0] } },
                lastOrderAt: { $max: '$createdAt' },
              },
            },
          ])
          .allowDiskUse(true),
        this.orderModel
          .aggregate([
            { $match: { ...validOrders, 'orderedItems.1': { $exists: true } } },
            {
              $project: {
                _id: 0,
                createdAt: 1,
                products: {
                  $map: {
                    input: paidItemFilter('$orderedItems'),
                    as: 'item',
                    in: {
                      id: { $toString: '$$item._id' },
                      name: { $ifNull: ['$$item.name', '$$item.nameEn'] },
                    },
                  },
                },
              },
            },
          ])
          .allowDiskUse(true),
      ]);

      const repeatCustomers = this.mergeCustomers(phoneGroups);
      const bundles = this.buildBundles(multiItemOrders);
      const products = await this.productPrices([
        ...bundles.bundleSuggestions,
        ...bundles.orderBundles,
      ]);

      return {
        success: true,
        message: 'Success',
        data: {
          repeatCustomers,
          multiItemOrderCount: bundles.multiItemOrderCount,
          recommendationWindowDays: RECOMMENDATION_WINDOW_DAYS,
          orderBundles: bundles.orderBundles,
          bundleSuggestions: bundles.bundleSuggestions,
          products,
          generatedAt: new Date(),
        },
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(err);
      throw new InternalServerErrorException('Could not build customer insights');
    }
  }

  private mergeCustomers(groups: any[]): CustomerRow[] {
    const byPhone = new Map<string, CustomerRow>();
    (groups || []).forEach((group) => {
      const phoneNo = normalizePhone(group._id);
      if (!phoneNo) return;
      const existing = byPhone.get(phoneNo);
      if (!existing) {
        byPhone.set(phoneNo, {
          phoneNo,
          name: group.name || '',
          orderCount: Number(group.orderCount) || 0,
          itemCount: Number(group.itemCount) || 0,
          totalSpent: Number(group.totalSpent) || 0,
          lastOrderAt: group.lastOrderAt,
        });
        return;
      }
      const newer =
        new Date(group.lastOrderAt).getTime() > new Date(existing.lastOrderAt).getTime();
      existing.orderCount += Number(group.orderCount) || 0;
      existing.itemCount += Number(group.itemCount) || 0;
      existing.totalSpent += Number(group.totalSpent) || 0;
      if (newer) {
        existing.lastOrderAt = group.lastOrderAt;
        if (group.name) existing.name = group.name;
      }
    });
    return Array.from(byPhone.values())
      .filter((customer) => customer.orderCount >= 2)
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
  }

  private buildBundles(orders: any[]) {
    const normalizedOrders = (orders || [])
      .map((order) => {
        const products = new Map<string, BundleProduct>();
        (order.products || []).forEach((product: BundleProduct) => {
          if (product?.id && !products.has(product.id)) {
            products.set(product.id, { id: product.id, name: product.name || 'Unknown book' });
          }
        });
        return {
          createdAt: order.createdAt,
          products: Array.from(products.values()).sort((a, b) => a.id.localeCompare(b.id)),
        };
      })
      .filter((order) => order.products.length > 1);

    const fullPackages = new Map<string, BundleResult>();
    const recommendations = new Map<string, BundleResult>();
    const recentCutoff = Date.now() - RECOMMENDATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const newerDate = (next: Date, current: Date) =>
      new Date(next).getTime() > new Date(current).getTime() ? next : current;
    const count = (map: Map<string, BundleResult>, key: string, products: BundleProduct[], order: any, isRecent: boolean) => {
      const existing = map.get(key);
      map.set(key, {
        products: existing ? existing.products : products,
        orderCount: (existing?.orderCount || 0) + 1,
        recentOrderCount: (existing?.recentOrderCount || 0) + (isRecent ? 1 : 0),
        lastOrderAt: existing ? newerDate(order.createdAt, existing.lastOrderAt) : order.createdAt,
      });
    };

    normalizedOrders.forEach((order) => {
      const isRecent = new Date(order.createdAt).getTime() >= recentCutoff;
      count(fullPackages, order.products.map((p) => p.id).join('|'), order.products, order, isRecent);

      if (order.products.length > MAX_COMBINATION_BASKET) return;
      const addCombinations = (size: number, start = 0, selected: BundleProduct[] = []) => {
        if (selected.length === size) {
          count(recommendations, selected.map((p) => p.id).join('|'), selected.slice(), order, isRecent);
          return;
        }
        for (let index = start; index <= order.products.length - (size - selected.length); index += 1) {
          addCombinations(size, index + 1, [...selected, order.products[index]]);
        }
      };
      for (let size = 3; size <= Math.min(4, order.products.length); size += 1) {
        addCombinations(size);
      }
    });

    const sortPackages = (a: BundleResult, b: BundleResult) =>
      b.orderCount - a.orderCount ||
      b.products.length - a.products.length ||
      new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
    const sortRecommendations = (a: BundleResult, b: BundleResult) =>
      b.recentOrderCount - a.recentOrderCount || sortPackages(a, b);

    return {
      multiItemOrderCount: normalizedOrders.length,
      orderBundles: Array.from(fullPackages.values()).sort(sortPackages).slice(0, MAX_PACKAGES),
      bundleSuggestions: Array.from(recommendations.values())
        .filter((bundle) => bundle.recentOrderCount > 1)
        .sort(sortRecommendations)
        .slice(0, MAX_SUGGESTIONS),
    };
  }

  /**
   * Current price and cost (Product.costPrice, the same source as the profit
   * dashboard) for every book in the listed bundles, so the page can load a
   * bundle straight into the profit calculator.
   */
  private async productPrices(bundles: BundleResult[]) {
    const ids = new Set<string>();
    bundles.forEach((bundle) => bundle.products.forEach((product) => ids.add(product.id)));
    const objectIds = Array.from(ids)
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!objectIds.length) return {};

    const rows: any[] = await this.productModel
      .find({ _id: { $in: objectIds } })
      .select('name nameEn salePrice costPrice discountType discountAmount')
      .lean();

    const out: Record<string, any> = {};
    rows.forEach((product) => {
      // A blank or 0 cost would make any bundle look profitable: report it as missing.
      const cost = Number(product.costPrice);
      out[String(product._id)] = {
        name: product.name || product.nameEn || '',
        salePrice: effectivePrice(product),
        listPrice: Math.max(0, Number(product.salePrice) || 0),
        costPrice: product.costPrice != null && isFinite(cost) && cost > 0 ? cost : null,
      };
    });
    return out;
  }
}
