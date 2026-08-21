import { Entity } from '../../../core/interfaces/entity.interface';

export interface PoultryDailyLog extends Entity {
  batchId: string;         // Привязка к PoultryBatch (id)
  houseId: string;         // Привязка к PoultryHouse (id)
  date: string;            // Дата смены (YYYY-MM-DD)

  // 1. Поголовье и движение
  mortalityCount: number;  // Падёж (голов)
  cullingCount: number;    // Выбраковка / сан. убой (голов)

  // 2. Сбор яйца (вал)
  eggCount: number;        // Всего собрано яйца (штук)
  brokenEggCount?: number; // Насечка / бой в корпусе (штук)

  // 3. Кормление
  feedConsumedKg: number;  // Расход корма за сутки (кг)
  feedTypeId?: string;     // Ссылка на вид корма из Кормоцеха

  // 4. Дополнительно
  notes?: string;          // Примечания бригадира
}