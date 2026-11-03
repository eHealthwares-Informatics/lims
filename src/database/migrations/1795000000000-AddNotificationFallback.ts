import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationFallback1795000000000 implements MigrationInterface {
  name = 'AddNotificationFallback1795000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "fallback_from" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "fallback_from"`,
    );
  }
}
