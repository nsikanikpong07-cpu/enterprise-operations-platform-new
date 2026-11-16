import type { MigrationInterface, QueryRunner } from 'typeorm';
export class UnitQuantityPolicy1791761300000 implements MigrationInterface {
  name = 'UnitQuantityPolicy1791761300000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE catalog.units_of_measure ADD COLUMN IF NOT EXISTS allows_fractional boolean`);
    await q.query(`UPDATE catalog.units_of_measure SET allows_fractional=false WHERE allows_fractional IS NULL AND lower(trim(name)) IN ('each','piece','pieces','pair','set','pack','box','carton','roll','bag')`);
    await q.query(`UPDATE catalog.units_of_measure SET allows_fractional=true WHERE allows_fractional IS NULL AND lower(trim(name)) IN ('kilogram','gram','tonne','litre','millilitre','metre','centimetre','square metre','cubic metre','hour','day')`);
  }
  async down(): Promise<void> { throw new Error('Unit quantity policies require review before removal'); }
}
