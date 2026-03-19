import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VacancySkillDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  level: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  categoryColor?: string;
}

export class CreateVacancyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  salaryRange?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VacancySkillDto)
  skills: VacancySkillDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
