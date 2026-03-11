import { IsString, MaxLength, IsOptional } from 'class-validator';

export class EvolveNodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
