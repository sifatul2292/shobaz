import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { Cache } from 'cache-manager';
import { AdditionalPage } from '../../interfaces/core/additional-page.interface';
import {
  AddAdditionalPageDto,
  UpdateAdditionalPageDto,
} from '../../dto/additional-page.dto';

const ObjectId = Types.ObjectId;

@Injectable()
export class AdditionalPageService {
  private logger = new Logger(AdditionalPageService.name);
  // Cache
  private readonly cacheAllData = 'getAllAdditionalPage';
  private readonly cacheDataCount = 'getCountAdditionalPage';

  constructor(
    @InjectModel('AdditionalPage')
    private readonly additionalPageModel: Model<AdditionalPage>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * getAllAdditionalPages (public endpoint — no auth required)
   */
  async getAllAdditionalPages(
    filter?: Partial<{
      showInFooter: boolean;
      showInHeader: boolean;
      isActive: boolean;
    }>,
  ): Promise<ResponsePayload> {
    try {
      const query: any = {};
      if (filter?.showInFooter !== undefined) query.showInFooter = filter.showInFooter;
      if (filter?.showInHeader !== undefined) query.showInHeader = filter.showInHeader;
      if (filter?.isActive !== undefined) query.isActive = filter.isActive;
      const data = await this.additionalPageModel
        .find(query)
        .select(
          'name slug content description isHtml isActive showInFooter showInHeader footerGroup headerOrder footerOrder menuLabel',
        )
        .sort({ footerOrder: 1, headerOrder: 1 });
      return { success: true, message: 'Success', data } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * addAdditionalPage
   * insertManyAdditionalPage
   */
  async addAdditionalPage(
    addAdditionalPageDto: AddAdditionalPageDto,
  ): Promise<ResponsePayload> {
    try {
      const pageInfo = await this.additionalPageModel.findOne({
        slug: addAdditionalPageDto.slug,
      });

      let result: ResponsePayload;

      if (pageInfo) {
        await this.additionalPageModel.findOneAndUpdate(
          { slug: addAdditionalPageDto.slug },
          {
            $set: addAdditionalPageDto,
          },
        );
        result = {
          success: true,
          message: 'Data Updated Success',
          data: null,
        } as ResponsePayload;
      } else {
        const newData = new this.additionalPageModel(addAdditionalPageDto);
        const saveData = await newData.save();
        const data = {
          _id: saveData._id,
        };
        result = {
          success: true,
          message: 'Data Added Success',
          data,
        } as ResponsePayload;
      }

      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return result;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * getAdditionalPageBySlug
   */
  async getAdditionalPageBySlug(
    slug: string,
    select: string,
  ): Promise<ResponsePayload> {
    try {
      const data = await this.additionalPageModel
        .findOne({ slug })
        .select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * updateAdditionalPageBySlug (also accepts MongoDB _id)
   * updateMultipleAdditionalPageById
   */
  async updateAdditionalPageBySlug(
    slug: string,
    updateAdditionalPageDto: UpdateAdditionalPageDto,
  ): Promise<ResponsePayload> {
    let data;
    try {
      // find by _id if slug looks like an ObjectId, else find by slug
      const isObjectId = /^[a-f\d]{24}$/i.test(slug);
      data = isObjectId
        ? await this.additionalPageModel.findById(slug)
        : await this.additionalPageModel.findOne({ slug });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
    if (!data) {
      throw new NotFoundException('No Data found!');
    }
    try {
      const isObjectId = /^[a-f\d]{24}$/i.test(slug);
      if (isObjectId) {
        await this.additionalPageModel.findByIdAndUpdate(slug, {
          $set: updateAdditionalPageDto,
        });
      } else {
        await this.additionalPageModel.findOneAndUpdate(
          { slug },
          {
            $set: updateAdditionalPageDto,
          },
        );
      }
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  /**
   * deleteAdditionalPageById
   * deleteMultipleAdditionalPageById
   */
  async deleteAdditionalPageBySlug(
    slug: string,
    checkUsage: boolean,
  ): Promise<ResponsePayload> {
    try {
      await this.additionalPageModel.findOneAndDelete({ slug });
      // Cache Removed
      await this.cacheManager.del(this.cacheAllData);
      await this.cacheManager.del(this.cacheDataCount);

      return {
        success: true,
        message: 'Success',
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
