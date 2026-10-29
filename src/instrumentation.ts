/**
 * src/instrumentation.ts
 *
 * Boots the Sentry server SDK once per server instance, picking the config that
 * matches the active runtime.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Next hands server render, route handler and server action errors to Sentry
// through this hook. Without it nothing from the App Router server side reports.
export const onRequestError = Sentry.captureRequestError;
