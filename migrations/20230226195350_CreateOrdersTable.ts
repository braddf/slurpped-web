import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("orders", (table) => {
    table.uuid("id").defaultTo(knex.raw("uuid_generate_v4()")).primary();
    table.uuid("userId").notNullable();
    table.string("checkoutSessionId").notNullable();
    table.string("paymentIntentId").notNullable();
    table.string("status").notNullable();
    table.bigInteger("paidAt").notNullable();
    table.bigInteger("collectionDate").notNullable();
    table.string("collectionLocation").notNullable();
    table.string("product").notNullable();
    table.bigInteger("quantity").notNullable();
    table.uuid("createdBy").notNullable();
    table.string("orderType").notNullable();
    table.timestamps(true, true);
    table.foreign("userId").references("id").inTable("users").onDelete("CASCADE");
    table.foreign("createdBy").references("id").inTable("users").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("orders");
}
