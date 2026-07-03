import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703120022 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" add column if not exists "paper_type" text null, add column if not exists "weight_gsm" integer null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" drop column if exists "paper_type", drop column if exists "weight_gsm";`);
  }

}
