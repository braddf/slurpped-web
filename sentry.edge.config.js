// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn:
    SENTRY_DSN ||
    "https://6d5bbfc7b6e04f88b27979929f3d9dfc@o4504479213289472.ingest.sentry.io/4504479215583232",
  // Adjust this value in production, or use tracesSampler for greater control
  // tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
  tracesSampler: (samplingContext) => {
    if (samplingContext.request?.headers?.host?.search("localhost")) {
      return 0;
    }
    if (samplingContext.request?.url?.search("localhost")) {
      return 0;
    }
    if (samplingContext.transactionContext.name.search("error")) {
      // These are important - take a big sample
      return 1;
    }
    if (samplingContext.transactionContext.status?.search("error")) {
      return 1;
    }
    // Default sample rate
    return 0.001;
  },
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.01,
  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  integrations: [new Sentry.Replay()],

  environment: process.env.NEXT_PUBLIC_SENTRY_ENV_LABEL || process.env.NODE_ENV
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
