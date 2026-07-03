import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703160433 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" alter column "markup_percent" type real using ("markup_percent"::real);`);
    this.addSql(`alter table if exists "print_offering" alter column "markup_percent" set default 20;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" alter column "markup_percent" type real using ("markup_percent"::real);`);
    this.addSql(`alter table if exists "print_offering" alter column "markup_percent" set default 40;`);
  }

}
