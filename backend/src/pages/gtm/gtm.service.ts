import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { createHash } from 'crypto';

function hashPii(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}

function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw || raw === 'null') return undefined;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('88') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+88${digits.slice(1)}`;
  if (digits.length === 10) return `+880${digits}`;
  return raw;
}
import {
  AddGtmThemePageViewDto,
  AddGtmThemeViewContentDto,
} from './dto/gtm.dto';
import { UtilsService } from '../../shared/utils/utils.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { AnalyticsService } from '../../shared/analytics/analytics.service';
import { Setting } from '../customization/setting/interface/setting.interface';

@Injectable()
export class GtmService {
  private logger = new Logger(GtmService.name);

  constructor(
    @InjectModel('Setting')
    private readonly settingModel: Model<Setting>,
    private readonly analyticsService: AnalyticsService,
    private readonly utilsService: UtilsService,
  ) {}
  async getIP(req: Request): Promise<ResponsePayload> {
    try {
      const clientIpAddress = this.utilsService.getClientIp(req);
      return {
        data: {
          ip: clientIpAddress,
        },
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }
  /**
   * Saleecom theme Analytics
   * trackPageView()
   * trackContentView()
   */
  async trackThemePageView(
    req: Request,
    addGtmPageViewDto: AddGtmThemePageViewDto,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel.findOne().select('analytics');
      if (
        fSetting &&
        fSetting.analytics &&
        fSetting.analytics.facebookPixelId &&
        fSetting.analytics.facebookPixelAccessToken
      ) {
        if (
          !this.utilsService.isValidFacebookPixelId(
            fSetting.analytics.facebookPixelId,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Pixel ID',
          } as ResponsePayload;
        }

        if (
          !this.utilsService.isValidFacebookAccessTokenFormat(
            fSetting.analytics.facebookPixelAccessToken,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Access Token',
          } as ResponsePayload;
        }

        const clientIpAddress = this.utilsService.getClientIp(req);
        const clientUserAgent = req.headers['user-agent'];

        const hostname = req.hostname || '';
        console.log('Hostname: [PageView] ', hostname);
        console.log('clientIpAddress', clientIpAddress);

        const fbApiPayload: any = { ...addGtmPageViewDto };

        // Ensure user_data exists
        fbApiPayload.user_data = fbApiPayload.user_data || {};

        const pvRawPh = fbApiPayload.user_data.ph;
        const pvRawEm = fbApiPayload.user_data.em;
        fbApiPayload.user_data.ph = hashPii(normalizePhone(pvRawPh));
        fbApiPayload.user_data.em = hashPii(pvRawEm && pvRawEm !== 'null' ? pvRawEm : undefined);

        fbApiPayload.user_data.client_ip_address = clientIpAddress || undefined;
        fbApiPayload.user_data.client_user_agent = clientUserAgent || undefined;

        let payloadData = {};
        if (
          fSetting.analytics.isEnablePixelTestEvent &&
          fSetting.analytics.facebookPixelTestEventId
        ) {
          payloadData = {
            data: [fbApiPayload],
            test_event_code: fSetting.analytics.facebookPixelTestEventId,
          };
        } else {
          payloadData = { data: [fbApiPayload] };
        }
        console.log('payloadData', payloadData);
        const result = await this.analyticsService.trackFbConversionEventClient(
          fSetting.analytics.facebookPixelId,
          fSetting.analytics.facebookPixelAccessToken,
          payloadData,
        );

        console.log('result', result);
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async trackThemeViewContent(
    req: Request,
    addGtmViewContentDto: AddGtmThemeViewContentDto,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel.findOne().select('analytics');
      if (
        fSetting &&
        fSetting.analytics &&
        fSetting.analytics.facebookPixelId &&
        fSetting.analytics.facebookPixelAccessToken
      ) {
        if (
          !this.utilsService.isValidFacebookPixelId(
            fSetting.analytics.facebookPixelId,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Pixel ID',
          } as ResponsePayload;
        }

        if (
          !this.utilsService.isValidFacebookAccessTokenFormat(
            fSetting.analytics.facebookPixelAccessToken,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Access Token',
          } as ResponsePayload;
        }

        const clientIpAddress = this.utilsService.getClientIp(req);
        const clientUserAgent = req.headers['user-agent'];

        const hostname = req.hostname || '';
        console.log('Hostname: [ViewContent] ', hostname);

        const fbApiPayload: any = { ...addGtmViewContentDto };

        // Ensure user_data exists
        fbApiPayload.user_data = fbApiPayload.user_data || {};

        const vcRawPh = fbApiPayload.user_data.ph;
        const vcRawEm = fbApiPayload.user_data.em;
        fbApiPayload.user_data.ph = hashPii(normalizePhone(vcRawPh));
        fbApiPayload.user_data.em = hashPii(vcRawEm && vcRawEm !== 'null' ? vcRawEm : undefined);
        fbApiPayload.user_data.client_ip_address = clientIpAddress || undefined;
        fbApiPayload.user_data.client_user_agent = clientUserAgent || undefined;

        let payloadData = {};
        if (
          fSetting.analytics.isEnablePixelTestEvent &&
          fSetting.analytics.facebookPixelTestEventId
        ) {
          payloadData = {
            data: [fbApiPayload],
            test_event_code: fSetting.analytics.facebookPixelTestEventId,
          };
        } else {
          payloadData = { data: [fbApiPayload] };
        }

        // console.log('payloadData:', payloadData);

        const result = await this.analyticsService.trackFbConversionEventClient(
          fSetting.analytics.facebookPixelId,
          fSetting.analytics.facebookPixelAccessToken,
          payloadData,
        );
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async trackThemeAddToCart(
    req: Request,
    bodyData: any,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel.findOne().select('analytics');
      if (
        fSetting &&
        fSetting.analytics &&
        fSetting.analytics.facebookPixelId &&
        fSetting.analytics.facebookPixelAccessToken
      ) {
        if (
          !this.utilsService.isValidFacebookPixelId(
            fSetting.analytics.facebookPixelId,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Pixel ID',
          } as ResponsePayload;
        }

        if (
          !this.utilsService.isValidFacebookAccessTokenFormat(
            fSetting.analytics.facebookPixelAccessToken,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Access Token',
          } as ResponsePayload;
        }

        const clientIpAddress = this.utilsService.getClientIp(req);
        const clientUserAgent = req.headers['user-agent'];

        const hostname = req.hostname || '';
        console.log('Hostname: [AddToCart]: ', hostname);

        const fbApiPayload: any = { ...bodyData };
        // Ensure user_data exists
        fbApiPayload.user_data = fbApiPayload.user_data || {};

        const atcRawPh = fbApiPayload.user_data.ph;
        const atcRawEm = fbApiPayload.user_data.em;
        fbApiPayload.user_data.ph = hashPii(normalizePhone(atcRawPh));
        fbApiPayload.user_data.em = hashPii(atcRawEm && atcRawEm !== 'null' ? atcRawEm : undefined);

        fbApiPayload.user_data.client_ip_address = clientIpAddress || undefined;
        fbApiPayload.user_data.client_user_agent = clientUserAgent || undefined;

        let payloadData = {};
        if (
          fSetting.analytics.isEnablePixelTestEvent &&
          fSetting.analytics.facebookPixelTestEventId
        ) {
          payloadData = {
            data: [fbApiPayload],
            test_event_code: fSetting.analytics.facebookPixelTestEventId,
          };
        } else {
          payloadData = { data: [fbApiPayload] };
        }

        // console.log('fbApiPayload:', fbApiPayload);

        const result = await this.analyticsService.trackFbConversionEventClient(
          fSetting.analytics.facebookPixelId,
          fSetting.analytics.facebookPixelAccessToken,
          payloadData,
        );
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message); //
    }
  }

  async trackThemeInitialCheckout(
    req: Request,
    bodyData: any,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel.findOne().select('analytics');
      if (
        fSetting &&
        fSetting.analytics &&
        fSetting.analytics.facebookPixelId &&
        fSetting.analytics.facebookPixelAccessToken
      ) {
        if (
          !this.utilsService.isValidFacebookPixelId(
            fSetting.analytics.facebookPixelId,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Pixel ID',
          } as ResponsePayload;
        }

        if (
          !this.utilsService.isValidFacebookAccessTokenFormat(
            fSetting.analytics.facebookPixelAccessToken,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Access Token',
          } as ResponsePayload;
        }

        const clientIpAddress = this.utilsService.getClientIp(req);
        const clientUserAgent = req.headers['user-agent'];

        const hostname = req.hostname || '';
        console.log('Hostname: [InitialCheckout] ', hostname);

        const fbApiPayload: any = { ...bodyData };
        // Ensure user_data exists
        fbApiPayload.user_data = fbApiPayload.user_data || {};

        const icRawPh = fbApiPayload.user_data.ph;
        const icRawEm = fbApiPayload.user_data.em;
        const icRawFn = fbApiPayload.user_data.fn;
        const icRawLn = fbApiPayload.user_data.ln;

        fbApiPayload.user_data.ph = hashPii(normalizePhone(icRawPh));
        fbApiPayload.user_data.em = hashPii(icRawEm && icRawEm !== 'null' ? icRawEm : undefined);
        fbApiPayload.user_data.fn = hashPii(icRawFn && icRawFn !== 'null' ? icRawFn : undefined);
        fbApiPayload.user_data.ln = hashPii(icRawLn && icRawLn !== 'null' ? icRawLn : undefined);
        fbApiPayload.user_data.country = hashPii('bd');

        fbApiPayload.user_data.client_ip_address = clientIpAddress || undefined;
        fbApiPayload.user_data.client_user_agent = clientUserAgent || undefined;

        let payloadData = {};
        if (
          fSetting.analytics.isEnablePixelTestEvent &&
          fSetting.analytics.facebookPixelTestEventId
        ) {
          payloadData = {
            data: [fbApiPayload],
            test_event_code: fSetting.analytics.facebookPixelTestEventId,
          };
        } else {
          payloadData = { data: [fbApiPayload] };
        }

        const result = await this.analyticsService.trackFbConversionEventClient(
          fSetting.analytics.facebookPixelId,
          fSetting.analytics.facebookPixelAccessToken,
          payloadData,
        );
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async trackThemePurchase(
    req: Request,
    bodyData: any,
  ): Promise<ResponsePayload> {
    try {
      const fSetting = await this.settingModel.findOne().select('analytics');
      if (
        fSetting &&
        fSetting.analytics &&
        fSetting.analytics.facebookPixelId &&
        fSetting.analytics.facebookPixelAccessToken
      ) {
        if (
          !this.utilsService.isValidFacebookPixelId(
            fSetting.analytics.facebookPixelId,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Pixel ID',
          } as ResponsePayload;
        }

        if (
          !this.utilsService.isValidFacebookAccessTokenFormat(
            fSetting.analytics.facebookPixelAccessToken,
          )
        ) {
          return {
            success: false,
            message: 'Sorry! Invalid Facebook Access Token',
          } as ResponsePayload;
        }

        const clientIpAddress = this.utilsService.getClientIp(req);
        const clientUserAgent = req.headers['user-agent'];

        const hostname = req.hostname || '';
        console.log('Hostname: [Purchase] ', hostname);

        const fbApiPayload: any = { ...bodyData };
        // Ensure user_data exists
        fbApiPayload.user_data = fbApiPayload.user_data || {};

        const rawPh = fbApiPayload.user_data.ph;
        const rawEm = fbApiPayload.user_data.em;
        const rawFn = fbApiPayload.user_data.fn;
        const rawLn = fbApiPayload.user_data.ln;

        fbApiPayload.user_data.ph = hashPii(normalizePhone(rawPh));
        fbApiPayload.user_data.em = hashPii(rawEm && rawEm !== 'null' ? rawEm : undefined);
        fbApiPayload.user_data.fn = hashPii(rawFn && rawFn !== 'null' ? rawFn : undefined);
        fbApiPayload.user_data.ln = hashPii(rawLn && rawLn !== 'null' ? rawLn : undefined);
        fbApiPayload.user_data.country = hashPii('bd');
        fbApiPayload.user_data.external_id =
          fbApiPayload.user_data.external_id && fbApiPayload.user_data.external_id !== 'null'
            ? fbApiPayload.user_data.external_id
            : undefined;

        fbApiPayload.user_data.client_ip_address = clientIpAddress || undefined;
        fbApiPayload.user_data.client_user_agent = clientUserAgent || undefined;

        let payloadData = {};
        if (
          fSetting.analytics.isEnablePixelTestEvent &&
          fSetting.analytics.facebookPixelTestEventId
        ) {
          payloadData = {
            data: [fbApiPayload],
            test_event_code: fSetting.analytics.facebookPixelTestEventId,
          };
        } else {
          payloadData = { data: [fbApiPayload] };
        }

        const result = await this.analyticsService.trackFbConversionEventClient(
          fSetting.analytics.facebookPixelId,
          fSetting.analytics.facebookPixelAccessToken,
          payloadData,
        );
        // console.log('result-purchase', result);
      }

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (error) {
      console.log('err', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
