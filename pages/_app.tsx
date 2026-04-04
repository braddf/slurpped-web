import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import Layout from "../components/Layout";
import fetchJson from "../lib/fetchJson";
import { SWRConfig } from "swr";
import "../components/styles.scss";
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { getCookie, getCookies } from "cookies-next";
import { createClient } from "@sanity/client";
import { NextPageContext } from "next";
import { GeneralSettings, MainMenu } from "../types";
import App from "next/app";
import * as Sentry from "@sentry/nextjs";
import useUser from "../lib/useUser";
import { setUser } from "@sentry/nextjs";
import { load, trackPageview } from "fathom-client";
import Router from "next/router";

const useLang: () => [string, Dispatch<SetStateAction<string>>] = () => {
  const [currentLang, setCurrentLang] = useState<string>("en-gb");
  useEffect(() => {
    const lang = getCookie("groentetas/lang");
    if (typeof lang === "string") setCurrentLang(lang);
  }, []);
  return [currentLang, setCurrentLang];
};

const SentryUserManager: React.FC = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user && user.isLoggedIn) {
      setUser({
        email: user.email ?? undefined,
        userId: user.userId ?? undefined,
        username: `${user.firstName} ${user.lastName}` ?? undefined
      });
    } else {
      setUser(null);
    }
  }, [user]);
  return null;
};

export const SettingsContext = createContext<GeneralSettings | null>(null);

Router.events.on("routeChangeComplete", (as, routeProps) => {
  if (!routeProps.shallow) {
    trackPageview();
  }
});

function MyApp({
  Component,
  pageProps,
  generalSettings,
  mainMenu
}: AppProps & { generalSettings: GeneralSettings; mainMenu: MainMenu }) {
  const [currentLang] = useLang();

  // Initialize Fathom when the app loads
  useEffect(() => {
    load(process.env.NEXT_PUBLIC_FATHOM_ID ?? "", {
      // Add options here
    });
  }, []);

  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
        onError: (err) => {
          console.error(err);
        }
      }}
    >
      {/*<LanguageSwitcher setCurrentLang={setCurrentLang} />*/}
      <SettingsContext.Provider value={generalSettings}>
        <Layout lang={currentLang} menu={mainMenu}>
          <Component {...pageProps} />
        </Layout>
        <SentryUserManager />
      </SettingsContext.Provider>
    </SWRConfig>
  );
}

MyApp.getInitialProps = async (context: AppContext) => {
  const appContext = App.getInitialProps(context);
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN,
    useCdn: true
  });

  const language = getCookies(context.ctx)["groentetas/lang"] || "en-gb";

  const settingsQuery = `*[_type == "general-settings"][0]`;
  const productsQuery = `*[_type == "product" && available == true] | order(sortOrder asc)`;
  const menuQuery = `*[_type == "main-menu"]{
    ...,
    "links": links[].page->{
      _id,
      _type,
      title,
      "overrideTitle": overrideTitle
    }
  }[0]`;

  let generalSettings: any;
  let mainMenu: any;
  let products: any[] = [];
  try {
    await client.fetch(settingsQuery).then((p: GeneralSettings) => {
      generalSettings = p;
    });
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
  }
  try {
    products = (await client.fetch(productsQuery)) || [];
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
  }
  try {
    await client.fetch(menuQuery).then((p: MainMenu) => {
      mainMenu = p;
    });
  } catch (e) {
    Sentry.captureException(e);
    console.error(e);
  }

  return {
    ...appContext,
    generalSettings: { ...generalSettings, products },
    mainMenu
  };
};
export default MyApp;
