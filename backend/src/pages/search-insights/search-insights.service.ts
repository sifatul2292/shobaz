import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { URL } from 'url';

// The header search box asks again as the customer keeps typing; within this window the
// visitor's last search is updated instead of adding another row.
const MERGE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PERIODS = [7, 30, 90, 365];
const MAX_RANGE_DAYS = 366;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|python|curl|wget|httpclient/i;
// Local admin previews (Angular admin, static admin pages, Angular dev server).
const LOCAL_ADMIN_PORTS = ['3007', '4000', '4200'];

export const searchKey = (term: string) =>
  String(term || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();

/** Start of a Dhaka calendar day (YYYY-MM-DD) as a timestamp. */
const dhakaDayStart = (day: string) => Date.parse(`${day}T00:00:00+06:00`);

/**
 * Staff also use /product/search (the order editor on the admin panel and the static
 * admin pages), so those requests are not customer searches.
 */
function isStaffRequest(headers: any): boolean {
  if (headers.administrator) return true;
  const host = String(headers.host || '').toLowerCase();
  return [headers.origin, headers.referer].some((value) => {
    if (!value || value === 'null') return false;
    let url: URL;
    try {
      url = new URL(String(value));
    } catch (error) {
      return false;
    }
    const hostname = url.hostname.toLowerCase();
    if (/^(admin|api|apisub)\./.test(hostname)) return true;
    if (url.pathname.includes('/upload/static/')) return true;
    // A page served by the API itself (static admin pages).
    if (host && url.host.toLowerCase() === host) return true;
    return /^(localhost|127\.0\.0\.1)$/.test(hostname) && LOCAL_ADMIN_PORTS.includes(url.port);
  });
}

@Injectable()
export class SearchInsightsService {
  private readonly logger = new Logger(SearchInsightsService.name);

  constructor(
    @InjectModel('SearchLog') private readonly searchLogModel: Model<any>,
  ) {}

  /** A shop search (storefront header search box). Never throws. */
  async record(raw: any, results: number, req: any): Promise<void> {
    try {
      const headers = req?.headers || {};
      // Staff searching from the admin panel are not customers.
      if (isStaffRequest(headers)) return;
      const ua = String(headers['user-agent'] || '');
      if (!ua || BOT_UA.test(ua)) return;
      const term = String(raw ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
      const key = searchKey(term);
      if (key.length < 2 || term.length > 80 || /https?:|www\./i.test(term)) return;
      const ip =
        String(headers['cf-connecting-ip'] || '').trim() ||
        String(headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        String(req?.ip || '');
      const day = new Date().toISOString().slice(0, 10);
      const visitor = createHash('sha256')
        .update(`${day}|${ip}|${ua}`)
        .digest('hex')
        .slice(0, 16);
      const now = new Date();
      const found = Number.isFinite(Number(results)) ? Number(results) : 0;
      const last: any = await this.searchLogModel
        .findOne({ visitor, at: { $gte: new Date(now.getTime() - MERGE_MS) } })
        .sort({ at: -1 })
        .lean();
      if (last && (key.startsWith(last.key) || last.key.startsWith(key))) {
        // Typing on keeps the longer words; trimming back only refreshes the time.
        const update = key.length >= last.key.length ? { term, key, results: found, at: now } : { at: now };
        await this.searchLogModel.updateOne({ _id: last._id }, { $set: update });
        return;
      }
      await this.searchLogModel.create({ term, key, visitor, results: found, at: now });
    } catch (error) {
      this.logger.warn(`Search log failed: ${error?.message || error}`);
    }
  }

  /** Searches grouped by term for the admin "Customer Searches" page. */
  async report(query: any) {
    const { since, until, days, startDate, endDate } = this.range(query);
    const match = { at: { $gte: since, $lt: until } };
    const [rows, people] = await Promise.all([
      this.searchLogModel.aggregate([
        { $match: match },
        { $sort: { at: 1 } },
        {
          $group: {
            _id: '$key',
            term: { $last: '$term' },
            searches: { $sum: 1 },
            visitors: { $addToSet: '$visitor' },
            results: { $last: '$results' },
            firstAt: { $first: '$at' },
            lastAt: { $last: '$at' },
          },
        },
        {
          $project: {
            _id: 0,
            term: 1,
            searches: 1,
            visitors: { $size: '$visitors' },
            results: 1,
            firstAt: 1,
            lastAt: 1,
          },
        },
        { $sort: { searches: -1, lastAt: -1 } },
        { $limit: 2000 },
      ]),
      this.searchLogModel.aggregate([
        { $match: match },
        { $group: { _id: '$visitor' } },
        { $count: 'n' },
      ]),
    ]);
    const missing = rows.filter((row) => !row.results);
    return {
      success: true,
      message: 'Success',
      data: {
        days,
        startDate,
        endDate,
        since,
        until,
        searches: rows.reduce((sum, row) => sum + row.searches, 0),
        terms: rows.length,
        visitors: people[0]?.n || 0,
        notFound: missing.length,
        notFoundSearches: missing.reduce((sum, row) => sum + row.searches, 0),
        rows,
      },
    };
  }

  /** ?startDate&endDate (Dhaka days, both inclusive) win over ?days; default is the last 30 days. */
  private range(query: any) {
    const startDate = String(query?.startDate || '');
    const endDate = String(query?.endDate || '');
    if (startDate || endDate) {
      const from = dhakaDayStart(startDate);
      const to = dhakaDayStart(endDate) + DAY_MS;
      if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate) || !Number.isFinite(from) || !Number.isFinite(to)) {
        throw new BadRequestException('Dates must look like 2026-11-07.');
      }
      if (from >= to || to - from > MAX_RANGE_DAYS * DAY_MS) {
        throw new BadRequestException('Pick a start date on or before the end date, at most 12 months apart.');
      }
      return {
        since: new Date(from),
        until: new Date(to),
        days: Math.round((to - from) / DAY_MS),
        startDate,
        endDate,
      };
    }
    const days = PERIODS.includes(Number(query?.days)) ? Number(query.days) : 30;
    const until = new Date();
    return { since: new Date(until.getTime() - days * DAY_MS), until, days, startDate: null, endDate: null };
  }
}
