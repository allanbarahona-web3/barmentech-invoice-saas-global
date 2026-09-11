import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CustomerType } from '@prisma/client';
import { CustomerAddressDto } from './customer-address.dto';
import { CustomerEmailDto } from './customer-email.dto';
import { CustomerPhoneDto } from './customer-phone.dto';

export class CreateCustomerDto {
  @IsEnum(CustomerType)
  type!: CustomerType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  displayName!: string;

  @ValidateIf((dto: CreateCustomerDto) => dto.type === CustomerType.PERSON)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  middleName?: string | null;

  @ValidateIf((dto: CreateCustomerDto) => dto.type === CustomerType.PERSON)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  lastName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  secondLastName?: string | null;

  @ValidateIf((dto: CreateCustomerDto) => dto.type === CustomerType.ORGANIZATION)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'IDENTIFICATION_REQUIRED' })
  @MaxLength(100)
  identificationType!: string;

  @IsString()
  @IsNotEmpty({ message: 'IDENTIFICATION_REQUIRED' })
  @MaxLength(200)
  identificationValue!: string;

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
