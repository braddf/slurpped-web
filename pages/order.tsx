import React, { useContext, useEffect, useState } from "react";
import fetchJson from "../lib/fetchJson";
import { NextPage } from "next";
import { withIronSessionSsr } from "iron-session/next";
import sessionOptions from "../lib/session";
import { useRouter } from "next/router";
import useUser from "../lib/useUser";
import * as Sentry from "@sentry/nextjs";
import { OrderItem } from "../types";
import { SettingsContext } from "./_app";

type DeliverySlot = "thursday" | "friday" | "saturday";

type DeliveryAddress = {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
};

const SLOT_LABELS: Record<DeliverySlot, string> = {
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday"
};

export const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

const emptyAddress: DeliveryAddress = { line1: "", line2: "", city: "", postcode: "" };

const OrderPage: NextPage = () => {
  const { user } = useUser({ redirectTo: "/login?returnPage=order" });
  const generalSettingsContext = useContext(SettingsContext);
  const allProducts = (generalSettingsContext?.products || []).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const router = useRouter();

  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<"once" | "subscribe">("once");
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot | "">("");
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill from saved defaults
  useEffect(() => {
    fetchJson("/api/user/delivery-defaults")
      .then((defaults: any) => {
        if (defaults?.deliverySlot) setDeliverySlot(defaults.deliverySlot as DeliverySlot);
        if (defaults?.deliveryAddress) setAddress({ line2: "", ...defaults.deliveryAddress });
      })
      .catch(() => {
        // No defaults saved — that's fine
      });
  }, []);

  // Pre-select product and order type from query params (e.g. from product page CTAs).
  // Intentionally depends only on router.isReady — we want this to fire once when
  // the query is first available, not re-run on every subsequent query change.
  useEffect(() => {
    if (!router.isReady) return;
    const productSlug = router.query.product as string | undefined;
    const type = router.query.type as string | undefined;
    if (productSlug) {
      setSelectedItems([{ slug: productSlug, quantity: 1 }]);
    }
    if (type === "subscribe" || type === "once") {
      setOrderType(type);
    }
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectedProduct =
    selectedItems.length === 1
      ? allProducts.find((p) => p.slug.current === selectedItems[0].slug)
      : undefined;

  const canSubscribe =
    selectedItems.length === 1 && !!selectedProduct?.stripePriceId;

  const addressValid =
    address.line1.trim() && address.city.trim() && address.postcode.trim();

  const canCheckout =
    selectedItems.length > 0 &&
    !!deliverySlot &&
    !!addressValid &&
    (orderType === "once" || canSubscribe);

  const checkout = async () => {
    if (!canCheckout) return;
    setError("");
    setLoading(true);

    try {
      if (saveAsDefault) {
        await fetchJson("/api/user/delivery-defaults", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliverySlot, deliveryAddress: address })
        }).catch(() => {}); // non-blocking
      }

      if (orderType === "subscribe" && selectedProduct?.stripePriceId) {
        const response: any = await fetchJson("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: selectedProduct.stripePriceId,
            productSlug: selectedProduct.slug.current,
            deliveryDayPreference: deliverySlot,
            deliveryAddress: address
          })
        });
        if (response?.url) {
          window.location.href = response.url;
          return;
        }
        throw new Error(response?.message || "Failed to create checkout session");
      } else {
        const checkoutItems = selectedItems
          .map((item) => {
            const p = allProducts.find((p) => p.slug.current === item.slug);
            return p
              ? {
                  slug: item.slug,
                  name: p.name,
                  stripeProductId: p.stripeProductId,
                  priceInPence: p.priceInPence,
                  quantity: item.quantity
                }
              : null;
          })
          .filter(Boolean);

        const totalQuantity = selectedItems.reduce((s, i) => s + i.quantity, 0);

        const response: any = await fetchJson("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: checkoutItems,
            quantity: totalQuantity,
            deliverySlot,
            deliveryAddress: address,
            notes: orderNotes
          })
        });
        if (response?.url) {
          window.location.href = response.url;
          return;
        }
        throw new Error(response?.message || "Failed to create checkout session");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.data?.message || "Something went wrong, please try again");
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  };

  const total = selectedItems.reduce((sum, item) => {
    const p = allProducts.find((p) => p.slug.current === item.slug);
    return sum + (p ? (p.priceInPence * item.quantity) / 100 : 0);
  }, 0);

  if (!user?.isLoggedIn) {
    return <div className="container max-w-5xl h-screen">Loading...</div>;
  }

  return (
    <div className="container mb-24 max-w-5xl">
      {router.query.status === "cancelled" && (
        <div className="my-8 p-6 border-2 border-dashed border-carrot rounded-md">
          <h4>Welcome back</h4>
          <b className="font-normal mt-1 block">
            No payment has been taken — select your order options below, then head to checkout again.
          </b>
        </div>
      )}

      <h1 className="text-3xl pt-8 sm:p-12 font-bold mb-16 text-center">New Order</h1>

      {/* PRODUCTS */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl mb-4">Select your kit:</h2>
        <div className="flex flex-wrap gap-4">
          {allProducts.map((product) => {
            const item = selectedItems.find((i) => i.slug === product.slug.current);
            const isSelected = !!item;
            return (
              <div
                key={product.slug.current}
                className={`flex flex-col items-center justify-center text-center border-4 rounded-md py-4 px-6 min-h-32 cursor-pointer transition-colors w-full sm:w-56 ${
                  isSelected ? "border-green-700 bg-green-50" : "border-gray-300"
                }${!product.available ? " cursor-not-allowed opacity-50" : ""}`}
                onClick={() => product.available && toggleProduct(product.slug.current)}
              >
                <h4 className="text-lg font-semibold mb-1">{product.name}</h4>
                <span className="text-sm text-gray-500 mb-2">
                  {formatter.format(product.priceInPence / 100)}
                </span>
                {isSelected && (
                  <div className="flex items-center gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="w-8 h-8 border-2 border-green-700 rounded-full font-bold text-green-700 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                      onClick={() => setItemQuantity(product.slug.current, (item?.quantity ?? 1) - 1)}
                    >
                      –
                    </button>
                    <span className="font-bold w-6 text-center">{item?.quantity}</span>
                    <button
                      className="w-8 h-8 border-2 border-green-700 rounded-full font-bold text-green-700 flex items-center justify-center hover:bg-green-700 hover:text-white transition-colors"
                      onClick={() => setItemQuantity(product.slug.current, (item?.quantity ?? 1) + 1)}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ORDER TYPE */}
      {selectedItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl mb-4">Order type:</h2>
          <div className="flex gap-4">
            <button
              className={`flex-1 sm:flex-none px-6 py-3 border-4 rounded-md transition-colors ${
                orderType === "once" ? "border-green-700 bg-green-50" : "border-gray-300"
              }`}
              onClick={() => setOrderType("once")}
            >
              <div className="font-semibold">One-off</div>
              <div className="text-sm text-gray-500">Single purchase</div>
            </button>
            <button
              disabled={!canSubscribe}
              className={`flex-1 sm:flex-none px-6 py-3 border-4 rounded-md transition-colors ${
                orderType === "subscribe" ? "border-green-700 bg-green-50" : "border-gray-300"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={() => canSubscribe && setOrderType("subscribe")}
              title={!canSubscribe ? "Select a single Signature kit to subscribe" : undefined}
            >
              <div className="font-semibold">Subscribe</div>
              <div className="text-sm text-gray-500">Weekly — cancel anytime</div>
            </button>
          </div>
          {orderType === "subscribe" && (
            <p className="mt-3 text-sm text-gray-600">
              You&apos;ll be billed weekly. Manage or cancel anytime from your account.
            </p>
          )}
        </section>
      )}

      {/* DELIVERY SLOT */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl mb-4">Delivery day:</h2>
        <div className="flex gap-4 flex-wrap">
          {(["thursday", "friday", "saturday"] as DeliverySlot[]).map((slot) => (
            <button
              key={slot}
              className={`px-8 py-4 border-4 rounded-md transition-colors capitalize ${
                deliverySlot === slot ? "border-green-700 bg-green-50" : "border-gray-300"
              }`}
              onClick={() => setDeliverySlot(slot)}
            >
              {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      </section>

      {/* DELIVERY ADDRESS */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl mb-4">Delivery address:</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input
            type="text"
            className="border-2 border-gray-300 rounded-md p-3 focus:outline-none focus:border-green-700"
            placeholder="Address line 1 *"
            value={address.line1}
            onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
          />
          <input
            type="text"
            className="border-2 border-gray-300 rounded-md p-3 focus:outline-none focus:border-green-700"
            placeholder="Address line 2 (optional)"
            value={address.line2}
            onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
          />
          <input
            type="text"
            className="border-2 border-gray-300 rounded-md p-3 focus:outline-none focus:border-green-700"
            placeholder="City *"
            value={address.city}
            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
          />
          <input
            type="text"
            className="border-2 border-gray-300 rounded-md p-3 focus:outline-none focus:border-green-700 uppercase"
            placeholder="Postcode *"
            value={address.postcode}
            onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value.toUpperCase() }))}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            Save as my default delivery address
          </label>
        </div>
      </section>

      {/* ORDER NOTES */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl mb-4">Notes (optional):</h2>
        <textarea
          className="w-full max-w-md border-2 border-gray-300 rounded-md p-3 focus:outline-none focus:border-green-700"
          rows={3}
          placeholder="Anything we should know about your delivery?"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
        />
      </section>

      {/* STICKY CHECKOUT BAR */}
      <div className="bg-white border-t-2 border-gray-200 py-4 pb-8 sm:pb-4 sticky bottom-0 left-0 right-0 z-10">
        {error && (
          <div className="container max-w-5xl mx-auto mb-4 p-4 border-2 border-dashed border-red-400 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="container max-w-5xl mx-auto flex flex-1 flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="flex-1 text-xl font-semibold">
            Total:&nbsp;
            <span className="text-green-700">{formatter.format(total)}</span>
            {orderType === "subscribe" && (
              <span className="text-sm text-gray-500 font-normal ml-2">/ week</span>
            )}
          </h2>
          <button
            disabled={!canCheckout || loading}
            className="bg-green-700 sm:w-64 text-white px-5 py-3 rounded-md font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={checkout}
          >
            {loading
              ? "Loading..."
              : orderType === "subscribe"
              ? "Subscribe →"
              : "Checkout →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withIronSessionSsr(async ({ req }) => {
  if (!req.session.user?.isLoggedIn)
    return {
      redirect: {
        destination: "/login?returnPage=order",
        permanent: false
      }
    };

  return {
    props: {
      user: req.session.user || null
    }
  };
}, sessionOptions);

export default OrderPage;
