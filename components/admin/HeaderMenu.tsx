import React from "react";
import SidebarButton from "./SidebarButton";
import { usePathname } from "next/navigation";

const HeaderMenu = () => {
  const path = usePathname();
  const today = new Date();

  return (
    <div className="flex gap-6 mb-6">
      <div className="flex-initial flex gap-1 p-1 bg-potato border-2 border-sweetcorn rounded-lg">
        <SidebarButton text={"Orders"} selected={path === "/admin"} link={"/admin"} />
        <SidebarButton text={"Users"} selected={path === "/admin/users"} link={"/admin/users"} />
      </div>
      <div className="flex-initial flex flex-col items-end justify-end">
        {/* Date */}
        <span className="text-xs uppercase tracking-loose block">Today</span>
        <span className="text-md block">
          {today.toLocaleDateString("en-GB", {
            weekday: "short",
            month: "short",
            day: "numeric"
          })}
        </span>
      </div>
    </div>
  );
};

export default HeaderMenu;
