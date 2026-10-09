import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTatTargetsToTestDefinitions1790000000000 implements MigrationInterface {
  name = 'AddTatTargetsToTestDefinitions1790000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Additive only — TAT targets are optional so existing rows need no backfill.
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" ADD COLUMN "tat_routine_minutes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" ADD COLUMN "tat_stat_minutes" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" ADD COLUMN "tat_emergency_minutes" integer`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" DROP COLUMN "tat_emergency_minutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" DROP COLUMN "tat_stat_minutes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_test_definitions" DROP COLUMN "tat_routine_minutes"`,
    );
  }
}
