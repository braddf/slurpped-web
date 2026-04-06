import React from "react";
import { NextPage, NextPageContext } from "next";
import Head from "next/head";
import { createClient } from "@sanity/client";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

type SanityAboutPage = {
  title: string;
  intro?: string;
  content?: any;
};

type AboutProps = {
  sanityPage: SanityAboutPage | null;
};

const About: NextPage<AboutProps> = ({ sanityPage }) => {
  return (
    <div>
      <Head>
        <title>About — Slurpped</title>
      </Head>

      <div className="container pt-12 pb-24 max-w-3xl">
        {sanityPage ? (
          <>
            <h1 className="text-6xl text-soil mb-8">{sanityPage.title}</h1>
            {sanityPage.intro && (
              <p className="text-xl text-broth mb-8 border-l-4 border-sweetcorn pl-6">
                {sanityPage.intro}
              </p>
            )}
            {sanityPage.content && (
              <div className="rich-text text-soil">
                <PortableText value={sanityPage.content} />
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-6xl text-soil mb-6">Our Story</h1>
            <p className="text-xl text-broth mb-8 border-l-4 border-sweetcorn pl-6">
              Real ramen. No shortcuts. Built from 16 years in professional kitchens.
            </p>

            <div className="rich-text text-soil space-y-6 text-lg leading-relaxed">
              <p>
                Slurpped was born out of a simple frustration: proper ramen is extraordinary, but
                almost impossible to make at home without the knowledge, time, and technique that
                only comes from years of professional cooking.
              </p>
              <p>
                Ollie Bloxham has spent 16 years in professional kitchens — including
                Michelin-starred restaurants — and has a particular obsession with Japanese cuisine.
                Slurpped is his way of bringing that expertise into your kitchen, without the faff.
              </p>
              <p>
                Every kit is designed around the same principles Ollie uses in a professional
                kitchen: quality ingredients, precise preparation, and flavour you can taste the
                difference in. We source from British producers where possible and never compromise
                on the stuff that matters.
              </p>
              <p>
                We're based in Bristol, UK. Drop us a line at{" "}
                <Link href="mailto:info@slurpped.co.uk" className="text-carrot underline">
                  info@slurpped.co.uk
                </Link>
                .
              </p>
            </div>

            <blockquote className="mt-12 border-l-4 border-carrot pl-6">
              <p className="text-2xl text-soil italic mb-3">
                "This is real food, made the right way."
              </p>
              <cite className="text-broth not-italic font-medium">— Ollie Bloxham, Founder</cite>
            </blockquote>
          </>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps = async (_context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    useCdn: true
  });

  let sanityPage: SanityAboutPage | null = null;
  try {
    const pages = await client.fetch(`*[_type == "about-page"]`);
    sanityPage = pages?.[0] || null;
  } catch (e) {
    Sentry.captureException(e);
    // Fall through to static content
  }

  return {
    props: {
      sanityPage: sanityPage?.title ? sanityPage : null
    }
  };
};

export default About;
