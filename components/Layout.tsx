import Head from "next/head";
import Header from "../components/Header";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import React, { useContext } from "react";
import Link from "next/link";
import { SettingsContext } from "../pages/_app";
import { getPageSlug } from "../helpers/utils";
import { MainMenu } from "../types";

export default function Layout({
  children,
  lang,
  menu
}: {
  children: React.ReactNode;
  lang: string;
  menu: MainMenu;
}) {
  const generalSettings = useContext(SettingsContext);
  return (
    <>
      <Head>
        <title>Groentetas</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/*@ts-ignore*/}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/groentetas.webmanifest" />
        {/*<meta name="apple-mobile-web-app-capable" content="yes" />*/}
        {/*<meta name="apple-mobile-web-app-status-bar-style" content="default" />*/}
      </Head>
      <style jsx global>
        {`
          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #333;
            font-family: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
              "Segoe UI Symbol", "Noto Color Emoji";
          }
        `}
      </style>
      <div className="w-full flex flex-col min-h-screen bg-rainwater relative">
        <Header lang={lang} menu={menu} />

        <main className="flex-1">
          <div>{children}</div>
        </main>

        <footer className="container">
          <hr className="h-1.5 rounded-full bg-sweetcorn" />
          <div className="py-8 grid grid-cols-1 min-[374px]:grid-cols-2 lg:grid-cols-4 justify-center ">
            <div className="flex flex-col text-lg gap-1 py-8">
              {menu?.links?.map((item) => (
                <Link key={item._id} href={getPageSlug(item._type)}>
                  {item.overrideTitle || item.title}
                </Link>
              ))}
              {/*<Link href={"/about"}>About Us</Link>*/}
              {/*<Link href={"/contact"}>Contact</Link>*/}
              {/*<Link href={"/faqs"}>FAQs</Link>*/}
              {/*<Link href={"/recipes"}>Recipes</Link>*/}
              <div className="socials flex gap-2">
                {/*<a href="https://www.facebook.com/groentetas">*/}
                {/*  <Image src="/facebook.svg" width="32" height="32" alt="facebook-logo" />*/}
                {/*</a>*/}
                {/*<a href="https://www.instagram.com/groentetas">*/}
                {/*  <Image src="/instagram.svg" width="32" height="32" alt="instagram-logo" />*/}
                {/*</a>*/}
              </div>
            </div>
            <div className="flex flex-col items-end lg:items-start start gap-2 py-8">
              <Link href={"/info/terms-of-use"}>Terms of Use</Link>
              <Link href={"/info/refunds"}>Refund Policy</Link>
              <Link href={"/info/returns"}>Returns Policy</Link>
              <Link href={"/info/privacy"}>Privacy Policy</Link>
            </div>
            <div className="col-span-1 order-2 min-[450px]:order-1 flex flex-col py-8">
              <Link href={`mailto:${generalSettings?.contactEmail}`} className="text-sm">
                {generalSettings?.contactEmail}
              </Link>
              <Link href={`tel:${generalSettings?.contactPhone}`} className="text-sm mt-2">
                {generalSettings?.contactPhone}
              </Link>
              <p className="text-sm">{generalSettings?.contactAddress}</p>
              <p className="text-sm">© Groentetas Utrecht {new Date().getFullYear()}</p>
            </div>
            <div className="col-span-2 order-1 min-[450px]:order-2 min-[450px]:col-span-1 flex flex-col py-8 items-center min-[450px]:items-end">
              <div className="-mt-3 mb-3">
                <Image
                  src="/NewLogo.png"
                  className="-mt-3 mb-3"
                  alt="Groentetas Logo"
                  width={168}
                  height={80}
                />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
