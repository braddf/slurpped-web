import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.integer("total");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("orders", (table) => {
    table.dropColumn("total");
  });
}
