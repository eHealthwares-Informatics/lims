import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientNumberAndReferenceCodeToLis1747392000000 implements MigrationInterface {
  name = 'AddPatientNumberAndReferenceCodeToLis1747392000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_orders" ADD COLUMN "patient_number" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_orders" ADD COLUMN "reference_code" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_order_items" ADD COLUMN "reference_code" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lis_order_items" DROP COLUMN "reference_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_orders" DROP COLUMN "reference_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lis_orders" DROP COLUMN "patient_number"`,
    );
  }
}
