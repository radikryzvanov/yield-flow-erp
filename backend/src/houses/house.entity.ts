import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BirdType {
  Layer = 'layer', // несушка
  Broiler = 'broiler', // бройлер
  Rearing = 'rearing', // ремонтный молодняк
}

export enum HouseStatus {
  Active = 'active',
  Quarantine = 'quarantine',
  Cleaning = 'cleaning',
}

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  birdType: BirdType;

  @Column({ type: 'varchar', length: 60 })
  crossType: string;

  @Column({ type: 'int' })
  ageDays: number;

  @Column({ type: 'varchar', length: 20, default: HouseStatus.Active })
  status: HouseStatus;

  @Column({ type: 'int' })
  birdCount: number;

  @Column({ type: 'int' })
  initialBirdCount: number;

  @Column({ type: 'int', default: 0 })
  dailyEggCount: number;

  @Column({ type: 'double precision', default: 0 })
  actualLayingRatePercent: number;

  @Column({ type: 'double precision', default: 0 })
  targetLayingRatePercent: number;

  @Column({ type: 'double precision', default: 0 })
  feedPerBirdGrams: number;

  @Column({ type: 'double precision', default: 0 })
  targetFeedGrams: number;

  @Column({ type: 'double precision', default: 21 })
  temperature: number;

  @Column({ type: 'double precision', default: 21 })
  targetTemperature: number;

  @Column({ type: 'double precision', default: 60 })
  humidityPercent: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
