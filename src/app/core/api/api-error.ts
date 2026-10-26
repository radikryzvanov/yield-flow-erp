import { HttpErrorResponse } from '@angular/common/http';

/**
 * Превращает ошибку HTTP в понятный пользователю текст.
 * Сервер присылает причину в поле `message` (строка или список строк).
 */
export function apiErrorMessage(
  error: unknown,
  fallback = 'Не удалось выполнить операцию. Попробуйте ещё раз.'
): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  if (error.status === 0) {
    return 'Нет связи с сервером. Если он только что «просыпался» (бесплатный хостинг), подождите минуту и повторите.';
  }
  if (error.status === 401) return 'Сессия истекла. Войдите снова.';
  if (error.status === 403) return 'Недостаточно прав для этого действия.';
  if (error.status === 429) return 'Слишком много запросов. Подождите минуту и повторите.';

  const message = (error.error as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string' && message.length > 0) return message;

  return fallback;
}
