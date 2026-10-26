import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { House } from '../houses/house.entity.js';
import { EggCategory } from './egg-stock.entity.js';

export enum EggBatchStatus {
  Pending = 'pending', // ждёт сортировки
  Sorted = 'sorted', // рассортирована
}

/** Результат сортировки: сколько яиц попало в каждую категорию. */
export interface SortedYieldRow {
  category: EggCategory;
  count: number;
}

/** Партия валового (несортированного) яйца, поступившая из птичника. */
@Entity('egg_batches')
export class EggBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Птичник-источник. Если птичник удалят, партия останется, а ссылка обнулится. */
  @Column({ type: 'uuid', nullable: true })
  houseId: string | null;

  @ManyToOne(() => House, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'houseId',
    foreignKeyConstraintName: 'FK_egg_batches_house',
  })
  house: House | null;

  /** Название птичника на момент приёмки (сохраняется как есть, даже если птичник переименуют). */
  @Column({ type: 'varchar', length: 120 })
  houseName: string;

  @Column({ type: 'int' })
  rawEggCount: number;

  @Column({ type: 'varchar', length: 10, default: EggBatchStatus.Pending })
  status: EggBatchStatus;

  @Column({ type: 'jsonb', nullable: true })
  sortedYield: SortedYieldRow[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sortedAt: Date | null;
}
