import { BirdType, HouseStatus } from '../houses/house.entity.js';
import { EggCategory } from '../egg-warehouse/egg-stock.entity.js';

/** Демо-птичники — те же цифры, что раньше хранились в браузере. */
export const DEMO_HOUSES = [
  {
    name: 'Птичник № 1 (Промышленная несушка)',
    birdType: BirdType.Layer,
    crossType: 'Ломанн Браун',
    ageDays: 196,
    status: HouseStatus.Active,
    birdCount: 52000,
    initialBirdCount: 53500,
    dailyEggCount: 50199,
    actualLayingRatePercent: 96.5,
    targetLayingRatePercent: 95,
    feedPerBirdGrams: 118,
    targetFeedGrams: 115,
    temperature: 21.4,
    targetTemperature: 21,
    humidityPercent: 62,
  },
  {
    name: 'Птичник № 2 (Промышленная несушка)',
    birdType: BirdType.Layer,
    crossType: 'Декалб Белый',
    ageDays: 238,
    status: HouseStatus.Active,
    birdCount: 43200,
    initialBirdCount: 44000,
    dailyEggCount: 41035,
    actualLayingRatePercent: 95,
    targetLayingRatePercent: 94,
    feedPerBirdGrams: 116,
    targetFeedGrams: 115,
    temperature: 20.8,
    targetTemperature: 21,
    humidityPercent: 65,
  },
  {
    name: 'Птичник № 3 (Ремонтный молодняк)',
    birdType: BirdType.Rearing,
    crossType: 'Ломанн Браун',
    ageDays: 84,
    status: HouseStatus.Active,
    birdCount: 38000,
    initialBirdCount: 38500,
    dailyEggCount: 0,
    actualLayingRatePercent: 0,
    targetLayingRatePercent: 0,
    feedPerBirdGrams: 75,
    targetFeedGrams: 75,
    temperature: 22.5,
    targetTemperature: 22,
    humidityPercent: 58,
  },
  {
    name: 'Птичник № 4 (Мясной бройлер)',
    birdType: BirdType.Broiler,
    crossType: 'Росс 308',
    ageDays: 35,
    status: HouseStatus.Active,
    birdCount: 22000,
    initialBirdCount: 22400,
    dailyEggCount: 0,
    actualLayingRatePercent: 0,
    targetLayingRatePercent: 0,
    feedPerBirdGrams: 155,
    targetFeedGrams: 155,
    temperature: 21,
    targetTemperature: 21,
    humidityPercent: 60,
  },
];

/** Начальные остатки готового яйца на складе. */
export const DEMO_STOCKS = [
  { category: EggCategory.Highest, description: 'Высшая категория (>75г)', count: 18400 },
  { category: EggCategory.Selected, description: 'Отборное яйцо (65-74.9г)', count: 142000 },
  { category: EggCategory.First, description: 'Первая категория (55-64.9г)', count: 215000 },
  { category: EggCategory.Second, description: 'Вторая категория (45-54.9г)', count: 48000 },
  { category: EggCategory.Broken, description: 'Технический брак / меланж', count: 6200 },
];

/** Две партии валового яйца, ожидающие сортировки (по номерам птичников). */
export const DEMO_PENDING_BATCHES = [
  { houseIndex: 0, rawEggCount: 50199 },
  { houseIndex: 1, rawEggCount: 41035 },
];
