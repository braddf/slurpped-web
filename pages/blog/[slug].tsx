import React, { ChangeEvent, useState } from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import Link from "next/link";
import { Recipe, IRecipe } from "../recipes/[slug]";
import TableComponent from "@sanity/table/src/components/TableComponent";

export default function News(post: BlogPost) {
  console.log("BlogPost page");
  console.log("post", post);
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  const components = {
    types: {
      table: (props: any) => {
        return (
          <table className="table-auto border-collapse border border-gray-300 mx-auto text-xs sm:text-base">
            <tbody>
              {props.value.rows?.map((row: any, i: number) => (
                <tr key={`row-${i}`}>
                  {row.cells?.map((cell: any, j: number) => {
                    let cellFormatted = cell?.replace("**", "");
                    // if(cellFormatted?.includes("SUM")) {
                    //   cellFormatted =
                    // }
                    return (
                      <td
                        key={j}
                        className={`border border-gray-300 px-2 sm:px-4 py-2 ${
                          cell?.includes("**") ? "font-bold" : ""
                        }${cell?.includes("€") ? " text-right" : ""}${
                          i === 0 && j !== 0 ? " font-bold text-center" : ""
                        }`}
                      >
                        {cellFormatted}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }
  };

  return (
    <div className="mb-16">
      <div className="mx-6 sm:mx-auto pt-12 max-w-3xl">
        <div className="flex flex-col">
          <div className="flex flex-col mb-6">
            <div>
              <Link className="btn mb-12 block" href={`/blog`}>
                &larr; Back to the Blog
              </Link>
            </div>
            <h1 className="block text-4xl font-bold mb-6 text-underline-primary">{post.title}</h1>
            <b className="block mb-2">{post.subtitle}</b>
            <div className="flex-1">
              <PortableText value={post.excerpt} />
            </div>
          </div>
          {!!post.featuredImage && (
            <div className="flex-1 relative h-full min-h-[16rem] sm:min-h-[16rem] lg:min-h-[20rem] w-full">
              <div className="dotted-image-box-carrot h-full">
                <Image
                  src={imageBuilder.image(post.featuredImage).url()}
                  alt={post.title}
                  width={800}
                  height={200}
                  className="m-0 rounded-2xl"
                  // fill={true}
                  style={{ objectFit: "cover", aspectRatio: "2" }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 pt-12">
            <div className="rich-text">
              <PortableText value={post.content} components={components} />
            </div>
          </div>
        </div>
      </div>
      {!!post.featuredRecipe && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 py-12">
            <div className="rich-text">
              <Recipe recipe={post.featuredRecipe} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = async (context: NextPageContext) => {
  console.log("getServerside context", context);
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type in ["blog-post"] && slug == "${context.query?.slug}" && __i18n_lang == "${language}"][0]{
    ...,
    featuredRecipe->
  }`;
  console.log("query", query);

  let post: any;
  await client.fetch(query).then((r: BlogPost) => {
    post = r;
  });
  console.log("post", post);

  if (!post?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      // ...page,
      ...post
    }
  };
};

type BlogPost = {
  _type: "blog-post";
  title: string;
  subtitle: string;
  excerpt: any;
  slug: string;
  featuredImage: unknown;
  content: any;
  featuredRecipe?: IRecipe;
};
