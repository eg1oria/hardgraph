import { IsString, MaxLength, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateGraphDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  theme?: string;

  @IsOptional()
  @IsObject()
  customStyles?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  viewport?: Record<string, unknown>;
}
