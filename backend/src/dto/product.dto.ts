import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class AddProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  nameEn: string;

  @IsOptional()
  quantity: number;
}

export class FilterProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  visibility: boolean;

  @IsOptional()
  quantity: any;

  @IsOptional()
  @IsNumber()
  price: number;
}

export class FilterProductGroupDto {
  @IsOptional()
  @IsBoolean()
  isGroup: boolean;

  @IsOptional()
  @IsBoolean()
  category: boolean;

  @IsOptional()
  @IsBoolean()
  subCategory: boolean;

  @IsOptional()
  @IsBoolean()
  brand: boolean;

  @IsOptional()
  @IsBoolean()
  publisher: boolean;
}

export class OptionProductDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateProductDto {
  @IsOptional() name: string;
  @IsOptional() nameEn: string;
  @IsOptional() slug: string;
  @IsOptional() description: string;
  @IsOptional() shortDescription: string;
  @IsOptional() tagline: string;
  @IsOptional() taglineEn: string;
  @IsOptional() featureTitle: string;
  @IsOptional() costPrice: number;
  @IsOptional() salePrice: number;
  @IsOptional() dollarPrice: number;
  @IsOptional() regularPrice: number;
  @IsOptional() tax: number;
  @IsOptional() hasTax: boolean;
  @IsOptional() sku: string;
  @IsOptional() isbn: string;
  @IsOptional() pdfFile: string;
  @IsOptional() previewPdfUrl: string;
  @IsOptional() edition: string;
  @IsOptional() editionEn: string;
  @IsOptional() emiMonth: number[];
  @IsOptional() discountType: number;
  @IsOptional() discountAmount: number;
  @IsOptional() afterDiscountPrice: number;
  @IsOptional() emiAmount: number;
  @IsOptional() images: string[];
  @IsOptional() quantity: number;
  @IsOptional() threeMonth: number;
  @IsOptional() sixMonth: number;
  @IsOptional() twelveMonth: number;
  @IsOptional() totalPages: number;
  @IsOptional() currentVersion: string;
  @IsOptional() currentVersionEn: string;
  @IsOptional() publishedDate: Date;
  @IsOptional() language: string[];
  @IsOptional() country: string;
  @IsOptional() translatorName: string[];
  @IsOptional() translatorNameEn: string[];
  @IsOptional() cartLimit: number;
  @IsOptional() weight: number;
  @IsOptional() trackQuantity: boolean;
  @IsOptional() isFacebookCatalog: boolean;
  @IsOptional() status: string;
  @IsOptional() videoUrl: string;
  @IsOptional() unit: string;
  @IsOptional() priority: number;
  @IsOptional() isPreOrder: boolean;
  @IsOptional() earnPoint: boolean;
  @IsOptional() pointType: number;
  @IsOptional() pointValue: number;
  @IsOptional() redeemPoint: boolean;
  @IsOptional() redeemType: number;
  @IsOptional() redeemValue: number;
  @IsOptional() seoTitle: string;
  @IsOptional() seoDescription: string;
  @IsOptional() seoKeywords: string;
  @IsOptional() category: any;
  @IsOptional() subCategory: any;
  @IsOptional() publisher: any;
  @IsOptional() author: any;
  @IsOptional() brand: any;
  @IsOptional() tags: any[];
  @IsOptional() specifications: any[];
  @IsOptional() features: any[];
  @IsOptional() variations: any[];
  @IsOptional() variationsOptions: any[];
  @IsOptional() hasVariations: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(3) boughtTogetherIds: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMinSize(1) @ArrayMaxSize(50) ids: string[];
}

export class GetProductByIdsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class FilterAndPaginationProductDto {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductDto)
  filter: FilterProductDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterProductGroupDto)
  filterGroup: FilterProductGroupDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  sort: object;

  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  select: any;
}

export class ProductFilterCatalogDto {
  @IsOptional()
  @IsBoolean()
  category: boolean;

  @IsOptional()
  @IsBoolean()
  brand: boolean;

  @IsOptional()
  @IsBoolean()
  tag: boolean;

  @IsOptional()
  @IsBoolean()
  subCategory: boolean;

  @IsOptional()
  @IsBoolean()
  rating: boolean;
}
