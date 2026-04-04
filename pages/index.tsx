import type { NextPage, NextPageContext } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import useUser from "../lib/useUser";
import { getIronSession } from "iron-session";
import { createClient } from "@sanity/client";
import { getCookies } from "cookies-next";
import { PortableText, PortableTextProps } from "@portabletext/react";
import React, { useEffect } from "react";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import { Beetroot, Carrot, Leek, Sweetcorn } from "../components/icons";
import { Recipe } from "./recipes";
import { useRouter } from "next/router";
import fetchJson from "../lib/fetchJson";
import { PartnersPage, Location } from "../types";

type HomeProps = {
  title: string;
  heroTitle: string;
  subtitle: string;
  heroBtnText: string;
  howItWorksTitle: string;
  howItWorksDescription: any;
  howItWorksSteps: { icon: string; title: string; subtitle: string; content: any }[];
  howItWorksBtnText: string;
  whoWeAreTitle: string;
  whoWeAreTagline: string;
  whoWeAreContent: any;
  whoWeAreButtonText: string;
  whyChooseUsTitle: string;
  whyChooseUsContent: any;
  whyChooseUsButtonText: string;
  whyChooseUsButtonLink: string;
  supplierSpotlightTitle: string;
  supplierSpotlightLogo: any;
  supplierSpotlightGraphic: any;
  supplierSpotlightContent: any;
  supplierSpotlightButtonText: string;
  supplierSpotlightButtonLink: string;
  mushroomsTitle: string;
  mushroomsLogo: any;
  mushroomsLogoText: string;
  mushroomsGraphic: any;
  mushroomsContent: any;
  mushroomsButtonText: string;
  mushroomsButtonLink: string;
  blogTitle: string;
  blogButtonText: string;
  blogPostButtonText: string;
  content: any;
  blogPosts: any[];
  recipesTitle: string;
  recipes: any[];
  recipesButtonText: string;
  partnersPage: PartnersPage;
  locations: Location[];
};

const Home: NextPage<HomeProps> = ({
  title,
  heroTitle,
  subtitle,
  heroBtnText,
  howItWorksTitle,
  howItWorksDescription,
  howItWorksSteps,
  howItWorksBtnText,
  whoWeAreTitle,
  whoWeAreTagline,
  whoWeAreContent,
  whoWeAreButtonText,
  whyChooseUsTitle,
  whyChooseUsContent,
  whyChooseUsButtonText,
  whyChooseUsButtonLink,
  supplierSpotlightTitle,
  supplierSpotlightLogo,
  supplierSpotlightGraphic,
  supplierSpotlightContent,
  supplierSpotlightButtonText,
  supplierSpotlightButtonLink,
  mushroomsTitle,
  mushroomsLogo,
  mushroomsGraphic,
  mushroomsLogoText,
  mushroomsContent,
  mushroomsButtonText,
  mushroomsButtonLink,
  blogTitle,
  blogButtonText,
  blogPostButtonText,
  content,
  blogPosts,
  recipesTitle,
  recipes,
  recipesButtonText,
  partnersPage,
  locations
}) => {
  const { user } = useUser();
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2021-10-21",
    token: process.env.SANITY_BOT_TOKEN
    // useCdn: true,
  });
  const imageBuilder = imageUrlBuilder(client);
  const router = useRouter();
  const { mutateUser } = useUser();
  useEffect(() => {
    if (
      typeof router?.query === "object" &&
      Object.keys(router.query).length > 0 &&
      router.query.magic_credential
    ) {
      (async () =>
        mutateUser(
          await fetchJson("/api/login", {
            method: "POST",
            headers: { Authorization: `Bearer ${router.query.magic_credential}` }
          })
        ))();
    }
  }, [router.query]);
  // const rotation = 0;
  useEffect(() => {
    const icons: NodeListOf<HTMLElement> = document.querySelectorAll(".vegetable");

    if (icons.length) {
      icons.forEach((icon) => {
        icon.addEventListener("animationend", () => {
          icon.classList.remove("shake");
        });
      });
      document.onscroll = () => {
        const scrollY = window.scrollY;
        if (icons.length) {
          icons.forEach((icon) => {
            if (icon.dataset?.threshold) {
              const threshold = parseInt(icon.dataset.threshold);
              if (
                scrollY > threshold - 5 &&
                scrollY < threshold + 5 &&
                !icon.classList.contains("shake")
              ) {
                icon.classList.add("shake");
              }
            }
          });
        }
      };

      return () => {
        icons.forEach((icon) => {
          icon.removeEventListener("animationend", () => {
            icon.classList.remove("shake");
          });
        });
      };
    }
    // };
  }, []);
  return (
    <div className="">
      <Head>
        <meta name="description" content="Website for Groentetas Utrecht" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="">
        <div className="flex h-screen -mt-14 border-b-4 border-sweetcorn relative wiggle-background">
          <div className="absolute w-full top-14 bottom-0">
            <div
              className="vegetable absolute left-[5vw] top-[10vh] sm:top-[15vh]"
              data-threshold={75}
            >
              <Beetroot className="-rotate-12 scale-50 sm:scale-75" />
            </div>
            <div
              className="vegetable absolute right-[10vw] sm:right-[12vw] top-[5vh]"
              data-threshold={7}
            >
              <Sweetcorn className="scale-50 sm:scale-75" />
            </div>
            <div
              className="vegetable absolute left-[5vw] sm:left-[10vw] bottom-[3vh] sm:bottom-[5vh]"
              data-threshold={150}
            >
              <Leek className="scale-50 sm:scale-75 rotate-12" />
            </div>
            <div
              className="vegetable absolute right-[5vw] bottom-[12vh] sm:bottom-[20vh]"
              data-threshold={250}
            >
              <Carrot className="scale-50 sm:scale-75" />
            </div>
          </div>
          <div className="flex container flex-1 flex-col pt-14 text-center justify-center max-w-xl sm:max-w-3xl z-10">
            <div className="flex flex-col flex-initial py-16 border-dashed border-carrot rounded-3xl">
              {/*<div className="flex flex-col flex-initial py-16 border-dashed border-carrot border-2 rounded-3xl">*/}
              <h1 className="mb-6 block text-mangetout text-4xl sm:text-5xl md:text-6xl sm:max-w-lg mx-auto">
                {heroTitle}
              </h1>
              <h1 className="block text-mangetout text-4xl sm:text-5xl md:text-6xl sm:max-w-lg mx-auto">
                {subtitle}
              </h1>
              <div className="mt-12">
                <Link
                  href={user?.isLoggedIn === true ? "/order" : "/login?returnPage=order"}
                  className="btn-outline text-lg w-48"
                >
                  {heroBtnText}
                </Link>
              </div>
            </div>
          </div>
          {/*<div className="flex flex-col flex-1 justify-end max-w-xs pb-16">*/}
          {/*  <Image src="/tomatoes-hero.jpg" alt="Tomatoes" width={500} height={500} />*/}
          {/*</div>*/}
        </div>

        {/* How it works */}
        <div className="container py-36">
          <div className="flex flex-col">
            <h3 className="text-center text-3xl text-soil mb-12 text-underline-primary">
              {howItWorksTitle}
            </h3>
            <div className="max-w-xl self-center text-center mb-16">
              <PortableText value={howItWorksDescription} />
            </div>
            <div className="flex gap-6 flex-col md:flex-row">
              {howItWorksSteps?.map((step, index) => (
                <div
                  className="flex-1 flex flex-col items-center max-w-md self-center md:self-start"
                  key={`howItWorks-${index}`}
                >
                  {step.icon && (
                    <div className="flex items-center justify-center w-24 h-24 bg-rainwater">
                      <Image src={step.icon} alt="Icon" width={50} height={50} />
                    </div>
                  )}
                  <h4 className="text-center text-2xl text-mangetout mt-4">{step.title}</h4>
                  <p className="text-center text-mangetout mt-1 mb-2">{step.subtitle}</p>
                  <div className="text-center max-w-xl">
                    {/* Show content on step 1 and 2 */}
                    {index !== 2 && <PortableText value={step.content} />}
                    {/* Show locations on step 3 */}
                    {index === 2 && (
                      <div className="flex flex-col items-center">
                        <div className="flex flex-col items-center justify-center">
                          {locations.map((location) => (
                            <div
                              className="flex flex-col items-center"
                              key={`howItWorksLoc-${location._id}`}
                            >
                              <p className="text-center mt-1 mb-1">{location.longName}</p>
                              <p className="text-center mb-2 font-bold leading-none">
                                {location.availableFrom} - {location.availableTo}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Who we are */}
        <div className="container py-36 flex">
          <div className="flex flex-col max-w-2xl m-auto">
            <h3 className="text-center text-3xl text-underline-primary mb-8">{whoWeAreTitle}</h3>
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col items-center">
                <h3 className="text-center text-xl mt-4 mb-8">{whoWeAreTagline}</h3>
                <div className="text-center">
                  <PortableText value={whoWeAreContent} />
                </div>
                {whoWeAreButtonText && (
                  <Link href="/about" className="btn-outline mt-8 py-2 text-center">
                    {whoWeAreButtonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Why choose us */}
        <div className="container py-36 flex">
          <div className="flex flex-col max-w-2xl m-auto">
            <h3 className="text-center text-3xl text-underline-primary mb-8">{whyChooseUsTitle}</h3>
            <div className="flex gap-6">
              <div className="flex-1 flex flex-col items-center">
                <div className="text-center">
                  <PortableText value={whyChooseUsContent} />
                </div>
                {/*{whyChooseUsButtonText && (*/}
                {/*  <Link*/}
                {/*    href={whyChooseUsButtonLink || "/"}*/}
                {/*    className="btn-outline mt-8 w-72 py-2 text-center"*/}
                {/*  >*/}
                {/*    {whyChooseUsButtonText}*/}
                {/*  </Link>*/}
                {/*)}*/}
              </div>
            </div>
          </div>
        </div>

        {/* Partners section */}
        <div className="container py-36 flex">
          <div className="flex flex-col max-w-5xl m-auto">
            <h3 className="text-3xl text-underline-primary mb-16">{partnersPage.title}</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-x-8 gap-y-12">
              {partnersPage.partners.map((partner) => {
                const url = imageBuilder.image(partner.logo).height(100).url();
                return (
                  <a
                    href={partner.url || "/"}
                    target="_blank"
                    className="btn relative flex flex-col items-center justify-between"
                    key={partner._id}
                    rel="noreferrer"
                  >
                    <div className="flex-1 flex items-center">
                      <Image
                        src={url}
                        alt={partner.name}
                        width={100}
                        height={100}
                        style={{ objectFit: "contain" }}
                        unoptimized={url.includes(".svg")}
                      />
                    </div>
                    <p className="no-underline flex items-end flex-initial mt-4 text-xs md:text-sm text-center">
                      {partner.name}
                    </p>
                  </a>
                );
              })}
            </div>
            {partnersPage.homepageBtnText && (
              <Link
                href={"/partners"}
                className="self-center btn-outline mt-16 w-72 py-2 text-center"
              >
                {partnersPage.homepageBtnText}
              </Link>
            )}
          </div>
        </div>

        {/* Supplier spotlight */}
        <div className="container py-36 flex">
          <div className="flex flex-col max-w-5xl m-auto">
            <h3 className="text-right text-3xl text-underline-primary mb-16">
              {supplierSpotlightTitle}
            </h3>

            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:order-2 flex-1 flex flex-col items-end">
                <div className="flex items-end justify-end mb-8">
                  {supplierSpotlightLogo && (
                    <Image
                      src={imageBuilder.image(supplierSpotlightLogo).width(450).height(75).url()}
                      alt={supplierSpotlightTitle}
                      width={360}
                      height={60}
                    />
                  )}
                </div>
                <div className="text-right">
                  <PortableText value={supplierSpotlightContent} />
                </div>
                {supplierSpotlightButtonText && (
                  <Link
                    href={supplierSpotlightButtonLink || "/"}
                    className="btn-outline mt-8 w-72 py-2 text-center"
                  >
                    {supplierSpotlightButtonText}
                  </Link>
                )}
              </div>
              <div className="md:order-1 flex-1 min-h-32">
                {supplierSpotlightGraphic && (
                  <div className="relative border-carrot rounded-3xl border-2 border-dashed p-3">
                    <Image
                      src={imageBuilder.image(supplierSpotlightGraphic).url()}
                      alt={supplierSpotlightTitle}
                      width={700}
                      height={200}
                      className="m-0 rounded-2xl"
                      // fill={true}
                      style={{ objectFit: "cover", aspectRatio: "auto" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mushrooms */}
        <div className="container py-36 flex">
          <div className="flex flex-col max-w-5xl m-auto">
            <h3 className="text-3xl text-underline-primary mb-12 md:mb-16">{mushroomsTitle}</h3>

            <div className="flex gap-12">
              <div className="flex-1 flex flex-col items-start">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex-1 text-left max-w-lg mb-2 md:mb-8">
                    <PortableText value={mushroomsContent} />
                  </div>
                  <div className="flex-1 mb-12 md:mb-2">
                    {mushroomsGraphic && (
                      <div className="dotted-image-box-carrot">
                        <Image
                          src={imageBuilder.image(mushroomsGraphic).url()}
                          alt={mushroomsTitle}
                          width={700}
                          height={200}
                          className="m-0 rounded-2xl"
                          // fill={true}
                          style={{ objectFit: "cover", aspectRatio: "auto" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col flex-1 text-center self-center md:text-left md:self-start">
                  <b className="mb-2">{mushroomsLogoText}</b>
                  {mushroomsLogo && (
                    <Image
                      src={imageBuilder.image(mushroomsLogo).width(500).height(150).url()}
                      alt={mushroomsTitle}
                      width={250}
                      height={60}
                    />
                  )}
                </div>
                {mushroomsButtonText && (
                  <Link
                    href={mushroomsButtonLink || "/"}
                    className="btn-outline mt-8 w-72 py-2 text-center self-center md:self-start"
                  >
                    {mushroomsButtonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Blog posts */}
        {/*<div className="container py-36 flex">*/}
        {/*  <div className="flex flex-col w-full">*/}
        {/*    <h3 className="text-3xl text-underline-primary mb-16 text-center">{blogTitle}</h3>*/}
        {/*    {blogPosts && (*/}
        {/*      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 sm:flex-row -mx-3">*/}
        {/*        {blogPosts.map((post) => (*/}
        {/*          <div className="flex flex-col p-3 items-start h-full flex-wrap" key={post.title}>*/}
        {/*            <div className="flex flex-col flex-1 rounded-xl overflow-hidden bg-potato border-4 border-sweetcorn">*/}
        {/*              <div className="flex-initial">*/}
        {/*                {post.featuredImage && (*/}
        {/*                  <div className="relative">*/}
        {/*                    <Image*/}
        {/*                      src={imageBuilder.image(post.featuredImage).url()}*/}
        {/*                      alt={post.title}*/}
        {/*                      width={700}*/}
        {/*                      height={200}*/}
        {/*                      className="m-0"*/}
        {/*                      // fill={true}*/}
        {/*                      style={{ objectFit: "cover", aspectRatio: "4/3" }}*/}
        {/*                    />*/}
        {/*                  </div>*/}
        {/*                )}*/}
        {/*              </div>*/}
        {/*              <div className="flex flex-col flex-1 p-5">*/}
        {/*                <h5 className="text-2xl font-bold mb-2">{post.title}</h5>*/}
        {/*                <h6 className="font-normal mb-3">{post.subtitle}</h6>*/}
        {/*                <p className="text-sm justify-self-end flex-1">{post.excerpt}</p>*/}
        {/*                /!*<div className="flex-1 text-left max-w-lg">*!/*/}
        {/*                /!*  <PortableText value={post.content} />*!/*/}
        {/*                /!*</div>*!/*/}
        {/*                {blogPostButtonText && (*/}
        {/*                  <Link*/}
        {/*                    href={"/blog/" + post.slug}*/}
        {/*                    className="btn-outline mt-8 py-2 text-center justify-self-end"*/}
        {/*                  >*/}
        {/*                    {blogPostButtonText}*/}
        {/*                  </Link>*/}
        {/*                )}*/}
        {/*              </div>*/}
        {/*            </div>*/}
        {/*          </div>*/}
        {/*        ))}*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*    {blogButtonText && (*/}
        {/*      <div className="flex justify-center">*/}
        {/*        <Link href="/blog" className="btn-outline mt-12 py-2">*/}
        {/*          {blogButtonText}*/}
        {/*        </Link>*/}
        {/*      </div>*/}
        {/*    )}*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/* Recipes */}
        <div className="container py-36 flex">
          <div className="flex flex-col w-full">
            <h3 className="text-3xl text-underline-primary mb-16 text-center">{recipesTitle}</h3>
            {recipes && (
              <div className="grid grid-cols-1 md:grid-cols-2 justify-between sm:justify-center xl:justify-between mt-12 gap-x-4 sm:gap-x-8">
                {recipes.map((recipe) => (
                  <Recipe recipe={recipe} key={recipe.slug} />
                ))}
              </div>
            )}
            {recipesButtonText && (
              <div className="flex justify-center">
                <Link href="/recipes" className="btn-outline mt-12 py-2">
                  {recipesButtonText}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/*<div className="bg-green-800 text-white py-16">*/}
        {/*  <div className="container">*/}
        {/*    <PortableText value={content} />*/}
        {/*  </div>*/}
        {/*</div>*/}
      </main>
    </div>
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
  const session = await getIronSession(context.req!, context.res!, {
    cookieName: "iron-session/slurppd",
    password: process.env.SECRET_COOKIE_PASSWORD || ""
  });

  const query = `*[_type == "home-page"][0]`;
  const blogQuery = `*[_type == "blog-post"] | order(publishedAt desc) [0..2]`;
  const recipeQuery = `*[_type == "recipe"] | order(publishedAt desc) [0..3]`;
  const partnersQuery = `*[_type == "partners-page"][0]`;
  const locationQuery = `*[_type == "location"]`;
  // const params = { slug: context.query.slug };
  type IPage = {
    title: string;
    subtitle: string;
    heroBtnText: string;
    content: unknown[];
  };

  const homePage: IPage = (await client.fetch(query)) || {
    title: "",
    subtitle: "",
    heroBtnText: "",
    content: []
  };
  const blogPosts = await client.fetch(blogQuery);
  const recipes = await client.fetch(recipeQuery);
  const partnersPage: PartnersPage = await client.fetch(partnersQuery);
  const locations = await client.fetch(locationQuery);
  return {
    props: {
      ...homePage,
      blogPosts: blogPosts || [],
      recipes: recipes || [],
      partnersPage: partnersPage || null,
      locations: locations || []
    }
  };
};

export default Home;
