import { IsOptional, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportPngQueryDto {
  @ApiPropertyOptional({ description: 'PNG width in pixels (400-2400)', default: 1200 })
  @IsOptional()
  @IsNumberString()
  width?: string;
}
