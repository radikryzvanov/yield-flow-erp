import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Первая миграция: создаёт все таблицы этапа 1.
 * Идентификаторы генерирует сама база (gen_random_uuid встроена в PostgreSQL 13+).
 */
export class InitSchema1761480000000 implements MigrationInterface {
  name = 'InitSchema1761480000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "login" character varying(64) NOT NULL,
        "passwordHash" character varying(100) NOT NULL,
        "fullName" character varying(120) NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'admin',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_login" UNIQUE ("login"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "houses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "birdType" character varying(20) NOT NULL,
        "crossType" character varying(60) NOT NULL,
        "ageDays" integer NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "birdCount" integer NOT NULL,
        "initialBirdCount" integer NOT NULL,
        "dailyEggCount" integer NOT NULL DEFAULT 0,
        "actualLayingRatePercent" double precision NOT NULL DEFAULT 0,
        "targetLayingRatePercent" double precision NOT NULL DEFAULT 0,
        "feedPerBirdGrams" double precision NOT NULL DEFAULT 0,
        "targetFeedGrams" double precision NOT NULL DEFAULT 0,
        "temperature" double precision NOT NULL DEFAULT 21,
        "targetTemperature" double precision NOT NULL DEFAULT 21,
        "humidityPercent" double precision NOT NULL DEFAULT 60,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_houses" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "house_daily_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "houseId" uuid NOT NULL,
        "eggCount" integer NOT NULL,
        "mortalityCount" integer NOT NULL DEFAULT 0,
        "feedPerBirdGrams" double precision NOT NULL,
        "temperature" double precision NOT NULL,
        "humidityPercent" double precision NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_house_daily_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_house_daily_reports_house" FOREIGN KEY ("houseId")
          REFERENCES "houses"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_house_daily_reports_houseId" ON "house_daily_reports" ("houseId")`,
    );
    await queryRunner.query(
      `CREATE TABLE "egg_batches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "houseId" uuid,
        "houseName" character varying(120) NOT NULL,
        "rawEggCount" integer NOT NULL,
        "status" character varying(10) NOT NULL DEFAULT 'pending',
        "sortedYield" jsonb,
        "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "sortedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_egg_batches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_egg_batches_house" FOREIGN KEY ("houseId")
          REFERENCES "houses"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "egg_stocks" (
        "category" character varying(20) NOT NULL,
        "description" character varying(120) NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        "unit" character varying(10) NOT NULL DEFAULT 'шт',
        CONSTRAINT "PK_egg_stocks" PRIMARY KEY ("category")
      )`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "egg_stocks"`);
    await queryRunner.query(`DROP TABLE "egg_batches"`);
    await queryRunner.query(`DROP INDEX "IDX_house_daily_reports_houseId"`);
    await queryRunner.query(`DROP TABLE "house_daily_reports"`);
    await queryRunner.query(`DROP TABLE "houses"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
