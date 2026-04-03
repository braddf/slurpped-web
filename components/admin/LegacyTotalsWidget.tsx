import React from "react";
import Order from "../../models/Order";
import { sumOrdersWithQuantity } from "../../helpers/utils";

export const LegacyTotalsWidget: React.FC<{ title: string; orders: Order[] }> = ({
  title,
  orders
}) => {
  const activeOrders = orders.filter((o) => ["paid", "unpaid"].includes(o.status));
  const tasOnly = activeOrders.filter((o) => !o.product.toLowerCase().includes("mush"));
  const tasAndMush = activeOrders.filter((o) => o.product.toLowerCase().includes("mush"));
  return (
    <div
      className={`flex flex-col border border-sweetcorn rounded-md items-center p-4 w-full ${
        orders.length > 0 ? "bg-potato" : "opacity-25"
      }`}
    >
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <div className="flex flex-row justify-between w-full gap-2">
        <div className="flex flex-col items-center justify-center text-center tracking-wide">
          <span className="text-xs uppercase block">Tassen</span>
          <span title="Total Tassen" className="text-lg block">
            {sumOrdersWithQuantity(activeOrders)}
          </span>
          <span title="Collected / Uncollected" className="text-xs uppercase block">
            {sumOrdersWithQuantity(activeOrders.filter((o) => o.collected))} /{" "}
            {sumOrdersWithQuantity(activeOrders.filter((o) => !o.collected))}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-center tracking-wide">
          <span className="text-xs uppercase block">Tas only</span>
          <span title="Total without Mushrooms" className="text-lg">
            {sumOrdersWithQuantity(tasOnly)}
          </span>
          <span title="Collected / Uncollected" className="text-xs uppercase block">
            {sumOrdersWithQuantity(tasOnly.filter((o) => o.collected))} /{" "}
            {sumOrdersWithQuantity(tasOnly.filter((o) => !o.collected))}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-center tracking-wide">
          <span className="text-xs uppercase block">Tas + 🍄</span>
          <span title="Total with Mushrooms" className="text-lg">
            {sumOrdersWithQuantity(tasAndMush)}
          </span>
          <span title="Collected / Uncollected" className="text-xs uppercase block">
            {sumOrdersWithQuantity(tasAndMush.filter((o) => o.collected))} /{" "}
            {sumOrdersWithQuantity(tasAndMush.filter((o) => !o.collected))}
          </span>
        </div>
      </div>
    </div>
  );
};
