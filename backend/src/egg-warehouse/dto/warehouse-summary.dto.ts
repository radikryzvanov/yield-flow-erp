export class WarehouseSummaryDto {
  /** Всего рассортированного товарного яйца на складе, шт. */
  totalStockEggs: number;

  /** Сколько валового яйца ждёт сортировки, шт. */
  totalPendingRawEggs: number;
}
