import React, { Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";
import fetchJson from "../lib/fetchJson";
import { NextApiResponse, NextPage } from "next";
import { Stripe } from "stripe";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../lib/session";
import { useRouter } from "next/router";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { checkDateIsExplicitlyOpen, getIsDateClosed, getNextOrderWed } from "../helpers/utils";
import { theme } from "../tailwind.config.js";
import useUser from "../lib/useUser";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import * as Sentry from "@sentry/nextjs";
import { BlockedDate, Location, OrderItem, Product } from "../types";
import { SettingsContext } from "./_app";
// import './App.css';

type OrderProps = {
  customer: Stripe.Customer;
  invoicesList: Stripe.ApiList<Stripe.Invoice>;
  checkoutSessionsList: Stripe.ApiList<Stripe.Checkout.Session>;
  locations: Location[];
  blockedDates: any;
};

export const QuestionSection: React.FC<{
  text: string;
  children: any;
}> = ({ text, children }) => (
  <div className="flex flex-1 flex-col sm:flex-row mb-8 justify-between">
    <h3 className="mr-6 flex flex-col text-xl sm:text-2xl">
      <span>{text}</span>
    </h3>
    <div className="flex flex-initial flex-col sm:flex-row gap-6 mb-4">{children}</div>
  </div>
);

export const MultiSelect: React.FC<{
  item: string;
  selectedItem: string | undefined;
  setSelectedItem: Dispatch<SetStateAction<string | undefined>>;
  label?: string | ReactNode;
  isAvailable?: boolean;
  admin?: boolean;
}> = ({ item = "", selectedItem, setSelectedItem, label, isAvailable = true, admin = false }) => {
  const selectOrUnselect = (item: string) => {
    if (selectedItem === item) {
      setSelectedItem(undefined);
    } else {
      setSelectedItem(item);
    }
  };
  return (
    <div
      className={`flex flex-1 sm:flex-initial sm:max-w-xs items-center text-center flex-wrap border-4 rounded-md my-auto cursor-pointer ${
        item === selectedItem ? "border-green-700" : "border-gray-300"
      } ${admin ? "py-2 px-4 h-20" : "py-4 px-8 h-32"}${
        !isAvailable ? " cursor-not-allowed disabled opacity-50" : ""
      }`}
      onClick={() => (!isAvailable ? console.log("clicked unavailable") : selectOrUnselect(item))}
    >
      <h4 className={`flex-1 ${admin ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
        {label || item}
      </h4>
    </div>
  );
};

export const QuantitySelect: React.FC<{
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  admin?: boolean;
}> = ({ quantity, setQuantity, admin = false }) => {
  return (
    <div className="flex flex-1 flex-col mb-8">
      <h3 className="mr-6 text-xl sm:text-2xl">Quantity:</h3>
      <div className="flex flex-1 flex-wrap gap-6 my-4 justify-between">
        <div
          className={`flex flex-1 justify-center flex-wrap border-4 rounded-md p-5 px-16 cursor-pointer ${
            quantity === 1 ? "border-green-700" : "border-gray-300"
          }`}
          onClick={() => setQuantity(1)}
        >
          <h4 className="text-xl sm:text-2xl">1</h4>
        </div>
        <div
          className={`flex flex-1 justify-center flex-wrap border-4 rounded-md p-5 px-16 cursor-pointer ${
            quantity === 2 ? "border-green-700" : "border-gray-300"
          }`}
          onClick={() => setQuantity(2)}
        >
          <h4 className="text-xl sm:text-2xl">2</h4>
        </div>
        <div
          className={`flex flex-1 justify-center flex-wrap border-4 rounded-md p-5 px-12 cursor-pointer ${
            quantity > 2 ? "border-green-700" : "border-gray-300"
          }`}
          onClick={() => setQuantity(3)}
        >
          <h4 className="text-xl sm:text-2xl">Custom</h4>
        </div>
        {quantity > 2 && (
          <div className="flex flex-1 justify-end min-w-[calc(50%-0.75rem)] sm:min-w-[auto]">
            <div
              className={`flex border-4 rounded-md ${
                quantity > 2 ? "border-green-700" : "border-gray-300"
              }`}
            >
              <a
                className="btn text-2xl font-bold px-5 py-5 cursor-pointer w-20 text-center"
                onClick={() => setQuantity(quantity - 1)}
              >
                <span className="pointer-events-none select-none">–</span>
              </a>
              <input
                type="number"
                className="text-center text-2xl font-bold sm:min-w-[9rem] w-full"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <a
                className="btn text-2xl font-bold px-5 py-5 cursor-pointer w-20 text-center"
                onClick={() => setQuantity(quantity + 1)}
              >
                <span className="pointer-events-none select-none">+</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const getLocation = (locations: Location[], name: string) => {
  return locations.find((location) => location.name === name);
};

export const getLocationAvailability = (
  location: Location | undefined,
  blockedDates: BlockedDate[] | undefined,
  collectionDate: Date | undefined
) => {
  if (!location || !collectionDate) return false;
  // If the location is open by default, and it's not a Wednesday, return false
  // This allows us to set default closed locations to be open on any day of the week
  if (location.defaultStatus !== "closed" && collectionDate.getDay() !== 3) return false;
  const isBlockedDate = blockedDates?.find((date) => {
    return (
      new Date(date.date).toDateString() === collectionDate.toDateString() &&
      // @ts-ignore
      date.locations.includes(location.name.toLowerCase())
    );
  });
  if (location.defaultStatus === "closed") return !!isBlockedDate;
  return !isBlockedDate;
};

export const blockedMatcher = (
  day: Date,
  blockedDates: BlockedDate[],
  selectedCollectionPoint: string | undefined,
  locations: Location[]
) => {
  if (checkDateIsExplicitlyOpen(day, blockedDates, locations)) {
    return false;
  }
  if (day.getDay() !== 3) {
    return true;
  }
  if (blockedDates) {
    if (selectedCollectionPoint) {
      const selectedLocation = locations.find(
        (location) => location.name === selectedCollectionPoint
      );
      if (!selectedLocation) return false;
      const isBlockedDate = blockedDates.find((date) => {
        return (
          new Date(date.date).toDateString() === day.toDateString() &&
          date.locations.includes(selectedLocation.name)
        );
      });
      // If the location is closed by default, we kind of return "isOpenDate" (i.e. not blocked)
      if (selectedLocation.defaultStatus === "closed") return !isBlockedDate;
      // Otherwise, we return "isBlockedDate" (i.e. blocked)
      return !!isBlockedDate;
    } else {
      return getIsDateClosed(day, blockedDates, locations);
    }
  }
  return false;
};
export const formatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR"

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

export const setCollectionDateFromInput = (
  setCollectionDate: Dispatch<SetStateAction<Date | undefined>>,
  date: Date,
  collectionDate: Date | undefined,
  setSelectedCollectionPoint: Dispatch<SetStateAction<string | undefined>>,
  setDateInPast?: Dispatch<SetStateAction<boolean>>
) => {
  const newDate = new Date(date || "");
  newDate.setHours(newDate.getHours() + 9);
  if (setDateInPast) {
    setDateInPast(newDate < new Date());
  }
  if (collectionDate?.toDateString() === newDate.toDateString()) {
    setCollectionDate(undefined);
    setSelectedCollectionPoint(undefined);
    return;
  }
  setCollectionDate(newDate);
};

const ProductDisplay: NextPage<OrderProps> = ({
  customer,
  invoicesList,
  checkoutSessionsList,
  locations,
  blockedDates
}) => {
  const user = useUser({ redirectTo: "/login?returnPage=order" });
  const generalSettingsContext = useContext(SettingsContext);
  const allProducts = (generalSettingsContext?.products || []).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  // const invoices = invoicesList.data;
  // const checkoutSessions = checkoutSessionsList.data.filter(
  //   (session) => session.payment_status === "paid"
  // );
  // console.log("invoices", invoices);
  // console.log("checkoutSessions", checkoutSessions);
  // console.log("subscription", subscription);
  // console.log();
  // const currentProduct = prices.find(
  //   // @ts-ignore
  //   (product) => product.default_price?.id === subscription?.items.data[0].price?.id
  // );
  const router = useRouter();

  const subscribe = async (priceId: string) => {
    if (!priceId) return;

    const response: NextApiResponse = await fetchJson("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId })
    });
    if (response.statusCode === 500) {
      console.error(response.statusMessage);
      return;
    }
    // const { url } = response;
    // window.location.href = url;
  };

  const order = async () => {
    if (!selectedItems.length) return;
    const checkoutItems = selectedItems
      .map((item) => {
        const p = allProducts.find((p) => p.slug === item.slug);
        return p
          ? {
              slug: item.slug,
              name: p.name,
              stripeProductId: p.stripeProductId,
              priceInCents: p.priceInCents,
              quantity: item.quantity
            }
          : null;
      })
      .filter(Boolean) as {
      slug: string;
      name: string;
      stripeProductId: string;
      priceInCents: number;
      quantity: number;
    }[];
    const totalQuantity = selectedItems.reduce((s, i) => s + i.quantity, 0);
    try {
      const response: NextApiResponse<{ url: string }> = await fetchJson("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          quantity: totalQuantity,
          collectionDate,
          collectionLocation: selectedCollectionPoint,
          notes: orderNotes
        })
      });
      // @ts-ignore
      if (response.url) {
        // @ts-ignore
        await router.push(response.url);
      }
      if (response.statusCode === 500) {
        console.error(response.statusMessage);
        return;
      }
    } catch (error: any) {
      console.error(error);
      setError(
        error.data?.message || "Something went wrong, please double check your order and try again"
      );
      Sentry.captureException(error);
    }
  };

  const toggleProduct = (slug: string) => {
    setSelectedItems((prev) => {
      if (prev.find((i) => i.slug === slug)) return prev.filter((i) => i.slug !== slug);
      return [...prev, { slug, quantity: 1 }];
    });
  };

  const setItemQuantity = (slug: string, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.slug !== slug));
      return;
    }
    setSelectedItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, quantity: qty } : i)));
  };

  const collectionPoints = locations.map((location) => location.name);
  const [selectedCollectionPoint, setSelectedCollectionPoint] = useState<string>();
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [collectionDate, setCollectionDate] = useState<Date>();
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  const css = `
.rdp {
    --rdp-cell-size: 40px;
    --rdp-accent-color: ${theme.extend.colors.mangetout};
    --rdp-background-color: ${theme.extend.colors.green["700"]};
    /* Switch to dark colors for dark themes */
    --rdp-accent-color-dark: ${theme.extend.colors.green["800"]};
    --rdp-background-color-dark: ${theme.extend.colors.green["900"]};
    /* Outline border for focused elements */
    --rdp-outline: 2px solid var(--rdp-accent-color);
    /* Outline border for focused and selected elements */
    --rdp-outline-selected: 2px solid rgba(0, 0, 0, 0.75);
}
.rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
    background-color: transparent;
    border-color: var(--rdp-accent-color);
}
`;

  if (!user?.user?.isLoggedIn) {
    return <div className="container max-w-5xl h-screen">Loading...</div>;
  }

  return (
    <>
      <style>{css}</style>
      <div className="container mb-24 max-w-5xl">
        {router.query.status === "cancelled" && (
          <div className="my-8 p-6 border-2 border-dashed border-carrot rounded-md ">
            <h4>Welcome back 👋🏻</h4>
            <b className="font-normal mt-1 block">
              No payment has been taken - select your order options below, then head to checkout
              again.
            </b>
          </div>
        )}

        <h1 className="text-3xl pt-8 sm:p-12 font-bold mb-16 text-underline-primary text-center">
          New Order
        </h1>

        {/* COLLECTION DATE */}
        <QuestionSection text="Collection Date:">
          <div className="flex-1 mx-auto">
            <DayPicker
              mode="single"
              className="p-2 border-4 rounded-md border-mangetout !mr-0"
              selected={collectionDate}
              fromDate={getNextOrderWed(blockedDates)}
              disabled={(day) =>
                blockedMatcher(day, blockedDates, selectedCollectionPoint, locations)
              }
              onSelect={(date) =>
                setCollectionDateFromInput(
                  setCollectionDate,
                  date as Date,
                  collectionDate,
                  setSelectedCollectionPoint
                )
              }
              required={true}
              modifiersClassNames={{
                selected: "!bg-green-800 !text-white",
                hover: "!bg-green-300 !text-white"
              }}
            />
          </div>
        </QuestionSection>

        {/* PRODUCTS */}
        <QuestionSection text="Select Products:">
          {allProducts.map((product) => {
            const item = selectedItems.find((i) => i.slug === product.slug);
            const isSelected = !!item;
            return (
              <div
                key={product.slug}
                className={`flex flex-1 sm:flex-initial sm:max-w-xs flex-col items-center justify-center text-center border-4 rounded-md my-auto py-4 px-6 min-h-32 cursor-pointer transition-colors ${
                  isSelected ? "border-green-700 bg-green-50" : "border-gray-300"
                }${!product.available ? " cursor-not-allowed opacity-50" : ""}`}
                onClick={() => product.available && toggleProduct(product.slug)}
              >
                <h4 className="text-xl sm:text-2xl mb-1">{product.name}</h4>
                <span className="text-sm text-gray-500 mb-2">
                  {formatter.format(product.priceInCents / 100)}
                </span>
                {isSelected && (
                  <div
                    className="flex items-center gap-3 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-8 h-8 border-2 border-green-700 rounded-full text-lg font-bold text-green-700 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                      onClick={() => setItemQuantity(product.slug, (item?.quantity ?? 1) - 1)}
                    >
                      –
                    </button>
                    <span className="text-lg font-bold w-6 text-center">{item?.quantity}</span>
                    <button
                      className="w-8 h-8 border-2 border-green-700 rounded-full text-lg font-bold text-green-700 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                      onClick={() => setItemQuantity(product.slug, (item?.quantity ?? 1) + 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </QuestionSection>

        {/* COLLECTION POINT */}
        <QuestionSection text="Collect from:">
          {collectionPoints.map((point) => {
            const location = getLocation(locations, point);
            const isAvailable = getLocationAvailability(location, blockedDates, collectionDate);
            return (
              <MultiSelect
                key={point}
                item={point}
                label={
                  location ? (
                    <div>
                      {point}
                      <br />
                      <small className="text-xs">
                        {location.availableFrom} - {location.availableTo}
                      </small>
                    </div>
                  ) : (
                    point
                  )
                }
                isAvailable={isAvailable}
                selectedItem={selectedCollectionPoint}
                setSelectedItem={setSelectedCollectionPoint}
              />
            );
          })}
        </QuestionSection>

        {/* ORDER NOTES */}
        <QuestionSection text="Order Notes:">
          <textarea
            className="flex-1 bg-white max-w-full w-[32rem] xl:w-[36rem] p-2 border-2 border-chickpea focus:outline-mangetout rounded-md"
            placeholder="Anything else we should know?"
            onChange={(e) => setOrderNotes(e.target.value)}
          />
        </QuestionSection>
      </div>
      {/* CHECKOUT */}
      <div className="bg-rainwater border-t-2 border-chickpea py-4 pt-4 pb-8 mb-24 sm:pb-4 sticky bottom-0 left-0 right-0 z-10">
        {error && (
          <div className="container max-w-5xl mx-auto flex items-center justify-center my-8 p-4 border-2 border-dashed border-carrot rounded-md ">
            {error}
          </div>
        )}
        <div className="container max-w-5xl mx-auto flex flex-1 flex-col sm:flex-row sm:items-center">
          <h2 className="flex-1 self-end mb-4 sm:mb-0">
            Total: &nbsp;
            <span className="text-mangetout">
              {formatter.format(
                selectedItems.reduce((sum, item) => {
                  return (
                    sum +
                    (item.quantity *
                      (allProducts.find((p) => p.slug === item.slug)?.priceInCents ?? 0)) /
                      100
                  );
                }, 0)
              )}
            </span>
          </h2>
          <button
            disabled={!selectedItems.length || !selectedCollectionPoint || !collectionDate}
            className="bg-green-700 flex-initial sm:w-64 text-white px-5 py-3 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={order}
          >
            Check out &nbsp;&rarr;
          </button>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
  // const { user } = await fetchJson("/api/user", { req, res });

  // // temp redirect for summer
  // return {
  //   redirect: {
  //     destination: "/?status=store-closed",
  //     permanent: false
  //   }
  // };

  if (!req.session.user?.isLoggedIn)
    return {
      redirect: {
        destination: "/login?returnPage=order",
        permanent: false
      }
    };
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");
  // const customer = await fetchJson(`${process.env.APP_URL}/api/fetch-customer-data`, {
  //   headers
  // });
  const blockedDates = await fetchJson(`${process.env.APP_URL}/api/get-blocked-dates`, {
    headers
  });
  // const invoicesList = await fetchJson(`${process.env.APP_URL}/api/get-invoices`, {
  //   headers
  // });
  // const checkoutSessionsList = await fetchJson(`${process.env.APP_URL}/api/get-checkout-sessions`, {
  //   headers
  // });
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN,
    useCdn: false
  });
  const language = getCookies({ req, res })["groentetas/lang"] || "en-gb";

  const query = `*[_type == "location" &&  __i18n_lang == "${language}" && !(_id in path('drafts.**'))]`;
  const locations = await client.fetch(query);

  return {
    props: {
      user: req.session.user || null,
      locations,
      blockedDates
      // invoicesList,
      // checkoutSessionsList
    }
  };
}, sessionOptions);

export default ProductDisplay;
