import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("users", function (table) {
    table.boolean("is_admin").defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table("users", function (table) {
    table.dropColumn("is_admin");
  });
}
