import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateEdgeDto {
  @IsUUID()
  sourceNodeId: string;

  @IsUUID()
  targetNodeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  edgeType?: string;
}
