import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260827100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" add column if not exists "finish_options" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" drop column if exists "finish_options";`);
  }

}
