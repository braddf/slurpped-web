import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.jsonb("items").defaultTo("[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("items");
  });
}
