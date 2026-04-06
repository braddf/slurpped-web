import { Model, Modifiers, snakeCaseMappers } from "objection";
import User from "./User";
import { OrderItem, OrderStatuses } from "../types";
// eslint-disable-next-line import/no-cycle

export type DeliveryAddress = {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: "GB";
};

export type UnsavedOrder = Pick<
  Order,
  | "status"
  | "userId"
  | "deliveryDate"
  | "deliverySlot"
  | "deliveryAddress"
  | "product"
  | "quantity"
  | "total"
  | "items"
>;
export default class Order extends Model {
  id!: string;
  checkoutSessionId?: string;
  paymentIntentId?: string;
  status!: OrderStatuses;
  userId!: string;
  paidAt?: number; // Unix seconds (legacy — deliveryDate uses milliseconds)
  deliveryDate!: number;
  deliverySlot!: string;
  deliveryAddress?: DeliveryAddress;
  product!: string;
  items?: OrderItem[];
  quantity!: number;
  orderType!: "website" | "admin";
  total!: number;
  collected?: boolean;
  notes?: string;
  createdBy!: string;
  createdAt!: Date;
  updatedBy!: string;
  updatedAt!: string;
  // pets?: Animal[]
  // children?: Person[]
  user?: User;

  // Table name is the only required property.
  static tableName = "orders";

  static get columnNameMappers() {
    // If your columns are UPPER_SNAKE_CASE you can
    // use snakeCaseMappers({ upperCase: true })
    return snakeCaseMappers();
  }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.
  // fullName() {
  //   return `${this.firstName} ${this.lastName}`;
  // }

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static jsonSchema = {
    type: "object",
    required: [
      "status",
      "userId",
      "deliveryDate",
      "deliverySlot",
      "product",
      "quantity",
      // "orderType",
      "total"
      // "createdBy"
    ],

    properties: {
      id: { type: "string" },
      status: { type: "string", minLength: 1, maxLength: 255 },
      userId: { type: "string", minLength: 1, maxLength: 255 },
      deliveryDate: { type: "integer" },
      deliverySlot: { type: "string", minLength: 1, maxLength: 255 },
      deliveryAddress: { type: "object" },
      product: { type: "string", minLength: 1, maxLength: 255 },
      items: { type: "array" },
      quantity: { type: "integer" },
      orderType: { type: "string", minLength: 1, maxLength: 255, enum: ["website", "admin"] },
      total: { type: "integer" },
      createdBy: { type: "string", minLength: 1, maxLength: 255 },
      createdAt: { type: "string" },
      updatedBy: { type: "string", minLength: 1, maxLength: 255 },
      updatedAt: { type: "string" }
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
    // children: {
    //   relation: Model.HasManyRelation,
    //   modelClass: Person,
    //   join: {
    //     from: 'persons.id',
    //     to: 'persons.parentId',
    //   },
    // },
    //
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: "orders.userId",
        to: "users.id"
      }
    }
  });

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}
