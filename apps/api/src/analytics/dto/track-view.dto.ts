import { IsUUID } from 'class-validator';

export class TrackViewDto {
  @IsUUID()
  graphId: string;
}
