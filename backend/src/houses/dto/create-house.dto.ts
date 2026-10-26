import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BirdType, HouseStatus } from '../house.entity.js';

export class CreateHouseDto {
  /** Название корпуса, например «Птичник № 5 (Промышленная несушка)». */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEnum(BirdType)
  birdType: BirdType;

  /** Кросс птицы, например «Ломанн Браун». */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  crossType: string;

  /** Возраст стада в днях. */
  @IsInt()
  @Min(0)
  @Max(2000)
  ageDays: number;

  /** Текущее поголовье. */
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  birdCount: number;

  @IsOptional()
  @IsEnum(HouseStatus)
  status?: HouseStatus;

  /** Поголовье при посадке. Если не указано — равно текущему. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  initialBirdCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetLayingRatePercent?: number;

  /** Фактический расход корма, г на голову в сутки. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  feedPerBirdGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  targetFeedGrams?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(60)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(-50)
  @Max(60)
  targetTemperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityPercent?: number;
}
