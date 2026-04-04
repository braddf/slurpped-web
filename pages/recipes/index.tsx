import React, { ChangeEvent, useState } from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import Link from "next/link";

export default function Recipes(page: IRecipesPage & { recipes: Recipe[] }) {
  console.log("Recipes page");
  console.log("page", page);
  console.log("recipes", page.recipes);

  const filterFaqs = (e: ChangeEvent<HTMLInputElement>) => {
    const filteredFaqs = page.recipes.filter((recipe) => {
      if (!recipe.ingredients) return false;
      return toPlainText(recipe.ingredients).toLowerCase().includes(e.target.value.toLowerCase());
    });
    setRecipes(filteredFaqs);
  };
  const [recipes, setRecipes] = useState(page.recipes);

  return (
    <div className="mx-4 sm:mx-16 md:container pt-12">
      <h1 className="text-2xl font-bold mb-12 text-underline-primary text-center">{page.title}</h1>
      <div className="max-w-sm sm:max-w-xl mx-auto mt-6 text-center">
        <b className="block mb-4">{page.subtitle}</b>
        <div className="">
          <PortableText value={page.intro} />
        </div>
      </div>
      <hr className="my-12 border-2 border-carrot w-12 mx-auto" />
      <div className="mt-16 mb-32">
        <div className="mb-12 sm:mb-16 w-72">
          <label className="flex flex-col">
            <span className="mb-2">{page.searchLabel}</span>
            <input
              className="bg-potato border w-72 -ml-px border-carrot outline-carrot rounded p-2"
              type="text"
              placeholder={page.searchPlaceholder}
              onChange={filterFaqs}
            />
          </label>
          {recipes.length < page.recipes.length && (
            <span className="block text-sm font-gray-700 mt-2">
              {page.filterLabel
                .replace("X", recipes.length.toString())
                .replace("Y", page.recipes.length.toString())}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 justify-between sm:justify-center xl:justify-between mt-12 gap-x-4 sm:gap-x-8">
          {recipes.map((recipe) => (
            <Recipe recipe={recipe} key={recipe.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Recipe = ({ recipe }: { recipe: Recipe }) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      key={recipe.title}
      className="btn flex flex-col min-[550px]:flex-row md:flex-col lg:flex-row xl:flex-row flex-initial mb-8 bg-potato border-2 rounded-md border-carrot overflow-hidden"
    >
      <div className="flex-1 relative min-h-[12rem]">
        {!!recipe.featuredImage && (
          <Image
            src={imageBuilder.image(recipe.featuredImage).url()}
            alt={recipe.title}
            fill={true}
            className={"m-0"}
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="flex flex-col flex-[2] py-4 px-6">
        <h3 className="text-2xl font-bold mb-3">{recipe.title}</h3>
        <b className="mb-2">{recipe.subtitle}</b>
        {/* TODO: Add "serves" label to global settings */}
        <div className="flex-1 grid grid-cols-2 justify-self-end">
          <p className="block self-end">Serves {recipe.serves}</p>
          <p className="block text-right row-span-2 self-end">{recipe.source}</p>
          <p className="block self-end">{recipe.time}</p>
        </div>
      </div>
    </Link>
  );
};

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN,
    useCdn: true
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type in ["recipes-page", "recipe"]]`;

  let page: any;
  let recipes: any[] = [];
  await client.fetch(query).then((pages: (IRecipesPage | Recipe)[]) => {
    page = pages.filter((d) => d._type === "recipes-page")[0];
    recipes = pages.filter((d) => d._type === "recipe");
  });

  if (!page?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      ...page,
      recipes: recipes
    }
  };
};

type IRecipesPage = {
  _type: "recipes-page";
  title: string;
  subtitle: string;
  intro: any;
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
};

type Recipe = {
  _type: "recipe";
  title: string;
  subtitle: string;
  excerpt: string;
  slug: string;
  featuredImage: unknown;
  source: string;
  sourceUrl: string;
  serves: number;
  time: string;
  ingredients: any;
  method: any;
};
