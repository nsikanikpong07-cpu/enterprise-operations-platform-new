import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1720000000000 implements MigrationInterface {
  name = 'CreateSchemas1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS organization`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS iam`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS catalog`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS vendor`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS procurement`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS audit`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS audit CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS procurement CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS vendor CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS catalog CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS iam CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS organization CASCADE`);
  }
}
