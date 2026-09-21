import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatabaseExtensions1789671872393 implements MigrationInterface {
  name = 'CreateDatabaseExtensions1789671872393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        `);

    await queryRunner.query(`
            CREATE TYPE "document_type_enum" AS ENUM ('CPF', 'CNPJ');
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TYPE IF EXISTS "document_type_enum";
        `);
  }
}
