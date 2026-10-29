/**
 * src/sentry.edge.config.ts
 *
 * Sentry init for the Edge runtime (proxy, edge route handlers). Loaded by
 * src/instrumentation.ts. Note that includeLocalVariables is not supported here.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://fbdbeda710712df03bf151b4db01b771@o4512329318400000.ingest.us.sentry.io/4512340504477696",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 1,
});
