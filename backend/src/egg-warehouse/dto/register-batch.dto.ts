import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class RegisterBatchDto {
  /** Птичник, из которого пришло яйцо. */
  @IsUUID()
  houseId: string;

  /** Количество валового яйца, штук. */
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  rawEggCount: number;
}
