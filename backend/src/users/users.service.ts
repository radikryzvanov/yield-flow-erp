import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  /** Для входа: единственное место, где читается хеш пароля. */
  findByLoginWithPassword(login: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.login = :login', { login: login.trim().toLowerCase() })
      .getOne();
  }

  count(): Promise<number> {
    return this.users.count();
  }

  create(data: Pick<User, 'login' | 'passwordHash' | 'fullName' | 'role'>) {
    return this.users.save(
      this.users.create({ ...data, login: data.login.trim().toLowerCase() }),
    );
  }
}
