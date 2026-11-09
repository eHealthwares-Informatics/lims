import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Notification dispatch ledger: keep the subject + the exact dispatch request
 * so a failed/sent notification can be replayed from the LIS UI.
 */
export class AddNotificationDispatchRetrigger1796000000000
  implements MigrationInterface
{
  name = 'AddNotificationDispatchRetrigger1796000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "title" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "request_payload" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "retriggered_from_id" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "retriggered_from_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "request_payload"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "title"`,
    );
  }
}
