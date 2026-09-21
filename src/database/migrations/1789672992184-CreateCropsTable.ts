import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCropsTable1789672992184 implements MigrationInterface {
  name = 'CreateCropsTable1789672992184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "crops" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_crops_id"
          PRIMARY KEY ("id")
      );
    `);

    /*
     * A unicidade da cultura é case-insensitive.
     *
     * Isso mantém o banco consistente com
     * CropsService.ensureNameIsUnique(), que
     * utiliza ILike().
     *
     * Exemplos considerados duplicados:
     *
     * Soybean
     * soybean
     * SOYBEAN
     */
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_crops_name_lower"
        ON "crops" (LOWER("name"));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_crops_name_lower";
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "crops";
    `);
  }
}
