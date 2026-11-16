import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Add common shared units without modifying existing company data. */
export class SeedSharedUnitsOfMeasure1791761100000 implements MigrationInterface {
  name = 'SeedSharedUnitsOfMeasure1791761100000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO catalog.units_of_measure (code, name)
      SELECT seed.code, seed.name
      FROM (VALUES
        ('EA', 'Each'), ('PCS', 'Pieces'), ('PAIR', 'Pair'),
        ('SET', 'Set'), ('PACK', 'Pack'), ('BOX', 'Box'),
        ('CTN', 'Carton'), ('ROLL', 'Roll'), ('BAG', 'Bag'),
        ('KG', 'Kilogram'), ('G', 'Gram'), ('T', 'Tonne'),
        ('L', 'Litre'), ('ML', 'Millilitre'),
        ('M', 'Metre'), ('CM', 'Centimetre'),
        ('M2', 'Square metre'), ('M3', 'Cubic metre'),
        ('HR', 'Hour'), ('DAY', 'Day'), ('JOB', 'Job')
      ) AS seed(code, name)
      WHERE NOT EXISTS (
        SELECT 1 FROM catalog.units_of_measure existing
        WHERE lower(trim(existing.code)) = lower(seed.code)
           OR lower(trim(existing.name)) = lower(seed.name)
      )
      ON CONFLICT (code) DO NOTHING
    `);
  }

  async down(): Promise<void> {
    throw new Error('Shared units may be referenced by existing records; review before removal.');
  }
}
