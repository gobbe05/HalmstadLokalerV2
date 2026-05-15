import * as Sentry from "@sentry/react";

// Sentry DSN is a public key - safe to include in client code
const SENTRY_DSN = process.env.VITE_SENTRY_DSN || "";

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log("Sentry DSN not configured - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Capture 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // Capture 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignore network errors that are expected
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          return null;
        }
        if (error.message.includes("NetworkError")) {
          return null;
        }
      }
      
      return event;
    },
  });
}

// Helper to capture errors with context
export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error("Error captured:", error);
  
  if (context) {
    Sentry.setContext("additional", context);
  }
  
  Sentry.captureException(error);
}

// Helper to set user context when logged in
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

// Helper to clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Helper to add breadcrumb for user actions
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

export { Sentry };
