import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRiskAssessmentTimestamps1791200000000
  implements MigrationInterface
{
  name = 'AddRiskAssessmentTimestamps1791200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vendor.supplier_risk_assessments
        ADD COLUMN IF NOT EXISTS created_at
          timestamptz NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at
          timestamptz NOT NULL DEFAULT NOW()
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally preserve timestamp columns and their data.
    // They may have existed before this migration was applied.
  }
}