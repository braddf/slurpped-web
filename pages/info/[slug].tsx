import React, { ChangeEvent, useState } from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";

export default function PolicyPage({ page }: { page: PolicyPage }) {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  return (
    <div className="mx-4 sm:mx-16 md:container pt-16 mb-24">
      <div className="flex flex-col gap-6 mb-12">
        <h1 className="block text-4xl font-bold mb-4">{page.title}</h1>
        {page.subtitle && <b className="block mb-2">{page.subtitle}</b>}
        <div className="flex-1">
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
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type in ["policy-page"] && slug == "${context.query?.slug}"][0]`;
  let page: any;
  await client.fetch(query).then((p: PolicyPage) => {
    page = p;
  });

  if (!page?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      page
    }
  };
};

type PolicyPage = {
  _type: "policy-page";
  title: string;
  subtitle: string;
  slug: string;
  content: any;
};
