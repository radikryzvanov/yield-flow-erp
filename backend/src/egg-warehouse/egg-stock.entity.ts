import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Категории столового яйца по ГОСТ. */
export enum EggCategory {
  Highest = 'СВ',
  Selected = 'СО',
  First = 'С1',
  Second = 'С2',
  Third = 'С3',
  Dirty = 'Грязь',
  Broken = 'Бой/Насечка',
}

/** Остаток готового яйца на складе: одна строка на категорию. */
@Entity('egg_stocks')
export class EggStock {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  category: EggCategory;

  @Column({ type: 'varchar', length: 120 })
  description: string;

  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ type: 'varchar', length: 10, default: 'шт' })
  unit: string;
}
