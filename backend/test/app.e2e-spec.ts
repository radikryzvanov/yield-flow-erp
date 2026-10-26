import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/app.setup.js';

/**
 * Сквозные тесты: поднимается настоящее приложение и настоящая PostgreSQL.
 * Настройки окружения задаются в test/e2e-setup.ts (там же защита от запуска не на тестовой базе).
 */
const ADMIN_LOGIN = process.env.ADMIN_LOGIN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

async function wipeDatabase(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();
}

async function createApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>();
  setupApp(app);
  await app.init();
  return app;
}

describe('API птицефабрики (e2e)', () => {
  let app: NestExpressApplication;
  let token: string;
  const api = () => request(app.getHttpServer());
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    await wipeDatabase();
    app = await createApp();
    const res = await api()
      .post('/api/auth/login')
      .send({ login: ADMIN_LOGIN, password: ADMIN_PASSWORD });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // Каждый тест начинает с одинаковых демо-данных, поэтому тесты не зависят друг от друга.
  beforeEach(async () => {
    await auth(api().post('/api/demo/reset')).expect(200);
  });

  const getHouses = async () =>
    (await auth(api().get('/api/houses')).expect(200)).body as any[];
  const houseByNumber = async (n: number) =>
    (await getHouses()).find((h) => h.name.includes(`№ ${n}`));

  describe('вход и защита', () => {
    it('без токена доступ закрыт (401)', async () => {
      await api().get('/api/houses').expect(401);
      await api().get('/api/egg-warehouse/stocks').expect(401);
    });

    it('подделанный токен не принимается', async () => {
      await api()
        .get('/api/houses')
        .set('Authorization', 'Bearer abc.def.ghi')
        .expect(401);
    });

    it('неверный пароль и неизвестный логин дают одинаковый ответ', async () => {
      const wrongPassword = await api()
        .post('/api/auth/login')
        .send({ login: ADMIN_LOGIN, password: 'wrong-password' })
        .expect(401);
      const unknownLogin = await api()
        .post('/api/auth/login')
        .send({ login: 'nobody', password: 'wrong-password' })
        .expect(401);
      expect(wrongPassword.body.message).toBe(unknownLogin.body.message);
    });

    it('вход возвращает токен и данные пользователя без пароля', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ login: 'ADMIN', password: ADMIN_PASSWORD })
        .expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({ login: 'admin', role: 'admin' });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/i);
    });

    it('/auth/me возвращает текущего пользователя', async () => {
      const res = await auth(api().get('/api/auth/me')).expect(200);
      expect(res.body.login).toBe('admin');
    });

    it('адрес /health открыт без токена', async () => {
      await api().get('/api/health').expect(200);
    });
  });

  describe('птичники', () => {
    it('отдаёт 4 демо-птичника с числами (а не строками)', async () => {
      const houses = await getHouses();
      expect(houses).toHaveLength(4);
      expect(typeof houses[0].birdCount).toBe('number');
      expect(typeof houses[0].temperature).toBe('number');
    });

    it('суточный отчёт пересчитывает поголовье и яйценоскость', async () => {
      const house = await houseByNumber(1);
      const res = await auth(
        api().post(`/api/houses/${house.id}/daily-reports`),
      )
        .send({ eggCount: 50000, mortalityCount: 100, feedPerBirdGrams: 117 })
        .expect(201);
      expect(res.body.birdCount).toBe(51900);
      expect(res.body.dailyEggCount).toBe(50000);
      expect(res.body.actualLayingRatePercent).toBe(96.3);
      expect(res.body.feedPerBirdGrams).toBe(117);

      const history = await auth(
        api().get(`/api/houses/${house.id}/daily-reports`),
      ).expect(200);
      expect(history.body).toHaveLength(1);
    });

    it('отклоняет падёж больше поголовья', async () => {
      const house = await houseByNumber(1);
      await auth(api().post(`/api/houses/${house.id}/daily-reports`))
        .send({ eggCount: 10, mortalityCount: 999999 })
        .expect(400);
    });

    it('не принимает яйцо у молодняка и бройлеров', async () => {
      const rearing = await houseByNumber(3);
      await auth(api().post(`/api/houses/${rearing.id}/daily-reports`))
        .send({ eggCount: 5 })
        .expect(400);
    });

    it('отклоняет отрицательные числа и лишние поля', async () => {
      const house = await houseByNumber(1);
      const url = `/api/houses/${house.id}/daily-reports`;
      await auth(api().post(url)).send({ eggCount: -1 }).expect(400);
      await auth(api().post(url)).send({ eggCount: 1, hack: 'x' }).expect(400);
    });

    it('принимает молодняк: растут и текущее, и начальное поголовье', async () => {
      const house = await houseByNumber(3);
      const res = await auth(api().post(`/api/houses/${house.id}/receive-flock`))
        .send({ birdsCount: 1000 })
        .expect(200);
      expect(res.body.birdCount).toBe(house.birdCount + 1000);
      expect(res.body.initialBirdCount).toBe(house.initialBirdCount + 1000);
    });

    it('убытие птицы не обнуляет сбор яиц', async () => {
      const house = await houseByNumber(1);
      const res = await auth(api().post(`/api/houses/${house.id}/remove-birds`))
        .send({ birdsCount: 500 })
        .expect(200);
      expect(res.body.birdCount).toBe(house.birdCount - 500);
      expect(res.body.dailyEggCount).toBe(house.dailyEggCount);
    });

    it('нельзя убрать больше птицы, чем есть', async () => {
      const house = await houseByNumber(4);
      await auth(api().post(`/api/houses/${house.id}/remove-birds`))
        .send({ birdsCount: house.birdCount + 1 })
        .expect(400);
    });

    it('создаёт, изменяет и удаляет птичник', async () => {
      const created = await auth(api().post('/api/houses'))
        .send({
          name: 'Тестовый птичник',
          birdType: 'layer',
          crossType: 'Тест',
          ageDays: 10,
          birdCount: 100,
        })
        .expect(201);
      expect(created.body.initialBirdCount).toBe(100);
      expect(created.body.status).toBe('active');

      const patched = await auth(api().patch(`/api/houses/${created.body.id}`))
        .send({ name: 'Переименован' })
        .expect(200);
      expect(patched.body.name).toBe('Переименован');

      await auth(api().delete(`/api/houses/${created.body.id}`)).expect(204);
      await auth(api().get(`/api/houses/${created.body.id}`)).expect(404);
    });

    it('плохой id даёт 400, несуществующий — 404', async () => {
      await auth(api().get('/api/houses/not-a-uuid')).expect(400);
      await auth(
        api().get('/api/houses/00000000-0000-4000-8000-000000000000'),
      ).expect(404);
    });
  });

  describe('склад яйца', () => {
    const summary = async () =>
      (await auth(api().get('/api/egg-warehouse/summary')).expect(200)).body;

    it('показывает исходные итоги демо-склада', async () => {
      expect(await summary()).toEqual({
        totalStockEggs: 429600,
        totalPendingRawEggs: 91234,
      });
    });

    it('принимает партию и сортирует её в остатки', async () => {
      const house = await houseByNumber(1);
      const batch = await auth(api().post('/api/egg-warehouse/batches'))
        .send({ houseId: house.id, rawEggCount: 10000 })
        .expect(201);
      expect(batch.body.status).toBe('pending');
      expect(batch.body.houseName).toBe(house.name);

      const sorted = await auth(
        api().post(`/api/egg-warehouse/batches/${batch.body.id}/sort`),
      ).expect(200);
      expect(sorted.body.status).toBe('sorted');
      const counts = sorted.body.sortedYield.map((r: any) => r.count);
      expect(counts).toEqual([500, 3500, 4500, 1100, 400]);

      expect(await summary()).toEqual({
        totalStockEggs: 429600 + 10000,
        totalPendingRawEggs: 91234,
      });
    });

    it('повторная сортировка той же партии даёт 409 и не меняет остатки', async () => {
      const batches = (
        await auth(api().get('/api/egg-warehouse/batches?status=pending')).expect(200)
      ).body;
      const id = batches[0].id;
      await auth(api().post(`/api/egg-warehouse/batches/${id}/sort`)).expect(200);
      const before = await summary();
      await auth(api().post(`/api/egg-warehouse/batches/${id}/sort`)).expect(409);
      expect(await summary()).toEqual(before);
    });

    it('10 одновременных нажатий «сортировать»: яйцо добавляется ровно один раз', async () => {
      const id = (
        await auth(api().get('/api/egg-warehouse/batches?status=pending')).expect(200)
      ).body[0].id;
      const before = await summary();

      // Много запросов одновременно, чтобы они гарантированно пересеклись во времени.
      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          auth(api().post(`/api/egg-warehouse/batches/${id}/sort`)),
        ),
      );
      const statuses = responses.map((r) => r.status);
      expect(statuses.filter((s) => s === 200)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(9);

      const winner = responses.find((r) => r.status === 200)!;
      const sortedTotal = winner.body.sortedYield.reduce(
        (sum: number, r: any) => sum + r.count,
        0,
      );
      expect(sortedTotal).toBe(winner.body.rawEggCount);
      expect((await summary()).totalStockEggs).toBe(
        before.totalStockEggs + sortedTotal,
      );
    });

    it('фильтр по статусу и проверка неверного статуса', async () => {
      const pending = await auth(
        api().get('/api/egg-warehouse/batches?status=pending'),
      ).expect(200);
      expect(pending.body).toHaveLength(2);
      await auth(api().get('/api/egg-warehouse/batches?status=bogus')).expect(400);
    });

    it('партия без существующего птичника не принимается', async () => {
      await auth(api().post('/api/egg-warehouse/batches'))
        .send({
          houseId: '00000000-0000-4000-8000-000000000000',
          rawEggCount: 10,
        })
        .expect(404);
    });

    it('остатки по категориям приходят числами', async () => {
      const res = await auth(api().get('/api/egg-warehouse/stocks')).expect(200);
      expect(res.body).toHaveLength(5);
      expect(typeof res.body[0].count).toBe('number');
    });
  });

  describe('схема базы', () => {
    it('таблицы в базе в точности соответствуют сущностям (нет забытых миграций)', async () => {
      const dataSource = app.get(DataSource);
      const diff = await dataSource.driver.createSchemaBuilder().log();
      expect(diff.upQueries.map((q) => q.query)).toEqual([]);
    });
  });

  describe('документация', () => {
    it('Swagger-описание API доступно и содержит основные адреса', async () => {
      const res = await api().get('/api/docs-json').expect(200);
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining([
          '/api/auth/login',
          '/api/houses',
          '/api/egg-warehouse/batches/{id}/sort',
        ]),
      );
    });
  });
});

describe('ограничение попыток входа (e2e)', () => {
  it('после 5 неудачных попыток в минуту отвечает 429', async () => {
    const app = await createApp();
    const login = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ login: ADMIN_LOGIN, password: 'wrong-password-1' });

    for (let i = 0; i < 5; i++) await login().expect(401);
    await login().expect(429);
    await app.close();
  });
});
