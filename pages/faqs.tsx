import React, { ChangeEvent, useState } from "react";
import { NextPage, NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import { getRandomVeggie } from "../components/icons";

const FAQs: NextPage<IFAQsPage> = (page) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  const filterFaqs = (e: ChangeEvent<HTMLInputElement>) => {
    const filteredFaqs = page.faqs.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(e.target.value.toLowerCase()) ||
        toPlainText(faq.answer).toLowerCase().includes(e.target.value.toLowerCase())
      );
    });
    setFaqs(filteredFaqs);
  };
  const [faqs, setFaqs] = useState(page.faqs);
  return (
    <div className="container pt-12 mb-36 max-w-5xl">
      <h1 className="text-3xl font-bold mb-24 text-underline-primary text-center">{page.title}</h1>
      <div className="max-w-2xl sm:max-w-3xl mx-auto mt-12">
        <b className="block mb-4">{page.intro}</b>
        <div className="">
          <PortableText value={page.content} />
        </div>
      </div>
      <div className="my-24">
        <div className="mb-24 sm:mb-32 w-64 mx-auto">
          <label className="flex flex-col">
            <span className="mb-2">Filter FAQs by keyword</span>
            <input
              className="bg-white border-0 rounded p-2"
              type="text"
              placeholder="e.g. mushrooms"
              onChange={filterFaqs}
            />
          </label>
          {faqs.length < page.faqs.length && (
            <span className="block text-sm font-gray-700 mt-2">
              Showing {faqs.length} of {page.faqs.length} FAQs
            </span>
          )}
        </div>
        {faqs.map((faq, index) => {
          return (
            <div key={faq.question.replace(" ", "").slice(0, 30)} className="flex flex-col">
              <h2 className="text-2xl font-bold mb-8 text-underline-primary">{faq.question}</h2>
              <div className="max-w-2xl sm:max-w-3xl w-full mx-auto">
                <PortableText value={faq.answer} />
              </div>
              <div className="my-12 flex items-center justify-center">
                <div className="relative scale-[0.3] block">{getRandomVeggie(index % 3)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQs;

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type == "faq-page"]`;
  // const faqQuery = `*[_type == "faq"]`;

  let page: any;
  await client.fetch(query).then((pages: IFAQsPage[]) => {
    page = pages[0];
  });
  // const faqs: IFaq[] = await client.fetch(faqQuery);

  if (!page?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      ...page
      // faqs
    }
  };
};

type IFAQsPage = {
  title: string;
  intro: string;
  content: any;
  faqs: IFaq[];
};

type IFaq = {
  question: string;
  answer: any;
};
