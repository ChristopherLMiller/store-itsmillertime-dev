import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703073246 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "print_offering" drop constraint if exists "print_offering_prodigi_sku_unique";`);
    this.addSql(`create table if not exists "offering_set" ("id" text not null, "name" text not null, "description" text null, "is_default" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "offering_set_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_offering_set_deleted_at" ON "offering_set" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "print_offering" ("id" text not null, "prodigi_sku" text not null, "label" text not null, "category" text check ("category" in ('print', 'canvas', 'metal', 'digital')) not null default 'print', "width" integer null, "height" integer null, "substrate" text null, "raw_prodigi_data" jsonb null, "active" boolean not null default true, "needs_review" boolean not null default false, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "print_offering_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_print_offering_prodigi_sku_unique" ON "print_offering" ("prodigi_sku") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_print_offering_deleted_at" ON "print_offering" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "offering_set_item" ("offering_set_id" text not null, "print_offering_id" text not null, constraint "offering_set_item_pkey" primary key ("offering_set_id", "print_offering_id"));`);

    this.addSql(`alter table if exists "offering_set_item" add constraint "offering_set_item_offering_set_id_foreign" foreign key ("offering_set_id") references "offering_set" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "offering_set_item" add constraint "offering_set_item_print_offering_id_foreign" foreign key ("print_offering_id") references "print_offering" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "offering_set_item" drop constraint if exists "offering_set_item_offering_set_id_foreign";`);

    this.addSql(`alter table if exists "offering_set_item" drop constraint if exists "offering_set_item_print_offering_id_foreign";`);

    this.addSql(`drop table if exists "offering_set" cascade;`);

    this.addSql(`drop table if exists "print_offering" cascade;`);

    this.addSql(`drop table if exists "offering_set_item" cascade;`);
  }

}
