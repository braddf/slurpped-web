import React from "react";
import { NextPage, NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import { getRandomVeggie } from "../components/icons";

const PartnersPage: NextPage<IPartnersPage> = (page) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN,
    useCdn: true
  });
  const imageBuilder = imageUrlBuilder(client);
  const vegArray = [2, 5, 3, 1, 0, 4];
  return (
    <div className="container max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[1400px] pt-12">
      <h1 className="text-3xl font-bold mb-24 text-underline-primary text-center">{page.title}</h1>
      <div className="max-w-sm sm:max-w-xl mx-auto mt-12 border-l-sweetcorn border-l-4 pl-12">
        <div className="">
          <PortableText value={page.intro} />
        </div>
      </div>
      <div className="my-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-8 gap-y-16">
          {page.partners.map((partner) => {
            const url = imageBuilder.image(partner.logo).height(100).url();
            const shortUrl = partner.url
              .replace("https://", "")
              .replace("http://", "")
              .split("/")[0];
            return (
              <div
                className="btn relative flex flex-col min-[500px]:flex-row min-[500px]:gap-6 gap-3 items-start justify-between"
                key={partner._id}
              >
                <div className="flex-initial flex items-center">
                  <Image
                    src={url}
                    alt={partner.name}
                    width={100}
                    height={100}
                    style={{ objectFit: "contain" }}
                    unoptimized={url.includes(".svg")}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <p className="no-underline flex items-end flex-initial font-bold text-lg text-center">
                    {partner.name}
                  </p>
                  <p className="">
                    <PortableText value={partner.description} />
                  </p>
                  <a href={partner.url} target="_blank" className="font-bold" rel="noreferrer">
                    <span>{shortUrl}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PartnersPage;

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type == "partners-page" && __i18n_lang == "${language}"][0]`;

  let page: any;
  await client.fetch(query).then((p: IPartnersPage) => {
    page = p;
  });

  if (!page?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      ...page
    }
  };
};

type IPartnersPage = {
  title: string;
  subtitle: string;
  intro: any;
  partners: {
    _id: string;
    name: string;
    description: any;
    url: string;
    logo: {
      asset: {
        _ref: string;
      };
    };
  }[];
};
