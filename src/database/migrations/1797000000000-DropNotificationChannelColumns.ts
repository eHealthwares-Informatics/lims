import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop channel/template columns from the LIS notification ledger.
 *
 * Conversation is the single owner of templates and channels; the sender-app
 * ledger no longer records a channel code, fallback channel or template code.
 */
export class DropNotificationChannelColumns1797000000000
  implements MigrationInterface
{
  name = 'DropNotificationChannelColumns1797000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "channel_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "fallback_from"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" DROP COLUMN IF EXISTS "template_code_used"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "channel_code" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "fallback_from" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_notification_dispatches" ADD COLUMN IF NOT EXISTS "template_code_used" text`,
    );
  }
}
