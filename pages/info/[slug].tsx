import React from "react";
import Head from "next/head";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { PortableText } from "@portabletext/react";

type PolicyPage = {
  _type: "policy-page";
  title: string;
  subtitle?: string;
  slug: string;
  content: any;
};

export default function PolicyPage({ page }: { page: PolicyPage }) {
  return (
    <div>
      <Head>
        <title>{page.title} — Slurpped</title>
      </Head>

      <div className="container pt-12 pb-24 max-w-3xl">
        <h1 className="text-6xl text-soil mb-6">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xl text-broth mb-8 border-l-4 border-sweetcorn pl-6">
            {page.subtitle}
          </p>
        )}
        <div className="rich-text text-soil">
          <PortableText value={page.content} />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    useCdn: true
  });

  let page: PolicyPage | null = null;
  try {
    page = await client.fetch(
      `*[_type == "policy-page" && slug == $slug][0]`,
      { slug: context.query?.slug }
    );
  } catch {
    // Sanity unavailable
  }

  if (!page?.title) return { notFound: true };

  return { props: { page } };
};
