import React, { ChangeEvent, useState } from "react";
import { NextPage, NextPageContext } from "next";
import Head from "next/head";
import { createClient } from "@sanity/client";
import { PortableText, toPlainText } from "@portabletext/react";

type IFaq = { question: string; answer: any };
type IFAQsPage = { title: string; intro?: string; content?: any; faqs: IFaq[] };

type FAQsProps = {
  page: IFAQsPage;
};

const STATIC_FAQS: IFaq[] = [
  {
    question: "How does delivery work?",
    answer: [{ _type: "block", children: [{ _type: "span", text: "We deliver Thursday, Friday, and Saturday. Choose your preferred day when you order. Kits arrive chilled and ready to cook." }] }]
  },
  {
    question: "What's in a ramen kit?",
    answer: [{ _type: "block", children: [{ _type: "span", text: "Each kit contains everything you need to make restaurant-quality ramen at home — broth, noodles, toppings, and Ollie's step-by-step prep guide. Nothing missing, nothing wasted." }] }]
  },
  {
    question: "How do subscriptions work?",
    answer: [{ _type: "block", children: [{ _type: "span", text: "Subscribe and receive your chosen kit every week, billed on Sunday for the following week's delivery. You can pause, change, or cancel at any time via your account page." }] }]
  },
  {
    question: "Can I buy a kit without subscribing?",
    answer: [{ _type: "block", children: [{ _type: "span", text: "Yes — every kit is available as a one-off purchase too. Just select 'Buy once' on the order page." }] }]
  }
];

const FAQs: NextPage<FAQsProps> = ({ page }) => {
  const [faqs, setFaqs] = useState(page.faqs);

  const filterFaqs = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toLowerCase();
    if (!q) {
      setFaqs(page.faqs);
      return;
    }
    setFaqs(
      page.faqs.filter((faq) => {
        const answerText = typeof faq.answer === "string" ? faq.answer : toPlainText(faq.answer);
        return faq.question.toLowerCase().includes(q) || answerText.toLowerCase().includes(q);
      })
    );
  };

  return (
    <div>
      <Head>
        <title>FAQs — Slurpped</title>
      </Head>

      <div className="container pt-12 pb-24 max-w-3xl">
        <h1 className="text-6xl text-soil mb-6">{page.title}</h1>
        {page.intro && (
          <p className="text-xl text-broth mb-8 border-l-4 border-sweetcorn pl-6">{page.intro}</p>
        )}
        {page.content && (
          <div className="rich-text text-soil mb-8">
            <PortableText value={page.content} />
          </div>
        )}

        <div className="mb-10">
          <input
            className="text-input w-full max-w-sm bg-white"
            type="text"
            placeholder="Search FAQs…"
            onChange={filterFaqs}
          />
          {faqs.length < page.faqs.length && (
            <p className="text-sm text-broth mt-2">
              Showing {faqs.length} of {page.faqs.length} results
            </p>
          )}
        </div>

        <div className="flex flex-col gap-10">
          {faqs.map((faq, i) => (
            <div key={i} className="border-l-4 border-sweetcorn pl-6">
              <h2 className="text-3xl text-soil mb-3">{faq.question}</h2>
              <div className="rich-text text-broth">
                <PortableText value={faq.answer} />
              </div>
            </div>
          ))}
        </div>
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

  let page: IFAQsPage | null = null;
  try {
    const pages: IFAQsPage[] = await client.fetch(`*[_type == "faq-page"]`);
    page = pages?.[0] || null;
  } catch {
    // Fall through to static
  }

  return {
    props: {
      page: page?.title
        ? page
        : { title: "FAQs", faqs: STATIC_FAQS }
    }
  };
};

export default FAQs;
