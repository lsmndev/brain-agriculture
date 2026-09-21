import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFarmsTable1789672014764 implements MigrationInterface {
  name = 'CreateFarmsTable1789672014764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "farms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "producer_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "city" varchar(100) NOT NULL,
        "state" char(2) NOT NULL,
        "total_area_ha" numeric(15, 4) NOT NULL,
        "arable_area_ha" numeric(15, 4) NOT NULL,
        "vegetation_area_ha" numeric(15, 4) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_farms_id"
        PRIMARY KEY ("id"),

        CONSTRAINT "FK_farms_producer"
        FOREIGN KEY ("producer_id")
        REFERENCES "producers" ("id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

        CONSTRAINT "CHK_farms_total_area_positive"
        CHECK ("total_area_ha" > 0),

        CONSTRAINT "CHK_farms_arable_area_non_negative"
        CHECK ("arable_area_ha" >= 0),

        CONSTRAINT "CHK_farms_vegetation_area_non_negative"
        CHECK ("vegetation_area_ha" >= 0),

        CONSTRAINT "CHK_farms_land_use"
        CHECK (
          "arable_area_ha" + "vegetation_area_ha"
          <= "total_area_ha"
        )
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_farms_producer_id"
      ON "farms" ("producer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_farms_state"
      ON "farms" ("state");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "farms";
    `);
  }
}
