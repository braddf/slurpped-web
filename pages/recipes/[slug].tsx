import React, { ChangeEvent, useState } from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";

export default function RecipePage(recipe: IRecipe) {
  console.log("Recipe page");
  console.log("recipe", recipe);

  return <Recipe recipe={recipe} />;
}

export const Recipe = ({ recipe }: { recipe: IRecipe }) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);

  return (
    <div className="mx-4 sm:mx-16 md:container pt-12 mb-16">
      <div className="flex flex-col sm:flex-row mb-12 sm:items-center md:items-start gap-6 rounded-xl overflow-hidden border-4 border-carrot">
        <div className="flex grow flex-col flex-[2] md:flex-[2] h-full min-h-[16rem] sm:min-h-[16rem] lg:min-h-[20rem] order-2 sm:order-1 px-6 pb-6 sm:pt-3 md:py-6 md:pr-0 h-full">
          <h1 className="block text-4xl font-bold mb-4">{recipe.title}</h1>
          <b className="block mb-2">{recipe.subtitle}</b>
          <div className="flex-1">
            <PortableText value={recipe.excerpt} />
          </div>
          {/* TODO: Add "serves" label to global settings */}
          <div className="grid grid-cols-2 max-w-sm md:max-w-full pr-3 justify-self-end">
            <p className="block">Serves {recipe.serves}</p>
            {/*<div></div>*/}
            <p className="block text-right row-span-2 self-end">{recipe.source}</p>
            <p className="block">{recipe.time}</p>
          </div>
        </div>
        <div className="flex-1 md:flex-[1] relative h-full min-h-[16rem] sm:min-h-[16rem] lg:min-h-[20rem] order-1 sm:order-2 w-full">
          {!!recipe.featuredImage && (
            <Image
              src={imageBuilder.image(recipe.featuredImage).url()}
              alt={recipe.title}
              fill={true}
              className={"m-0 block"}
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 rounded-xl overflow-hidden bg-potato border-4 border-sweetcorn px-5 py-4">
          <h3 className="text-2xl font-bold mb-6">Ingredients</h3>
          <div className="rich-text">
            <PortableText value={recipe.ingredients} />
          </div>
        </div>
        <div className="flex-1 px-5 py-4">
          <h3 className="text-2xl font-bold mb-6">Method</h3>
          <div className="rich-text">
            <PortableText value={recipe.method} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type in ["recipe"] && slug == "${context.query?.slug}" && __i18n_lang == "${language}"][0]`;

  let recipe: any;
  await client.fetch(query).then((r: IRecipe) => {
    recipe = r;
  });

  if (!recipe?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      // ...page,
      ...recipe
    }
  };
};

export type IRecipe = {
  _type: "recipe";
  title: string;
  subtitle: string;
  excerpt: any;
  slug: string;
  featuredImage: unknown;
  source: string;
  sourceUrl: string;
  serves: number;
  time: string;
  ingredients: any;
  method: any;
};
