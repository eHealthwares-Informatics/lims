import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByIdToOrders1740129600000 implements MigrationInterface {
  name = 'AddCreatedByIdToOrders1740129600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_orders" ADD COLUMN "created_by_id" uuid`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_orders" DROP COLUMN "created_by_id"`,
    );
  }
}
