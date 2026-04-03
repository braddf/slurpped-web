import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("blocked_dates", (table) => {
    table
      .specificType("locations", "character varying(255)[]")
      .defaultTo("{educatorium, parnassos}");
    table.string("status").defaultTo("closed");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("blocked_dates", (table) => {
    table.dropColumn("locations");
    table.dropColumn("status");
  });
}
