export class CreateSchemas1720000000000 {
    name = 'CreateSchemas1720000000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS organization`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS iam`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS catalog`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS vendor`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS procurement`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS audit`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP SCHEMA IF EXISTS audit CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS procurement CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS vendor CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS catalog CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS iam CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS organization CASCADE`);
    }
}
//# sourceMappingURL=1720000000000-CreateSchemas.js.map