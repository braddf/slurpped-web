import { Model, Modifiers, snakeCaseMappers } from "objection";
import Order from "./Order";
// eslint-disable-next-line import/no-cycle

export type LocationName = "Educatorium" | "Parnassos" | "VMA";
export type LocationStatus = "closed" | "open";

export default class User extends Model {
  id!: string;

  date!: Date;

  reason!: string;

  locations!: LocationName[];

  status!: LocationStatus;

  createdBy!: string;

  createdAt!: Date;

  // Table name is the only required property.
  static tableName = "blocked_dates";

  static get columnNameMappers() {
    // If your columns are UPPER_SNAKE_CASE you can
    // use snakeCaseMappers({ upperCase: true })
    return snakeCaseMappers();
  }

  // static get virtualAttributes() {
  //   return ["fullName"];
  // }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static jsonSchema = {
    type: "object",
    required: ["date", "locations", "status"],

    properties: {
      id: { type: "string" },
      date: { type: "string" },
      reason: { type: "string", minLength: 1, maxLength: 255 },
      locations: { type: "array", items: { type: "string" } },
      status: { type: "string", enum: ["closed", "open"] },
      createdBy: { type: "string", minLength: 1, maxLength: 255 },
      createdAt: { type: "string" }

      // address: {
      //   type: 'object',
      //   properties: {
      //     street: { type: 'string' },
      //     city: { type: 'string' },
      //     zipCode: { type: 'string' },
      //   },
      // },
    }
  };

  // Modifiers are reusable query snippets that can be used in various places.
  static modifiers: Modifiers = {
    // Our example modifier is a a semi-dumb fuzzy name match. We split the
    // name into pieces using whitespace and then try to partially match
    // each of those pieces to both the `firstName` and the `lastName`
    // fields.
  };

  // This object defines the relations to other models. The relationMappings
  // property can be a thunk to prevent circular dependencies.
  static relationMappings = () => ({
    //
    // parent: {
    //   relation: Model.BelongsToOneRelation,
    //   modelClass: Person,
    //   join: {
    //     from: 'persons.parentId',
    //     to: 'persons.id',
    //   },
    // },
  });
}
