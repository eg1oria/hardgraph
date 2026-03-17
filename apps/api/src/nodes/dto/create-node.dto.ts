import {
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsObject,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateNodeDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsNumber()
  @Min(-50000)
  @Max(50000)
  positionX: number;

  @IsNumber()
  @Min(-50000)
  @Max(50000)
  positionY: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nodeType?: string;

  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isUnlocked?: boolean;
}
