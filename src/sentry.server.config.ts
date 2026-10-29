/**
 * src/sentry.server.config.ts
 *
 * Sentry init for the Node.js server runtime. Loaded by src/instrumentation.ts.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    "https://fbdbeda710712df03bf151b4db01b771@o4512329318400000.ingest.us.sentry.io/4512340504477696",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 1,
  // includeLocalVariables is deliberately left off. It attaches local variable
  // values to stack frames, so a throw near the auth code, the axios client or
  // the Steam integration could carry a token or key into Sentry.
});
