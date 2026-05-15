'use client'
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Något gick fel
          </h1>
          <p className="text-muted-foreground">
            Ett oväntat fel har inträffat. Vårt team har informerats.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="bg-muted p-4 rounded-lg text-left">
            <p className="text-sm font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Försök igen
          </Button>
          <Button 
            onClick={() => window.location.href = "/"} 
            variant="outline"
          >
            Gå till startsidan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback 
          error={error as Error} 
          resetError={resetError} 
        />
      )}
      onError={(error) => {
        console.error("ErrorBoundary caught:", error);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

