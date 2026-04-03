import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";').createTable("users", function (table) {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.string("first_name").notNullable();
    table.string("last_name").notNullable();
    table.string("email").notNullable();
    table.string("customer_id");
    table.string("payment_details_id");
    table.string("last_4");
    table.string("subscription_id");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("users");
}
