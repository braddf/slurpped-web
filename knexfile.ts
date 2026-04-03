// Update with your config settings.

import { Knex } from "knex";
import { knexSnakeCaseMappers } from "objection";

const config: Knex.Config = {
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    ssl: { rejectUnauthorized: false }
  },
  ...knexSnakeCaseMappers(),
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "migrations"
  }
};

export default config;
