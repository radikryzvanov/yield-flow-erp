import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DailyReportDto {
  /** Собрано яиц за сутки. Только для птичников несушек. */
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  eggCount: number;

  /** Падёж за сутки, голов. По умолчанию 0. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  mortalityCount?: number;

  /** Расход корма, г на голову. Если не указан — берётся прежнее значение птичника. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  feedPerBirdGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(60)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityPercent?: number;
}
