import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCropSeasonsTable1789672173889 implements MigrationInterface {
  name = 'CreateCropSeasonsTable1789672173889';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "crop_seasons" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "farm_id" uuid NOT NULL,
                "name" varchar(100) NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

                CONSTRAINT "PK_crop_seasons_id"
                PRIMARY KEY ("id"),

                CONSTRAINT "FK_crop_seasons_farm"
                FOREIGN KEY ("farm_id")
                REFERENCES "farms" ("id")
                ON DELETE CASCADE
                ON UPDATE CASCADE,

                CONSTRAINT "UQ_crop_seasons_farm_year"
                UNIQUE ("farm_id", "year")
            );
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_crop_seasons_farm_id"
            ON "crop_seasons" ("farm_id");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_crop_seasons_farm_id";
        `);

    await queryRunner.query(`
            DROP TABLE IF EXISTS "crop_seasons";
        `);
  }
}
