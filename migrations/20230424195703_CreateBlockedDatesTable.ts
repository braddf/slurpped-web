import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("blocked_dates", (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.date("date");
    table.string("reason");
    table.uuid("createdBy").notNullable();
    table.timestamps(true, true);
    table.foreign("createdBy").references("id").inTable("users").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.dropTableIfExists("blocked_dates");
}
