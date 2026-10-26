import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { House } from './house.entity.js';

/** История суточных отчётов: каждый отчёт — отдельная запись, а не перезапись цифр в птичнике. */
@Entity('house_daily_reports')
export class HouseDailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_house_daily_reports_houseId')
  @Column({ type: 'uuid' })
  houseId: string;

  @ManyToOne(() => House, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'houseId',
    foreignKeyConstraintName: 'FK_house_daily_reports_house',
  })
  house: House;

  @Column({ type: 'int' })
  eggCount: number;

  @Column({ type: 'int', default: 0 })
  mortalityCount: number;

  @Column({ type: 'double precision' })
  feedPerBirdGrams: number;

  @Column({ type: 'double precision' })
  temperature: number;

  @Column({ type: 'double precision' })
  humidityPercent: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
