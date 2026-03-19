import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VacancyQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
