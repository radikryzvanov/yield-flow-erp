import { IsInt, Max, Min } from 'class-validator';

/** Используется и для приёма молодняка, и для убытия птицы. */
export class BirdsCountDto {
  /** Количество голов, больше нуля. */
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  birdsCount: number;
}
