import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLisNotificationTables1760000000000 implements MigrationInterface {
  name = 'AddLisNotificationTables1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lis_notification_templates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "template_code" text NOT NULL UNIQUE,
        "event_key" text NOT NULL,
        "audience" text NOT NULL,
        "channels" text NOT NULL DEFAULT 'SMS',
        "body" text NOT NULL,
        "language" text NOT NULL DEFAULT 'en',
        "channel_code_override" text,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lis_notification_templates_event_key" ON "lis_notification_templates" ("event_key")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lis_notification_dispatches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_key" text NOT NULL,
        "audience" text,
        "recipient_address" text,
        "related_entity_type" text,
        "related_entity_id" text,
        "status" text NOT NULL DEFAULT 'PENDING',
        "exchange_id" text,
        "context_id" text,
        "channel_code" text,
        "template_code_used" text,
        "rendered_body" text,
        "failure_reason" text,
        "sent_at" TIMESTAMP,
        "attempts" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lis_notification_dispatches_event_key" ON "lis_notification_dispatches" ("event_key")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lis_notification_dispatches_status" ON "lis_notification_dispatches" ("status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lis_notification_dispatches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lis_notification_templates"`);
  }
}
