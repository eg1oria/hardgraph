import {
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateNodeDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsNumber()
  positionX: number;

  @IsNumber()
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
