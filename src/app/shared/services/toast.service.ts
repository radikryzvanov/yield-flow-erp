import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _messages = signal<ToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();
  private counter = 0;

  show(text: string, type: 'success' | 'error' | 'info' = 'success'): void {
    const id = ++this.counter;
    this._messages.update(list => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  dismiss(id: number): void {
    this._messages.update(list => list.filter(m => m.id !== id));
  }
}