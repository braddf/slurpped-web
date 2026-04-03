import React, { useEffect } from "react";
import { NextPage, NextPageContext } from "next";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText } from "@portabletext/react";
import "photoswipe/dist/photoswipe.css";
import { Gallery, Item } from "react-photoswipe-gallery";
import imageUrlBuilder from "@sanity/image-url";

const GalleryPage: NextPage<IGalleryPage> = (page) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  return (
    <div className="container pt-12 mb-24">
      <h1 className="text-3xl font-bold mb-24 text-underline-primary text-center">{page.title}</h1>
      <div className="max-w-sm sm:max-w-xl mx-auto mt-12 mb-24 border-l-sweetcorn border-l-4 pl-12">
        <div className="">
          <PortableText value={page.description} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 justify-items-center">
        <Gallery withCaption options={{}}>
          {page.images.map((image, index) => {
            return (
              <Item
                key={index}
                original={imageBuilder.image(image.image).width(1024).height(768).url()}
                thumbnail={imageBuilder.image(image.image).width(250).height(180).url()}
                width="1024"
                height="768"
                caption={image.caption}
              >
                {({ ref, open }) => (
                  <div>
                    <img
                      // @ts-ignore
                      ref={ref}
                      className="dotted-image-box-carrot"
                      onClick={open}
                      caption={image.caption}
                      src={imageBuilder.image(image.image).width(250).height(180).url()}
                    />
                  </div>
                )}
              </Item>
            );
          })}
        </Gallery>
      </div>
    </div>
  );
};

export default GalleryPage;

export const getServerSideProps = async (context: NextPageContext) => {
  const client = createClient({
    projectId: "lrkfr7go",
    dataset: "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });

  const language = getCookies(context)["groentetas/lang"] || "en-gb";

  const query = `*[_type == "gallery-page" && __i18n_lang == "${language}"]`;

  let page: any;
  await client.fetch(query).then((pages: IGalleryPage[]) => {
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

type IGalleryPage = {
  title: string;
  description: any[];
  images: any[];
};
