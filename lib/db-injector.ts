import Knex from "knex";

const dbConfig = require("../knexfile");

let connection;

declare const globalThis: {
  knexGlobal: ReturnType<typeof Knex>;
} & typeof global;

const getDatabaseConnector = () => () => {
  connection = Knex(dbConfig.default);
  return connection;
};

const databaseConnector = globalThis.knexGlobal ?? getDatabaseConnector();

export default databaseConnector;

if (process.env.NODE_ENV !== "production") {
  globalThis.knexGlobal = databaseConnector;
}
