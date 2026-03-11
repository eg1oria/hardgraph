import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateGraphDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  theme?: string;
}
