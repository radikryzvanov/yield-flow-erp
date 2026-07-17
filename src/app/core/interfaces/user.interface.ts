export type UserRole = 'admin' | 'brigadier' | 'accountant' | 'driver';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
} 