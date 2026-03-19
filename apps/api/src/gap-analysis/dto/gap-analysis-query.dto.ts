import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GapAnalysisTargetsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;
}
