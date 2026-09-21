import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducersTable1789671880045 implements MigrationInterface {
  name = 'CreateProducersTable1789671880045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "producers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "document" varchar(14) NOT NULL,
        "document_type" "document_type_enum" NOT NULL,
        "name" varchar(255) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_producers_id"
        PRIMARY KEY ("id"),

        CONSTRAINT "UQ_producers_document"
        UNIQUE ("document")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "producers";
    `);
  }
}
