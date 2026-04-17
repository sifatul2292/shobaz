import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class AddRedirectUrlDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  fromUrl: string;

  @IsOptional()
  @IsString()
  toUrl: string;
}

export class FilterRedirectUrlDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  visibility: boolean;
}

export class OptionRedirectUrlDto {
  @IsOptional()
  @IsBoolean()
  deleteMany: boolean;
}

export class UpdateRedirectUrlDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  fromUrl: string;

  @IsOptional()
  @IsString()
  toUrl: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  ids: string[];
}

export class FilterAndPaginationRedirectUrlDto {
  @IsOptional()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterRedirectUrlDto)
  filter: FilterRedirectUrlDto;

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
