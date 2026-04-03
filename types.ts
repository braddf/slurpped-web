import { LocationName, LocationStatus } from "./models/BlockedDate";
import User from "./models/User";

export type Product = {
  name: string;
  slug: string;
  stripeProductId: string;
  priceInCents: number;
  available: boolean;
  sortOrder?: number;
};

export type OrderItem = {
  slug: string;
  quantity: number;
};

export type GeneralSettings = {
  _type: "general-settings";
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  orderButtonText: string;
  showAnnouncementBar: boolean;
  announcementBarText: string;
  products: Product[];
};

export type MainMenu = {
  _type: "main-menu";
  links: MenuLink[];
};

export type MenuLink = {
  _id: string;
  _type: string;
  title: string;
  overrideTitle?: string;
};

export type Partner = {
  _id: string;
  _type: string;
  name: string;
  logo: any;
  url: string;
};

export type PartnersPage = {
  _type: "partners-page";
  title: string;
  subtitle: string;
  intro: any;
  homepageBtnText?: string;
  partners: Partner[];
};

export type Location = {
  __i18n_lang: string;
  __i18n_refs: any;
  _createdAt: string;
  _rev: string;
  _updatedAt: string;
  _id: string;
  _type: "location";
  name: LocationName;
  longName: string;
  address: string;
  availableFrom: string;
  availableTo: string;
  directionsLink: string;
  defaultStatus: LocationStatus;
  latitude: number;
  longitude: number;
};
export type UnsavedUser = Pick<User, "firstName" | "lastName" | "email">;
export type SavedUser = Pick<User, "id" | "firstName" | "lastName" | "email">;
export type OrderStatuses = "paid" | "unpaid" | "refunded" | "cancelled";
export type BlockedDate = {
  id: string;
  date: string;
  reason: string;
  locations: LocationName[];
  status: LocationStatus;
};
