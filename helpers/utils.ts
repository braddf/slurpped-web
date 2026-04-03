import Order from "../models/Order";
import { BlockedDate, Location } from "../types";
import { LocationName } from "../models/BlockedDate";
import fetchJson from "../lib/fetchJson";

export const getIsDateClosed = (date: Date, blockedDates: BlockedDate[], locations: Location[]) => {
  // Check if all default open locations are blocked
  const blockedDatesForSelectedDateInAnyLocation = blockedDates.filter((blockedDate) => {
    return new Date(blockedDate.date).toDateString() === date.toDateString();
  });
  const defaultOpenLocations = locations
    .filter(
      (location) => location.defaultStatus !== "closed" // TODO set to open once defaultStatus is added to locations in Sanity
    )
    .map((location) => location.name.toLowerCase());
  const defaultClosedLocations = locations
    .filter((location) => location.defaultStatus === "closed")
    .map((location) => location.name.toLowerCase());

  let openLocations = defaultOpenLocations;
  for (const blockedDate of blockedDatesForSelectedDateInAnyLocation) {
    for (const loc of blockedDate.locations) {
      // If default open and location is in blockedDate.locations, mark as closed
      if (defaultOpenLocations.includes(loc)) {
        openLocations = openLocations.filter((location) => location !== loc);
      }
      // If default closed and location is in blockedDate.locations, mark as open
      if (defaultClosedLocations.includes(loc)) {
        openLocations.push(loc);
      }
    }
  }

  return !openLocations.length;
};

/**
 * Determines the number of locations explicitly open for a given date.
 * It checks whether the provided date is explicitly marked as open in the list
 * of blocked dates for any locations that are closed by default.
 *
 * - Filters blocked dates matching the given date.
 * - Starts with locations marked as default "closed" and evaluates their open status.
 * - If a location is in the blocked date's locations, it is removed from the list of open locations.
 *
 * Returns the count of locations that are explicitly open for the given date.
 */
export const checkDateIsExplicitlyOpen = (
  date: Date,
  blockedDates: BlockedDate[],
  locations: Location[]
) => {
  const blockedDatesForSelectedDateInAnyLocation = blockedDates.filter((blockedDate) => {
    return new Date(blockedDate.date).toDateString() === date.toDateString();
  });
  const defaultClosedLocations = locations
    .filter(
      (location) => location.defaultStatus === "closed" // TODO set to open once defaultStatus is added to locations in Sanity
    )
    .map((location) => location.name.toLowerCase());
  let openLocations: LocationName[] = [];
  for (const blockedDate of blockedDatesForSelectedDateInAnyLocation) {
    for (const loc of blockedDate.locations) {
      // If default closed and location is in blockedDate.locations, mark as open
      if (defaultClosedLocations.includes(loc)) {
        openLocations.push(loc);
      }
    }
  }
  return openLocations.length;
};

export const getNextOrderWed = (
  blockedDates?: BlockedDate[] | undefined,
  locations?: Location[] | undefined
) => {
  const now = new Date();
  let addDays = 0;
  // Next week if it's Sunday after 10pm, but going with midnight for now
  // if (now.getDay() === 0 && now.getHours() >= 22) {
  //   nextWeek = true;
  // }
  if (now.getDay() > 0 && now.getDay() < 4) {
    addDays += 7;
  }
  let newDate = now.getDate() + ((3 + 7 - now.getDay()) % 7) + (addDays || 0);
  if (blockedDates && locations) {
    while (getIsDateClosed(new Date(newDate), blockedDates, locations)) {
      newDate += 7;
    }
  }
  return new Date(now.getFullYear(), now.getMonth(), newDate, 9, 0, 0);
};
export const getNextWed = (blockedDates?: BlockedDate[] | undefined) => {
  let now = new Date();
  let nowDate = now.getDate();
  // if (now.getDay() === 0 && now.getHours() >= 22) {
  //   nextWeek = true;
  // }
  if (blockedDates) {
    while (
      blockedDates.find(
        (date) =>
          new Date(date.date).toLocaleString().slice(0, 10) ===
          new Date(now.getFullYear(), now.getMonth(), nowDate).toLocaleString().slice(0, 10)
      )
    ) {
      nowDate += 7;
    }
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + ((3 - now.getDay()) % 7),
    9,
    0,
    0
  );
};

export const get2ndOrderWed = (blockedDates?: BlockedDate[] | undefined) => {
  const nextWed = getNextOrderWed(blockedDates);
  return new Date(nextWed.getFullYear(), nextWed.getMonth(), nextWed.getDate() + 7, 9, 0, 0);
};

export const get2ndWed = (blockedDates?: BlockedDate[] | undefined) => {
  const nextWed = getNextWed(blockedDates);
  return new Date(nextWed.getFullYear(), nextWed.getMonth(), nextWed.getDate() + 7, 9, 0, 0);
};

export const getLastWed = (blockedDates?: BlockedDate[] | undefined) => {
  const nextWed = getNextWed(blockedDates);
  return new Date(nextWed.getFullYear(), nextWed.getMonth(), nextWed.getDate() - 7, 9, 0, 0);
};

export const formatPrettyDateString = (date: Date) => {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export const getNextWednesdayString = (blockedDates: BlockedDate[], admin = false) => {
  const nextWednesday = admin ? getNextWed(blockedDates) : getNextOrderWed(blockedDates);
  return nextWednesday.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export const get2ndWednesdayString = (blockedDates: BlockedDate[], admin = false) => {
  const nextWednesday = admin ? get2ndWed(blockedDates) : get2ndOrderWed(blockedDates);
  return nextWednesday.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export const getLastWednesdayString = (blockedDates: BlockedDate[]) => {
  const lastWednesday = getLastWed(blockedDates);
  return lastWednesday.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

export const getNextOrderDates = async () => {
  const upcomingOrders = await fetchJson(`${process.env.APP_URL}/api/admin/orders/upcoming`);
  return upcomingOrders as Order[];
};

export function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export const sumOrdersWithQuantity = (orders: Order[]) => {
  return orders.reduce((acc, order) => acc + Number(order.quantity), 0);
};

export const getPageSlug = (type: string) => {
  switch (type) {
    case "home-page":
      return "/";
    case "about-page":
      return "/about";
    case "contact-page":
      return "/contact";
    case "faq-page":
      return "/faqs";
    case "recipes-page":
      return "/recipes";
    case "news-page":
      return "/blog";
    case "gallery-page":
      return "/gallery";
    default:
      return "/";
  }
};
