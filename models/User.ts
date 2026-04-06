import { Model, Modifiers, snakeCaseMappers } from "objection";
import Order from "./Order";
import { DeliveryAddress } from "./Order";
// eslint-disable-next-line import/no-cycle

export default class User extends Model {
  id!: string;

  firstName!: string;

  lastName!: string;

  email!: string;

  customerId!: string;
  isAdmin!: boolean;

  paymentDetailsId?: string;

  last4?: string;

  subscriptionId?: string;

  defaultDeliveryAddress?: DeliveryAddress;

  defaultDeliverySlot?: string;

  // pets?: Animal[]
  // children?: Person[]
  // parent?: Person

  // Table name is the only required property.
  static tableName = "users";

  static get columnNameMappers() {
    // If your columns are UPPER_SNAKE_CASE you can
    // use snakeCaseMappers({ upperCase: true })
    return snakeCaseMappers();
  }

  static get virtualAttributes() {
    return ["fullName"];
  }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static jsonSchema = {
    type: "object",
    required: ["firstName", "lastName"],

    properties: {
      id: { type: "integer" },
      firstName: { type: "string", minLength: 1, maxLength: 255 },
      lastName: { type: "string", minLength: 1, maxLength: 255 },
      email: { type: "string", minLength: 1, maxLength: 255 },
      customerId: { type: "string", minLength: 1, maxLength: 255 },
      isAdmin: { type: "boolean", default: false }

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
    searchByName(query, name) {
      // This `where` simply creates parentheses so that other `where`
      // statements don't get mixed with the these.
      query.where((q) => {
        for (const namePart of name.trim().split(/\s+/)) {
          for (const column of ["firstName", "lastName"]) {
            q.orWhereRaw("lower(??) like ?", [column, `${namePart.toLowerCase()}%`]);
          }
        }
      });
    }
  };

  // This object defines the relations to other models. The relationMappings
  // property can be a thunk to prevent circular dependencies.
  static relationMappings = () => ({
    // pets: {
    //   relation: Model.HasManyRelation,
    //   // The related model. This can be either a Model subclass constructor or an
    //   // absolute file path to a module that exports one.
    //   modelClass: Animal,
    //   join: {
    //     from: 'persons.id',
    //     to: 'animals.ownerId',
    //   },
    // },
    //
    // practices: {
    //   relation: Model.ManyToManyRelation,
    //   modelClass: Practice,
    //   join: {
    //     from: "users.id",
    //     // ManyToMany relation needs the `through` object to describe the join table.
    //     through: {
    //       from: "practice_users.user_id",
    //       to: "practice_users.practice_id"
    //     },
    //     to: "practices.id"
    //   }
    // }
    //
    orders: {
      relation: Model.HasManyRelation,
      modelClass: Order,
      join: {
        from: "users.id",
        to: "orders.userId"
      }
    }
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
