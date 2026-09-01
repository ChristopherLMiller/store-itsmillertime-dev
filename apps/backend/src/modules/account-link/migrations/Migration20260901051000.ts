import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260901051000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "account_link_challenge" ("id" text not null, "customer_id" text null, "payload_user_id" text null, "target_side" text check ("target_side" in ('payload', 'medusa')) not null, "target_email" text not null, "code_hash" text not null, "attempts" integer not null default 0, "expires_at" timestamptz not null, "consumed_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "account_link_challenge_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_account_link_challenge_customer_id" ON "account_link_challenge" ("customer_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_account_link_challenge_payload_user_id" ON "account_link_challenge" ("payload_user_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_account_link_challenge_target_email" ON "account_link_challenge" ("target_email") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_account_link_challenge_deleted_at" ON "account_link_challenge" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "account_link_challenge" cascade;`)
  }
}
