import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CustomerAddressPurpose } from '@prisma/client';

export class CustomerAddressPurposeDto {
  @IsEnum(CustomerAddressPurpose)
  purpose!: CustomerAddressPurpose;

  @IsOptional()
  @IsBoolean()
  isPrimaryForPurpose?: boolean;
}
