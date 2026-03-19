import { IsString, IsOptional, IsArray, IsUUID, MaxLength, MinLength, IsIn } from 'class-validator';

const STORY_CATEGORIES = [
  'career_growth',
  'got_offer',
  'switched_field',
  'side_project',
  'mentorship',
  'learning',
  'other',
] as const;

export class UpdateStoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(STORY_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsUUID()
  graphId?: string;
}
