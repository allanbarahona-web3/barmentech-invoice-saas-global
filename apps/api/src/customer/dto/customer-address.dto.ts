import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerAddressPurposeDto } from './customer-address-purpose.dto';

export class CustomerAddressDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressPurposeDto)
  purposes!: CustomerAddressPurposeDto[];

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  region?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine1?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine2?: string | null;

}
