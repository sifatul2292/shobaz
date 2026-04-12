import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNotEmpty,
  IsNotEmptyObject, IsNumber, IsObject, IsOptional, IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class AddAdditionalPageDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() slug: string;
  @IsOptional() @IsString() content: string;
  @IsOptional() @IsString() description: string;
  @IsOptional() isHtml: boolean;
  @IsOptional() isActive: boolean;
  @IsOptional() showInFooter: boolean;
  @IsOptional() showInHeader: boolean;
  @IsOptional() @IsString() footerGroup: string;
  @IsOptional() @IsNumber() headerOrder: number;
  @IsOptional() @IsNumber() footerOrder: number;
  @IsOptional() @IsString() menuLabel: string;
}

export class FilterAdditionalPageDto {
  @IsOptional() @IsString() name: string;
  @IsOptional() showInFooter: boolean;
  @IsOptional() showInHeader: boolean;
}

export class OptionAdditionalPageDto {
  @IsOptional() @IsBoolean() deleteMany: boolean;
}

export class UpdateAdditionalPageDto {
  @IsOptional() @IsString() name: string;
  @IsOptional() @IsString() slug: string;
  @IsOptional() @IsString() content: string;
  @IsOptional() @IsString() description: string;
  @IsOptional() isHtml: boolean;
  @IsOptional() isActive: boolean;
  @IsOptional() showInFooter: boolean;
  @IsOptional() showInHeader: boolean;
  @IsOptional() @IsString() footerGroup: string;
  @IsOptional() @IsNumber() headerOrder: number;
  @IsOptional() @IsNumber() footerOrder: number;
  @IsOptional() @IsString() menuLabel: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMinSize(1) @ArrayMaxSize(50) ids: string[];
}

export class FilterAndPaginationAdditionalPageDto {
  @IsOptional() @IsNotEmptyObject() @IsObject() @ValidateNested() @Type(() => FilterAdditionalPageDto)
  filter: FilterAdditionalPageDto;
  @IsOptional() @IsNotEmptyObject() @IsObject() @ValidateNested() @Type(() => PaginationDto)
  pagination: PaginationDto;
  @IsOptional() @IsNotEmptyObject() @IsObject() sort: object;
  @IsOptional() @IsNotEmptyObject() @IsObject() select: any;
}
