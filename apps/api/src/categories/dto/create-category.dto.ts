import { IsString, MaxLength, IsOptional, IsInt, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'color must be a valid hex color (e.g. #fff or #a1b2c3)',
  })
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
