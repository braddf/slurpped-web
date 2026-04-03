import React, { useState, useEffect } from "react";
import fetchJson from "../lib/fetchJson";
import { NextApiResponse, NextPage, NextPageContext } from "next";
import { Stripe } from "stripe";
import { FetcherResponse } from "swr/dist/types";
// import './App.css';

type OrderProps = {
  customer: Stripe.Customer;
  prices: Stripe.ApiList<Stripe.Product>;
};

const ProductDisplay: NextPage<OrderProps> = ({ customer, prices }) => {
  // console.log("customer", customer);
  // console.log("prices", prices);
  const subscription = customer?.subscriptions?.data[0];
  const products = prices.data;
  // console.log("subscription", subscription);
  // console.log();
  const currentProduct = products.find(
    // @ts-ignore
    (product) => product.default_price?.id === subscription?.items.data[0].price?.id
  );
  // console.log("currentProduct", currentProduct);

  const subscribe = async (priceId: string) => {
    if (!priceId) return;

    const response: NextApiResponse = await fetchJson("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ priceId })
    });
    if (response.statusCode === 500) {
      console.error(response.statusMessage);
      return;
    }
    // const { url } = response;
    // window.location.href = url;
  };

  return (
    <section className="my-12">
      <div className="flex flex-1 flex-col mb-6">
        <h3>My Subscription</h3>
        <div className="flex flex-1 border border-gray-400 rounded-md p-5 my-4">
          {!subscription && <p>No current subscription active</p>}
          {subscription && (
            <div>
              <h4>{currentProduct?.name}</h4>
              {/*// @ts-ignore*/}
              <h5>{currentProduct?.default_price?.unit_amount / 100}€ / week</h5>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col mb-6">
        <h3>New Subscription</h3>
        {products.map((product) => {
          const isCurrentProduct = product.id === currentProduct?.id;
          return (
            <div
              className={`flex flex-1 border border-gray-400 rounded-md p-5 my-4 ${
                isCurrentProduct ? "border-blue-500 border-4" : ""
              }`}
              key={product.id}
            >
              <div className="flex flex-1 flex-col">
                <h4>{product.name}</h4>
                {/*// @ts-ignore*/}
                <h5>{product.default_price?.unit_amount / 100}€ / week</h5>
              </div>
              {/*// @ts-ignore*/}
              <button
                disabled={isCurrentProduct}
                onClick={() =>
                  subscribe(
                    typeof product.default_price === "string"
                      ? product.default_price
                      : product.default_price?.id || ""
                  )
                }
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
                  isCurrentProduct ? "opacity-50" : ""
                }`}
              >
                {isCurrentProduct ? "Current" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
      {/*<div className="flex flex-1 flex-col">*/}
      {/*  <form action="/api/create-checkout-session" method="POST">*/}
      {/*    /!* Add a hidden field with the lookup_key of your Price *!/*/}
      {/*    <input type="hidden" name="lookup_key" value="tas_edu_sub" />*/}
      {/*    <button*/}
      {/*      id="checkout-and-portal-button"*/}
      {/*      className="px-3 py-1 border border-black rounded-md bg-white text-black"*/}
      {/*      type="submit"*/}
      {/*    >*/}
      {/*      Update Subscription*/}
      {/*    </button>*/}
      {/*  </form>*/}
      {/*</div>*/}
    </section>
  );
};

export const getServerSideProps = async (context: NextPageContext) => {
  const { req, res } = context;
  // const { user } = await fetchJson("/api/user", { req, res });
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");
  headers.append("Cookie", req?.headers.cookie || "");
  const customer = await fetchJson(`${process.env.APP_URL}/api/fetch-customer-data`, {
    headers
  });
  const prices = await fetchJson(`${process.env.APP_URL}/api/get-prices`, {
    headers
  });

  return {
    props: {
      // user,
      customer,
      prices
    }
  };
};

export default ProductDisplay;
