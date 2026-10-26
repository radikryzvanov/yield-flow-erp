import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  Admin = 'admin',
  Director = 'director',
  Zootechnician = 'zootechnician',
  Accountant = 'accountant',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Логин хранится в нижнем регистре, чтобы «Admin» и «admin» были одним человеком. */
  @Column({ type: 'varchar', length: 64, unique: true })
  login: string;

  /** Хеш пароля. select:false — по умолчанию из базы не читается, чтобы не утечь в ответ API. */
  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.Admin })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
