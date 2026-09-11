import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CustomerType } from '@prisma/client';
import { CustomerAddressDto } from './customer-address.dto';
import { CustomerEmailDto } from './customer-email.dto';
import { CustomerPhoneDto } from './customer-phone.dto';

export class UpdateCustomerDto {
  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  middleName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  secondLastName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  identificationType?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  identificationValue?: string | null;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerEmailDto)
  emails?: CustomerEmailDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPhoneDto)
  phones?: CustomerPhoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressDto)
  addresses?: CustomerAddressDto[];
}
