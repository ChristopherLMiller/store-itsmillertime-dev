import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703122457 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" add column if not exists "prodigi_unit_cost" real null, add column if not exists "markup_percent" real not null default 40, add column if not exists "retail_price" real null, add column if not exists "price_currency" text not null default 'usd';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" drop column if exists "prodigi_unit_cost", drop column if exists "markup_percent", drop column if exists "retail_price", drop column if exists "price_currency";`);
  }

}
