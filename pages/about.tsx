import React from "react";
import { NextPage, NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import { getRandomVeggie } from "../components/icons";

const About: NextPage<IAboutPage> = (page) => {
  console.log("About page");
  console.log("page", page);
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  const vegArray = [2, 5, 3, 1, 0, 4];
  return (
    <div className="container pt-12">
      <h1 className="text-3xl font-bold mb-24 text-underline-primary text-center">{page.title}</h1>
      <div className="max-w-sm sm:max-w-xl mx-auto mt-12 border-l-sweetcorn border-l-4 pl-12">
        <b className="block mb-4">{page.intro}</b>
        <div className="">
          <PortableText value={page.content} />
        </div>
      </div>
      <div className="my-32">
        <h2 className="text-2xl font-bold mb-8 text-underline-primary">{page.teamTitle}</h2>
        <h4 className="text-lg font-normal">{page.teamSubtitle}</h4>
        <div className="flex flex-wrap justify-between sm:justify-center xl:justify-between mt-12 gap-x-6 sm:gap-x-24">
          {page.teamMembers.map((member, index) => (
            <div key={member.name} className="flex-initial mb-12">
              <div className="flex flex-col items-center">
                <div className="relative overflow-hidden w-32 h-32 rounded-full mb-4 border-4 border-sweetcorn">
                  {!!member.image && (
                    <Image
                      src={imageBuilder.image(member.image).url()}
                      alt={member.name}
                      width={700}
                      height={200}
                      className="m-0"
                      // fill={true}
                      style={{ objectFit: "cover" }}
                    />
                  )}
                  {!member.image && (
                    <div className="flex items-center w-full h-full justify-center">
                      <div className="scale-[0.4]">{getRandomVeggie(vegArray[index])}</div>
                    </div>
                  )}
                </div>
                <h5 className="text-base sm:text-xl font-bold mb-0.5 sm:mb-2">{member.name}</h5>
                <p className="text-sm text-center max-w-[9rem]">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type == "about-page"]`;

  let page: any;
  await client.fetch(query).then((pages: IAboutPage[]) => {
    page = pages[0];
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

type IAboutPage = {
  title: string;
  subtitle: string;
  intro: string;
  featuredImage: unknown;
  content: any;
  teamTitle: string;
  teamSubtitle: string;
  teamMembers: {
    name: string;
    role: string;
    image: unknown;
  }[];
};
