import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class ForkGraphDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsBoolean()
  includeEdges?: boolean; // default: true
}
