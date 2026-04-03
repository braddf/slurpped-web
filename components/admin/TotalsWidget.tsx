import React, { useContext } from "react";
import Order from "../../models/Order";
import { SettingsContext } from "../../pages/_app";

// Sums quantity for a given product across orders, with fallback for legacy orders (no items)
const sumQuantity = (orders: Order[], productSlug?: string, legacyName?: string): number =>
  orders.reduce((sum, o) => {
    if (productSlug) {
      if (o.items?.length) {
        const item = o.items.find((i) => i.slug === productSlug);
        return sum + Number(item?.quantity ?? 0);
      }
      // Legacy: product is a summary string, quantity is total — match by display name
      return sum + (legacyName && o.product === legacyName ? Number(o.quantity) : 0);
    }
    // Total: sum all item quantities for new orders, order.quantity for legacy
    return (
      sum +
      (o.items?.length ? o.items.reduce((s, i) => s + Number(i.quantity), 0) : Number(o.quantity))
    );
  }, 0);

export const TotalsWidget: React.FC<{ title: string; orders: Order[] }> = ({ title, orders }) => {
  const settings = useContext(SettingsContext);
  const activeOrders = orders.filter((o) => ["paid", "unpaid"].includes(o.status));

  // Canonical list from Sanity (sorted), so all products show even at 0
  const sanityProducts = (settings?.products || []).sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  // Append any legacy product names from old orders that aren't in Sanity
  const legacyNames = Array.from(
    new Set(
      activeOrders
        .filter((o) => !o.items?.length)
        .map((o) => o.product)
        .filter((name) => !sanityProducts.some((p) => p.name === name))
    )
  );

  return (
    <div
      className={`flex flex-col border border-sweetcorn rounded-md items-center p-4 w-full ${
        activeOrders.length > 0 ? "bg-potato" : "opacity-25"
      }`}
    >
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <div className="grid grid-cols-2 justify-around w-full gap-x-3 gap-y-2">
        {sanityProducts.map((product) => {
          const qty = sumQuantity(activeOrders, product.slug, product.name);
          const collected = sumQuantity(
            activeOrders.filter((o) => o.collected),
            product.slug,
            product.name
          );
          const uncollected = sumQuantity(
            activeOrders.filter((o) => !o.collected),
            product.slug,
            product.name
          );
          return (
            <div
              key={product.slug}
              className="flex flex-col items-center text-center tracking-wide min-w-[4rem]"
            >
              <span className="text-xs uppercase block leading-tight">{product.name}</span>
              <span className="text-2xl font-bold block">{qty}</span>
              <span title="Collected / Uncollected" className="text-xs text-gray-500 block">
                {collected} / {uncollected}
              </span>
            </div>
          );
        })}
        {legacyNames.map((name) => {
          const qty = sumQuantity(activeOrders, undefined, name);
          const collected = sumQuantity(
            activeOrders.filter((o) => o.collected),
            undefined,
            name
          );
          const uncollected = sumQuantity(
            activeOrders.filter((o) => !o.collected),
            undefined,
            name
          );
          return (
            <div
              key={name}
              className="flex flex-col items-center text-center tracking-wide min-w-[4rem]"
            >
              <span className="text-xs uppercase block leading-tight">{name}</span>
              <span className="text-2xl font-bold block">{qty}</span>
              <span title="Collected / Uncollected" className="text-xs text-gray-500 block">
                {collected} / {uncollected}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
