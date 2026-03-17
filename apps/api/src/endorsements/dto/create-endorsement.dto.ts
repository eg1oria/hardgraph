import { IsUUID } from 'class-validator';

export class CreateEndorsementDto {
  @IsUUID()
  nodeId: string;

  @IsUUID()
  graphId: string;
}
