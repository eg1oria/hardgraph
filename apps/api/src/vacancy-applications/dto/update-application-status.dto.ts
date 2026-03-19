import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    description: 'New status',
    enum: ['reviewing', 'shortlisted', 'rejected', 'accepted'],
  })
  @IsString()
  @IsIn(['reviewing', 'shortlisted', 'rejected', 'accepted'])
  status: string;

  @ApiPropertyOptional({ description: 'HR note about the candidate' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hrNote?: string;
}
