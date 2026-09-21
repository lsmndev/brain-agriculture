import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantingsTable1789673535174 implements MigrationInterface {
  name = 'CreatePlantingsTable1789673535174';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plantings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "crop_season_id" uuid NOT NULL,
        "crop_id" uuid NOT NULL,
        "planted_area_ha" numeric(15, 4) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_plantings_id"
        PRIMARY KEY ("id"),

        CONSTRAINT "FK_plantings_crop_season"
        FOREIGN KEY ("crop_season_id")
        REFERENCES "crop_seasons" ("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,

        CONSTRAINT "FK_plantings_crop"
        FOREIGN KEY ("crop_id")
        REFERENCES "crops" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

        CONSTRAINT "UQ_plantings_crop_season_crop"
        UNIQUE ("crop_season_id", "crop_id"),

        CONSTRAINT "CHK_plantings_planted_area_positive"
        CHECK ("planted_area_ha" > 0)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_plantings_crop_id"
      ON "plantings" ("crop_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "plantings";
    `);
  }
}
