import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table("orders", (table) => {
    table.boolean("collected").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("orders", (table) => {
    table.dropColumn("collected");
  });
}
