import React, { useState, useEffect } from "react";
import fetchJson from "../../lib/fetchJson";
import { NextPage } from "next";
import { Stripe } from "stripe";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { useRouter } from "next/router";
import useUser from "../../lib/useUser";

type OrderProps = {
  checkoutSessionsList: Stripe.ApiList<Stripe.Checkout.Session> | null;
};

const OrdersPage: NextPage<OrderProps> = ({ checkoutSessionsList }) => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/login" });
  const [managingSubscription, setManagingSubscription] = useState(false);

  const checkoutSessions =
    checkoutSessionsList?.data.filter((session) => session.payment_status === "paid") || [];

  const openBillingPortal = async () => {
    setManagingSubscription(true);
    try {
      const response: any = await fetchJson("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      console.error(err);
      setManagingSubscription(false);
    }
  };

  if (!user?.isLoggedIn) {
    return <div className="container max-w-4xl h-screen">Loading...</div>;
  }

  return (
    <div className="container max-w-4xl mt-12 mb-24">
      {(router.query.status === "orderSuccess" || router.query.status === "subscribeSuccess") && (
        <div className="border-4 border-green-600 my-8 rounded-md px-6 py-4">
          <h4 className="mt-1 mb-2">Thank you for your order!</h4>
          <p className="text-gray-700">
            {router.query.status === "subscribeSuccess"
              ? "Your subscription is now active. You'll receive an email confirmation shortly."
              : "Your order is confirmed. You'll receive an email with your delivery details."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Orders</h2>
        <button
          className="px-4 py-2 border-2 border-gray-300 rounded-md text-sm hover:border-green-700 transition-colors disabled:opacity-50"
          onClick={openBillingPortal}
          disabled={managingSubscription}
        >
          {managingSubscription ? "Loading..." : "Manage subscription"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {checkoutSessions.length === 0 && (
          <div className="text-gray-400 py-8 text-center">No orders yet.</div>
        )}
        {checkoutSessions.map((session) => {
          const createdAt = new Date(session.created * 1000);
          const deliverySlot = session.metadata?.deliverySlot || "";
          const deliveryAddressStr = session.metadata?.deliveryAddress
            ? (() => {
                try {
                  const a = JSON.parse(session.metadata.deliveryAddress);
                  return [a.line1, a.city, a.postcode].filter(Boolean).join(", ");
                } catch {
                  return "";
                }
              })()
            : "";

          return (
            <div
              key={session.id}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 border border-gray-300 rounded-md p-4 text-sm"
            >
              <div className="col-span-2 sm:col-span-2 font-medium self-center">
                {session.metadata?.product || "Order"}
              </div>
              <div className="sm:text-center self-center text-gray-600">
                {createdAt.toLocaleDateString("en-GB")}
              </div>
              <div className="sm:text-center self-center capitalize text-gray-600">
                {deliverySlot || "—"}
                {deliveryAddressStr && (
                  <span className="block text-xs text-gray-400">{deliveryAddressStr}</span>
                )}
              </div>
              <div className="text-right self-center font-medium">
                £{((Number(session.amount_total) || 0) / 100).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async ({ req }) => {
  if (!req.session.user?.isLoggedIn)
    return { redirect: { destination: "/login", permanent: false } };

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");

  let checkoutSessionsList: unknown = null;
  try {
    checkoutSessionsList = await fetchJson(`${process.env.APP_URL}/api/get-checkout-sessions`, {
      headers
    });
  } catch (error) {
    console.error("Error fetching checkout sessions:", error);
  }

  return {
    props: {
      user: req.session.user,
      checkoutSessionsList
    }
  };
}, sessionOptions);

export default OrdersPage;
