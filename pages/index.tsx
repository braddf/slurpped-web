import type { NextPage, NextPageContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { createClient } from "@sanity/client";
import { PortableText } from "@portabletext/react";
import { getIronSession } from "iron-session";
import { useContext } from "react";
import { SettingsContext } from "./_app";
import { WeeklySpecial, Product } from "../types";
import useUser from "../lib/useUser";
import * as Sentry from "@sentry/nextjs";

type HomeProps = {
  weeklySpecial: WeeklySpecial | null;
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const HOW_IT_WORKS = [
  { step: "01", title: "Choose Your Kit", body: "Pick from our rotating seasonal ramen kits, each designed by Ollie and built for your kitchen." },
  { step: "02", title: "Pick Your Delivery Day", body: "Choose Thursday, Friday, or Saturday delivery — whatever works for your week." },
  { step: "03", title: "It Arrives Chilled", body: "Your kit lands fresh, prepped, and ready to cook. Everything you need, nothing you don't." },
  { step: "04", title: "Cook & Slurp", body: "Restaurant-quality ramen in your own kitchen. Ready in minutes." }
];

const KitCard = ({ product }: { product: Product }) => (
  <Link
    href={`/products/${product.slug.current}`}
    className="flex flex-col bg-chickpea rounded-2xl p-6 border-2 border-sweetcorn hover:border-carrot transition-colors"
  >
    <h3 className="text-2xl text-soil mb-1">{product.name}</h3>
    <p className="text-broth font-medium mb-3">{GBP.format(product.priceInPence / 100)}</p>
    {product.allergens && product.allergens.length > 0 && (
      <p className="text-xs text-broth mt-auto pt-3 border-t border-sweetcorn">
        <span className="font-medium">Contains:</span> {product.allergens.join(", ")}
      </p>
    )}
  </Link>
);

const Home: NextPage<HomeProps> = ({ weeklySpecial }) => {
  const { user } = useUser();
  const settings = useContext(SettingsContext);
  const products = settings?.products || [];
  const nextWeekTeaser = settings?.nextWeekTeaser;
  const orderHref = user?.isLoggedIn ? "/order" : "/login?returnPage=order";

  return (
    <div>
      <Head>
        <meta name="description" content="Premium ramen meal kits, delivered to your door. Chef-led. British-sourced. Ready in minutes." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {/* Hero */}
        <section className="bg-sweetcorn min-h-[calc(100vh-56px)] flex items-center">
          <div className="container py-24 flex flex-col items-center text-center">
            <h1 className="text-6xl sm:text-7xl md:text-8xl text-soil leading-none mb-4">
              Restaurant ramen.<br />Your kitchen.
            </h1>
            <p className="text-xl text-broth max-w-lg mb-10 mt-4">
              Chef-crafted ramen kits made with premium British ingredients. Delivered fresh. Ready in minutes.
            </p>
            <Link
              href={orderHref}
              className="bg-carrot text-chickpea text-xl px-10 py-4 rounded-full font-medium hover:opacity-90 transition-opacity inline-block"
            >
              GET REAL RAMEN
            </Link>
          </div>
        </section>

        {/* This Week's Special */}
        {weeklySpecial?.published && (
          <section className="bg-soil text-chickpea py-20">
            <div className="container max-w-3xl">
              <p className="text-mangetout text-sm font-medium tracking-widest uppercase mb-3">This Week</p>
              <h2 className="text-5xl text-chickpea mb-6">
                {weeklySpecial.title || weeklySpecial.product?.name}
              </h2>
              {weeklySpecial.specialCopy && (
                <div className="text-lg text-chickpea/80 mb-8 rich-text">
                  <PortableText value={weeklySpecial.specialCopy} />
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {weeklySpecial.specialPrice != null ? (
                  <p className="text-2xl font-medium">{GBP.format(weeklySpecial.specialPrice / 100)}</p>
                ) : weeklySpecial.product?.priceInPence ? (
                  <p className="text-2xl font-medium">{GBP.format(weeklySpecial.product.priceInPence / 100)}</p>
                ) : null}
                <Link
                  href={weeklySpecial.product?.slug?.current
                    ? `/products/${weeklySpecial.product.slug.current}`
                    : orderHref}
                  className="bg-carrot text-chickpea px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Order the Special →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* The Kits */}
        {products.length > 0 && (
          <section className="py-20">
            <div className="container">
              <h2 className="text-5xl text-soil mb-3">The Kits</h2>
              <p className="text-broth mb-10">Each kit is designed by Ollie for your kitchen. No faff, no guessing.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <KitCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="bg-chickpea py-20">
          <div className="container">
            <h2 className="text-5xl text-soil mb-12">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS.map(({ step, title, body }) => (
                <div key={step}>
                  <p className="text-5xl text-mangetout font-bold mb-3">{step}</p>
                  <h3 className="text-2xl text-soil mb-2">{title}</h3>
                  <p className="text-broth text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Slurpped */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-5xl text-soil mb-10">Why Slurpped</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-l-4 border-carrot pl-6">
                <h3 className="text-2xl text-soil mb-2">Chef-led.</h3>
                <p className="text-broth">16 years in professional kitchens. Michelin-starred pedigree. Every kit is Ollie's recipe, built for yours.</p>
              </div>
              <div className="border-l-4 border-carrot pl-6">
                <h3 className="text-2xl text-soil mb-2">British-sourced.</h3>
                <p className="text-broth">Premium ingredients, sourced with care. Nothing generic, nothing cheap.</p>
              </div>
              <div className="border-l-4 border-carrot pl-6">
                <h3 className="text-2xl text-soil mb-2">Ready in minutes.</h3>
                <p className="text-broth">Restaurant quality, any night. The hard work is already done — you just cook.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ollie quote + About tease */}
        <section className="bg-chickpea py-20">
          <div className="container max-w-2xl text-center">
            <blockquote className="text-3xl sm:text-4xl text-soil leading-snug mb-6">
              "This is real food, made the right way."
            </blockquote>
            <p className="text-broth font-medium mb-6">— Ollie Bloxham, Founder</p>
            <Link href="/about" className="text-carrot underline underline-offset-4 hover:opacity-80">
              Our story →
            </Link>
          </div>
        </section>

        {/* Next Week Teaser */}
        {nextWeekTeaser && (
          <section className="bg-soil py-6">
            <div className="container text-center">
              <p className="text-chickpea text-sm">
                <span className="text-mangetout font-medium uppercase tracking-wider mr-2">Coming next week:</span>
                {nextWeekTeaser}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    useCdn: true
  });

  const weeklySpecial: WeeklySpecial | null = await client
    .fetch(`*[_type == "weeklySpecial" && published == true][0]{ ..., product-> }`)
    .catch((e) => { Sentry.captureException(e); return null; });

  return {
    props: {
      weeklySpecial: weeklySpecial || null
    }
  };
};

export default Home;
