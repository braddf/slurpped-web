import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.setNullable("checkoutSessionId");
    table.setNullable("paymentIntentId");
    table.setNullable("paidAt");
    table.dropNullable("total");
    table.dropNullable("collected");
    table.text("notes").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("notes");
    table.setNullable("collected");
    table.setNullable("total");
    table.dropNullable("paidAt");
    table.dropNullable("paymentIntentId");
    table.dropNullable("checkoutSessionId");
  });
}
