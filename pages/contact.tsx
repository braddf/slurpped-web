import React, { useContext } from "react";
import Head from "next/head";
import Link from "next/link";
import { SettingsContext } from "./_app";

export default function Contact() {
  const settings = useContext(SettingsContext);

  return (
    <div>
      <Head>
        <title>Contact — Slurpped</title>
      </Head>

      <div className="container pt-12 pb-24 max-w-2xl">
        <h1 className="text-6xl text-soil mb-4">Get in touch</h1>
        <p className="text-broth text-lg mb-12">
          Questions about an order, a delivery, or anything else — we&apos;re here.
        </p>

        <div className="flex flex-col gap-8">
          {settings?.contactEmail && (
            <div className="border-l-4 border-sweetcorn pl-6">
              <p className="text-sm font-medium text-broth uppercase tracking-wider mb-1">Email</p>
              <Link
                href={`mailto:${settings.contactEmail}`}
                className="text-xl text-soil hover:text-carrot transition-colors"
              >
                {settings.contactEmail}
              </Link>
            </div>
          )}

          {settings?.contactPhone && (
            <div className="border-l-4 border-sweetcorn pl-6">
              <p className="text-sm font-medium text-broth uppercase tracking-wider mb-1">Phone</p>
              <Link
                href={`tel:${settings.contactPhone}`}
                className="text-xl text-soil hover:text-carrot transition-colors"
              >
                {settings.contactPhone}
              </Link>
            </div>
          )}

          {settings?.contactAddress && (
            <div className="border-l-4 border-sweetcorn pl-6">
              <p className="text-sm font-medium text-broth uppercase tracking-wider mb-1">
                Address
              </p>
              <p className="text-soil">{settings.contactAddress}</p>
            </div>
          )}
        </div>

        <div className="mt-16">
          <Link
            href="/order"
            className="bg-carrot text-chickpea px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Order a kit →
          </Link>
        </div>
      </div>
    </div>
  );
}
