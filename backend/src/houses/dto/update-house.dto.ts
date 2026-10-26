import { PartialType } from '@nestjs/swagger';
import { CreateHouseDto } from './create-house.dto.js';

/** Все поля необязательны: можно прислать только то, что меняется. */
export class UpdateHouseDto extends PartialType(CreateHouseDto) {}
