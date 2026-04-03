import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .alterTable("orders", (table) => {
      table.uuid("updatedBy").after("createdBy");
    })
    .then(() => {
      return knex("orders").update({ updatedBy: knex.ref("createdBy") });
    })
    .then(() => {
      return knex.schema.alterTable("orders", (table) => {
        table.uuid("updatedBy").notNullable().references("id").inTable("users").alter();
      });
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("orders", (table) => {
    table.dropColumn("updatedBy");
  });
}
