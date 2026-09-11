import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CustomerEmailDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string | null;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isBilling?: boolean;
}
