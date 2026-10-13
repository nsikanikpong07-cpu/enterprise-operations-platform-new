import {
  TableUnique,
  type MigrationInterface,
  type QueryRunner,
} from 'typeorm';

export class ScopeRoleNamesToCompany1791747600000
  implements MigrationInterface
{
  name = 'ScopeRoleNamesToCompany1791747600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('iam.roles');

    if (!table) {
      throw new Error('The iam.roles table was not found.');
    }

    // Remove constraints that make the role name globally unique.
    // We inspect their columns instead of guessing constraint names.
    for (const constraint of table.uniques) {
      if (
        constraint.columnNames.length === 1 &&
        constraint.columnNames[0] === 'name'
      ) {
        await queryRunner.dropUniqueConstraint(
          'iam.roles',
          constraint,
        );
      }
    }

    // Reload after removing constraints because their supporting
    // indexes may have been removed automatically.
    const updatedTable = await queryRunner.getTable('iam.roles');

    if (!updatedTable) {
      throw new Error('The iam.roles table was not found.');
    }

    // Remove any remaining standalone unique index on name alone.
    for (const index of updatedTable.indices) {
      if (
        index.isUnique &&
        index.columnNames.length === 1 &&
        index.columnNames[0] === 'name'
      ) {
        await queryRunner.dropIndex('iam.roles', index);
      }
    }

    // A role name must be unique within its owning company.
    await queryRunner.createUniqueConstraint(
      'iam.roles',
      new TableUnique({
        name: 'uq_roles_company_name',
        columnNames: ['company_id', 'name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Global uniqueness cannot be restored if different companies
    // now have roles with the same name. Preserve those records.
    const duplicateNames = await queryRunner.query(`
      SELECT name
      FROM iam.roles
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (duplicateNames.length > 0) {
      throw new Error(
        'Cannot revert: different companies have roles with ' +
          'the same name. No roles will be deleted.',
      );
    }

    await queryRunner.dropUniqueConstraint(
      'iam.roles',
      'uq_roles_company_name',
    );

    await queryRunner.createUniqueConstraint(
      'iam.roles',
      new TableUnique({
        name: 'uq_roles_name_global',
        columnNames: ['name'],
      }),
    );
  }
}