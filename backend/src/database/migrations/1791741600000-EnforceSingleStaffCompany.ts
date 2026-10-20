import type {
  MigrationInterface,
  QueryRunner,
} from 'typeorm';

export class EnforceSingleStaffCompany1791741600000
  implements MigrationInterface {
  name = 'EnforceSingleStaffCompany1791741600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check existing records before introducing the restriction.
    // Never delete memberships or pick a company automatically.
    const duplicates: Array<{ user_id: string }> =
      await queryRunner.query(`
        SELECT user_id
        FROM iam.company_users
        GROUP BY user_id
        HAVING COUNT(*) > 1
      `);

    if (duplicates.length > 0) {
      throw new Error(
        'Some users have multiple company memberships. Resolve those memberships before running this migration.',
      );
    }

    // Enforce one membership per user at database level.
    // This also prevents duplicates from simultaneous requests.
    await queryRunner.query(`
      ALTER TABLE iam.company_users
      ADD CONSTRAINT uq_company_users_user
      UNIQUE (user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove only the restriction introduced by this migration.
    // No membership records are deleted.
    await queryRunner.query(`
      ALTER TABLE iam.company_users
      DROP CONSTRAINT uq_company_users_user
    `);
  }
}