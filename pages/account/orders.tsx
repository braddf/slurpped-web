import React, { useContext, useState } from "react";
import fetchJson from "../../lib/fetchJson";
import { NextPage } from "next";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../../lib/session";
import { useRouter } from "next/router";
import useUser from "../../lib/useUser";
import { SettingsContext } from "../_app";

type SerializedOrder = {
  id: string;
  status: string;
  product: string;
  deliverySlot: string;
  deliveryDate: number | null;
  total: number | null;
  createdAt: string;
};

type OrdersProps = {
  orders: SerializedOrder[];
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const STATUS_COLOURS: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-yellow-100 text-yellow-800",
  refunded: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700"
};

const OrdersPage: NextPage<OrdersProps> = ({ orders }) => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/login" });
  const settings = useContext(SettingsContext);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Map product slug → display name using SettingsContext products
  const getProductName = (slug: string) => {
    const product = settings?.products?.find((p) => p.slug.current === slug);
    return product?.name || slug;
  };

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
        <h2 className="text-5xl text-soil">Your Orders</h2>
        <button
          className="px-4 py-2 border-2 border-soil rounded-full text-sm hover:bg-chickpea transition-colors disabled:opacity-50"
          onClick={openBillingPortal}
          disabled={managingSubscription}
        >
          {managingSubscription ? "Loading..." : "Manage subscription"}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {orders.length === 0 && (
          <div className="text-broth py-12 text-center">No orders yet.</div>
        )}
        {orders.map((order) => {
          const deliveryDateStr = order.deliveryDate
            ? new Date(order.deliveryDate).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
              })
            : null;
          const statusColour = STATUS_COLOURS[order.status] || "bg-gray-100 text-gray-600";

          return (
            <div
              key={order.id}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 border border-gray-200 rounded-xl p-4 text-sm"
            >
              <div className="col-span-2 sm:col-span-2 font-medium self-center text-soil">
                {getProductName(order.product)}
              </div>
              <div className="sm:text-center self-center text-broth capitalize">
                {order.deliverySlot || "—"}
                {deliveryDateStr && (
                  <span className="block text-xs text-gray-400">{deliveryDateStr}</span>
                )}
              </div>
              <div className="sm:text-center self-center">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-right self-center font-medium text-soil">
                {order.total != null ? GBP.format(order.total / 100) : "—"}
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
  headers.append("Cookie", req?.headers.cookie || "");

  let orders: SerializedOrder[] = [];
  try {
    const result: any = await fetchJson(`${process.env.APP_URL}/api/user/orders`, { headers });
    orders = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  return {
    props: {
      user: req.session.user,
      orders
    }
  };
}, sessionOptions);

export default OrdersPage;
