import Link from "next/link";
import useUser from "../lib/useUser";
import { useRouter } from "next/router";
import Image from "next/image";
import fetchJson from "../lib/fetchJson";
import React, { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../pages/_app";
import { MainMenu } from "../types";
import { getPageSlug } from "../helpers/utils";

function LinkItem({
  label,
  url,
  onClick = () => {},
  button = false
}: {
  label: string;
  url: string;
  onClick?: (...a: any[]) => void | Promise<void>;
  button?: boolean;
}) {
  const router = useRouter();
  const isActive = router.pathname === url;
  return (
    <li className={`mt-2 flex-initial inline-flex relative${button ? " px-3" : ""}`}>
      {/*{isActive && (*/}
      {/*  <span className="absolute h-1.5 w-1.5 rounded-full left-2.5 top-1/2 -mt-1 bg-soil" />*/}
      {/*)}*/}
      <Link href={url} legacyBehavior>
        <a
          onClick={onClick}
          className={`px-6 leading-[3rem] ${
            button ? "btn-outline py-0 mt-1" : "w-full hover:text-underline-primary"
          } ${isActive && !button ? "text-underline-primary" : ""}`}
        >
          {label}
        </a>
      </Link>
    </li>
  );
}

export const OrderButton = ({ loggedIn }: { loggedIn: boolean }) => {
  const settings = useContext(SettingsContext);
  return (
    <Link href={loggedIn ? "/order" : "/login?returnPage=order"} className="btn-primary">
      {settings?.orderButtonText || "Order Now"}
    </Link>
  );
};

function Header({ lang, menu }: { lang: string; menu: MainMenu }) {
  const { user, mutateUser } = useUser();
  const generalSettings = useContext(SettingsContext);
  const showAnnouncementBar = !!generalSettings?.showAnnouncementBar;
  const announcementBarText = generalSettings?.announcementBarText || "";
  const router = useRouter();
  useEffect(() => {
    router.events.on("routeChangeComplete", () => {
      setNavOpen(false);
    });
  }, [router.events]);

  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      {showAnnouncementBar && (
        <div className="flex w-full bg-soil items-center justify-center py-2 px-3">
          <span className="text-chickpea flex-initial text-center">{announcementBarText}</span>
        </div>
      )}
      <div className="header flex flex-initial w-full bg-rainwater sticky top-0 z-30">
        <div className="inline-flex items-center space-between w-full">
          {/*<Link href="/">*/}
          {/*</Link>*/}
          <Link className="flex-initial flex items-center pl-5" href="/">
            <Image src="/SlurppedLogo.png" width={120} height={40} alt="Slurpped" />
          </Link>
          <div className="px-4 sm:px-6 py-3 flex-1 flex justify-end">
            <OrderButton loggedIn={user?.isLoggedIn === true} />
          </div>
          <button
            onClick={() => setNavOpen(true)}
            className="flex-initial pr-6 pl-3 pt-3 pb-4 text-soil text-3xl justify-center self-center cursor-pointer"
          >
            {/* Burger menu icon */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
      <div
        onClick={() => setNavOpen(false)}
        className={`absolute inset-0 z-30 bg-soil-dark transition-all ${
          navOpen ? "opacity-75" : "opacity-0 pointer-events-none"
        }`}
      ></div>
      <nav
        className={`z-40 text-soil text-lg flex flex-col items-start fixed top-0 bottom-0 right-0 pb-3 w-80 sm:w-96 max-w-[90%] bg-rainwater overflow-scroll transition-all ${
          navOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setNavOpen(false)}
          className="text-soil text-3xl px-6 py-4 text-right absolute top-0 right-0 z-20"
        >
          &times;
        </button>
        <ul className="flex w-full flex-col flex-1 justify-start mt-2">
          {menu?.links?.map((item) => (
            <LinkItem
              key={item._id}
              label={item.overrideTitle || item.title}
              url={getPageSlug(item._type)}
            />
          ))}
          <hr className="mx-6 mt-2 mb-1 border-soil" />
          {user?.isLoggedIn !== true && (
            <>
              <LinkItem label="Log in" url="/login" />
              <LinkItem label="Sign up" url="/register" button />
            </>
          )}
          {user?.isLoggedIn === true && (
            <>
              <LinkItem label="My Orders" url="/account/orders" />
              <LinkItem
                label="Log out"
                url="/api/logout"
                onClick={async (e) => {
                  e.preventDefault();
                  mutateUser(await fetchJson("/api/logout", { method: "POST" }), false);
                  router.push("/login");
                }}
              />
              {user?.isAdmin && (
                <>
                  <hr className="mx-6 mt-2 mb-1 border-soil" />
                  <LinkItem label="Admin" url="/admin" />
                </>
              )}
            </>
          )}
        </ul>
        {user?.isLoggedIn && (
          <span className="text-xs self-center text-soil-light px-6 pt-4">
            Logged in as {user?.email}
          </span>
        )}
      </nav>
    </>
  );
}

export default Header;
