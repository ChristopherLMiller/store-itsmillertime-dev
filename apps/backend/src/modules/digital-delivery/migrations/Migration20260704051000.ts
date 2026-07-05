import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260704051000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "digital_delivery" ("id" text not null, "order_id" text not null, "token" text not null, "zip_path" text not null, "expires_at" timestamptz not null, "email_sent_at" timestamptz null, "fulfillment_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "digital_delivery_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_digital_delivery_token_unique" ON "digital_delivery" ("token") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_digital_delivery_order_id" ON "digital_delivery" ("order_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_digital_delivery_deleted_at" ON "digital_delivery" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "digital_delivery" cascade;`)
  }
}
