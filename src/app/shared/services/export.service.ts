import { Injectable } from '@angular/core';

export type CsvCellValue = string | number | boolean | null | undefined;

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  /**
   * Экспортирует двумерный массив данных в чистый CSV (Excel-совместимый)
   * @param headers Массив заголовков колонок
   * @param rows Массив строк с данными
   * @param fileNamePrefix Префикс имени файла (к нему добавится текущая дата)
   */
  exportToCsv(
    headers: string[],
    rows: CsvCellValue[][],
    fileNamePrefix: string = 'Отчет'
  ): void {
    if (!rows || rows.length === 0) {
      return;
    }

    const cleanHeaders = headers.map(h => this.formatCell(h)).join(';');
    const cleanRows = rows.map(row =>
      row.map(cell => this.formatCell(cell)).join(';')
    );

    const csvContent = '\uFEFF' + [cleanHeaders, ...cleanRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileNamePrefix}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Очищает значение ячейки от эмодзи, мусора и экранирует спецсимволы
   */
  private formatCell(value: CsvCellValue): string {
    if (value === null || value === undefined) {
      return '""';
    }

    if (typeof value === 'number') {
      return `"${value.toString().replace('.', ',')}"`;
    }

    if (typeof value === 'boolean') {
      return value ? '"Да"' : '"Нет"';
    }

    let str = value.toString();

    // Удаляем эмодзи и спецсимволы
    str = str.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    );

    str = str.trim().replace(/"/g, '""');

    return `"${str}"`;
  }
}