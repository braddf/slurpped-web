import React, { ChangeEvent, useState } from "react";
import { NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, toPlainText } from "@portabletext/react";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import Link from "next/link";

export default function Posts(page: INewsPage & { posts: BlogPost[] }) {
  console.log("Posts page");
  console.log("page", page);
  console.log("posts", page.posts);

  const filterPosts = (e: ChangeEvent<HTMLInputElement>) => {
    const filteredPosts = page.posts.filter((post) => {
      return toPlainText(post.content).toLowerCase().includes(e.target.value.toLowerCase());
    });
    setPosts(filteredPosts);
  };
  const [posts, setPosts] = useState(page.posts);

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
      <div className="mt-16 mb-32 max-w-2xl mx-auto">
        <div className="mb-12 sm:mb-16 w-72">
          <label className="flex flex-col">
            <span className="mb-2">{page.searchLabel}</span>
            <input
              className="bg-potato border w-72 -ml-px border-carrot outline-carrot rounded p-2"
              type="text"
              placeholder={page.searchPlaceholder}
              onChange={filterPosts}
            />
          </label>
          {posts.length < page.posts.length && (
            <span className="block text-sm font-gray-700 mt-2">
              {page.filterLabel
                .replace("X", posts.length.toString())
                .replace("Y", page.posts.length.toString())}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 justify-between sm:justify-center xl:justify-between mt-12 gap-x-4 sm:gap-x-8">
          {posts.map((post) => (
            <Post post={post} key={post.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Post = ({ post }: { post: BlogPost }) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  return (
    <Link
      href={`/blog/${post.slug}`}
      key={post.slug}
      className="btn flex flex-initial mb-8 bg-potato border-2 rounded-md border-carrot overflow-hidden"
    >
      <div className="flex-1 relative min-h-[12rem]">
        {!!post.featuredImage && (
          <Image
            src={imageBuilder.image(post.featuredImage).url()}
            alt={post.title}
            fill={true}
            className={"m-0"}
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="flex flex-col flex-[2] py-4 px-6">
        <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
        <b className="mb-2">{post.subtitle}</b>
        {/* TODO: Add "serves" label to global settings */}
        <div className="flex-1 justify-self-end">
          <PortableText value={post.excerpt} />
        </div>
      </div>
    </Link>
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

  const query = `*[_type in ["news-page", "blog-post"] && __i18n_lang == "${language}"] | order(publishDate desc)`;

  let page: any;
  let posts: any[] = [];
  await client.fetch(query).then((pages: (INewsPage | BlogPost)[]) => {
    page = pages.filter((d) => d._type === "news-page")[0];
    posts = pages.filter((d) => d._type === "blog-post");
  });

  if (!page?.title) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      ...page,
      posts
    }
  };
};

type INewsPage = {
  _type: "news-page";
  title: string;
  subtitle: string;
  intro: any;
  searchLabel: string;
  searchPlaceholder: string;
  filterLabel: string;
};

type BlogPost = {
  _type: "blog-post";
  title: string;
  subtitle: string;
  excerpt: any;
  slug: string;
  featuredImage: unknown;
  content: any;
};
