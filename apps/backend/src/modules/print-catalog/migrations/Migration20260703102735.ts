import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703102735 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" alter column "width" type real using ("width"::real);`);
    this.addSql(`alter table if exists "print_offering" alter column "height" type real using ("height"::real);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" alter column "width" type integer using ("width"::integer);`);
    this.addSql(`alter table if exists "print_offering" alter column "height" type integer using ("height"::integer);`);
  }

}
