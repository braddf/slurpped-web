import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import fetchJson from "../../lib/fetchJson";
import { NextApiResponse, NextPage, NextPageContext } from "next";
import { Stripe } from "stripe";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { useRouter } from "next/router";
import "react-day-picker/dist/style.css";
import { router } from "next/client";

type OrderProps = {
  customer: Stripe.Customer;
  pricesList: Stripe.ApiList<Stripe.Price>;
  invoicesList: Stripe.ApiList<Stripe.Invoice>;
  checkoutSessionsList: Stripe.ApiList<Stripe.Checkout.Session> | null;
};

const ProductDisplay: NextPage<OrderProps> = ({
  customer,
  pricesList,
  invoicesList,
  checkoutSessionsList
}) => {
  // console.log("customer", customer);
  // const subscription = customer?.subscriptions?.data[0];
  // const prices = pricesList.data;
  // const invoices = invoicesList.data;
  // console.log("invoices", invoices);
  // console.log("checkoutSessions", checkoutSessions);
  // console.log("subscription", subscription);
  const checkoutSessions =
    checkoutSessionsList?.data.filter((session) => session.payment_status === "paid") || [];
  const router = useRouter();
  const mostRecentOrder = checkoutSessions?.[0];
  const [checkoutSessionsFormatted, setCheckoutSessionsFormatted] = useState<any[]>([]);
  const [mostRecentOrderCollectionDate, setMostRecentOrderCollectionDate] = useState<Date | null>(
    null
  );
  useEffect(() => {
    const checkoutSessionsFormatted = checkoutSessions.map((session) => {
      const createdAt = new Date(session.created * 1000);
      const collectOn =
        Number(session.metadata?.collectionDate) > 0
          ? new Date(Number(session.metadata?.collectionDate))
          : "";
      return {
        ...session,
        createdAt,
        collectOn
      };
    });
    setCheckoutSessionsFormatted(checkoutSessionsFormatted);
    setMostRecentOrderCollectionDate(
      mostRecentOrder?.metadata?.collectionDate
        ? new Date(Number(mostRecentOrder?.metadata?.collectionDate))
        : null
    );
  }, []);

  return (
    <>
      {/* PAST ORDERS */}
      <div className="flex flex-1 flex-col mb-6 container mt-12">
        {router.query.status === "orderSuccess" && mostRecentOrder && (
          <div className="border-4 border-sweetcorn my-12 rounded-md px-6 py-4">
            <h4 className="mt-1 mb-3">Thank you for your order! 🎉</h4>
            <b className="mb-1 block">
              It will be ready to collect on Wednesday{" "}
              {mostRecentOrderCollectionDate
                ? mostRecentOrderCollectionDate.toLocaleDateString()
                : null}
              .
            </b>
          </div>
        )}

        <h2>Your Orders</h2>
        <div className="flex flex-col flex-1 my-4">
          <div className="grid-cols-9 hidden sm:grid flex-1 border border-gray-400 rounded-md p-5 mb-5 font-bold">
            <div className="sm:col-span-2">Product</div>
            <div className="sm:col-span-2 text-center">Payment Date</div>
            <div className="sm:col-span-2 text-center">Collection Date</div>
            <div className="sm:col-span-2 text-center">Quantity</div>
            <div className="text-right">Total</div>
          </div>
          {checkoutSessionsFormatted.map((session) => {
            return (
              <div
                className="text-sm sm:text-base grid grid-cols-2 gap-3 sm:grid-cols-9 flex-1 border border-gray-400 rounded-md p-5 mb-5"
                key={session.id}
              >
                <div className="font-bold col-span-2 sm:col-span-2 self-center">
                  {session.line_items?.data[0].description}
                </div>
                <div className="sm:col-span-2 sm:text-center self-center">
                  {session.createdAt.toLocaleString()}
                </div>
                <div className="sm:col-span-2 text-right sm:text-center self-center">
                  {typeof session.collectOn === "object" && session.collectOn.toLocaleDateString()}
                </div>
                <div className="sm:col-span-2 sm:text-center self-center">
                  x {session.line_items?.data[0].quantity}
                </div>
                <div className="text-right self-center">
                  {(Number(session.amount_total) / 100).toFixed(2)}€
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = withIronSessionSsr(async ({ req, res }) => {
  // const { user } = await fetchJson("/api/user", { req, res });
  if (!req.session.user)
    return {
      notFound: true
    };
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");
  // const customer = await fetchJson(`${process.env.APP_URL}/api/fetch-customer-data`, {
  //   headers
  // });
  // const pricesList = await fetchJson(`${process.env.APP_URL}/api/get-prices`, {
  //   headers
  // });
  // const invoicesList = await fetchJson(`${process.env.APP_URL}/api/get-invoices`, {
  //   headers
  // });
  let checkoutSessionsList: unknown = null;
  try {
    checkoutSessionsList = await fetchJson(`${process.env.APP_URL}/api/get-checkout-sessions`, {
      headers
    });
  } catch (error) {
    console.log("error", error);
  }

  return {
    props: {
      user: req.session.user,
      // customer,
      // pricesList,
      // invoicesList,
      checkoutSessionsList
    }
  };
}, sessionOptions);

export default ProductDisplay;
