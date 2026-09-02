import { signal, effect, WritableSignal, inject, Injector, runInInjectionContext } from '@angular/core';

export function persistedSignal<T>(
  key: string,
  initialValue: T,
  options?: { injector?: Injector }
): WritableSignal<T> {
  const getStoredValue = (): T => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return initialValue;
      }
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (e) {
      console.warn(`[persistedSignal] Не удалось прочитать ключ "${key}":`, e);
      return initialValue;
    }
  };

  const sig = signal<T>(getStoredValue());
  const injector = options?.injector ?? inject(Injector, { optional: true });

  const setupEffect = () => {
    effect(() => {
      try {
        const val = sig();
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, JSON.stringify(val));
        }
      } catch (e) {
        console.warn(`[persistedSignal] Не удалось сохранить ключ "${key}":`, e);
      }
    });
  };

  if (injector) {
    runInInjectionContext(injector, setupEffect);
  } else {
    setupEffect();
  }

  return sig;
}