import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает метод контроллера как открытый: токен входа не требуется. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
