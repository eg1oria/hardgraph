import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Graph ID to apply with' })
  @IsUUID()
  graphId: string;

  @ApiPropertyOptional({ description: 'Cover letter (max 2000 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}
