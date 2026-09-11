import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CustomerPhoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  phone!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
