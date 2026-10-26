import { IsEnum, IsOptional } from 'class-validator';
import { EggBatchStatus } from '../egg-batch.entity.js';

export class ListBatchesQuery {
  /** Показать только партии с этим статусом. */
  @IsOptional()
  @IsEnum(EggBatchStatus)
  status?: EggBatchStatus;
}
