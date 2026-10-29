/**
 * src/instrumentation-client.ts
 *
 * Sentry browser SDK init. Runs after the document loads but before React
 * hydration, so it captures errors from the earliest part of the lifecycle.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://fbdbeda710712df03bf151b4db01b771@o4512329318400000.ingest.us.sentry.io/4512340504477696",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.replayIntegration()],
});

// Gives Sentry navigation breadcrumbs and transaction names for App Router routes.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
