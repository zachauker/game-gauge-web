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
  // Attaches local variable values to stack frames. See the note in the setup
  // report: this can carry secrets into Sentry if a throw happens near one.
  includeLocalVariables: true,
});
